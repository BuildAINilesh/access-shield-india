#!/usr/bin/env node
/**
 * AccessibleNow OSS PR Gate scanner (AN-F002).
 * Reads package.json paths from PACKAGE_JSON_PATHS, calls POST /api/v1/oss/scan,
 * writes markdown + GitHub Action outputs.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const SEVERITY_ORDER = ['critical', 'high', 'medium', 'low'];

function severityRank(s) {
  const idx = SEVERITY_ORDER.indexOf(String(s).toLowerCase());
  return idx === -1 ? 99 : idx;
}

function apiBase() {
  const raw = process.env.ACCESSIBLENOW_API_URL ?? process.env.AN_API_URL ?? '';
  if (!raw.trim()) {
    throw new Error('ACCESSIBLENOW_API_URL is required');
  }
  return raw.replace(/\/$/, '');
}

function appendOutput(key, value) {
  const out = process.env.GITHUB_OUTPUT;
  if (!out) return;
  writeFileSync(out, `${key}=${value}\n`, { flag: 'a' });
}

function loadPackageJson(path) {
  const raw = readFileSync(path, 'utf8');
  return JSON.parse(raw);
}

async function scanOne(pkgPath, includeDev) {
  const pkg = loadPackageJson(pkgPath);
  const payload = {
    dependencies: { ...(pkg.dependencies ?? {}) },
    ...(includeDev ? { devDependencies: pkg.devDependencies ?? {} } : {}),
  };

  const depCount =
    Object.keys(payload.dependencies).length +
    Object.keys(payload.devDependencies ?? {}).length;
  if (depCount === 0) {
    return {
      path: pkgPath,
      result: {
        issues: [],
        riskScore: 0,
        scannedPackageCount: 0,
        matchedPackageCount: 0,
      },
    };
  }

  const res = await fetch(`${apiBase()}/api/v1/oss/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await res.json();
  if (!res.ok) {
    throw new Error(body.detail ?? body.title ?? `OSS scan failed (${res.status}) for ${pkgPath}`);
  }
  return { path: pkgPath, result: body.data };
}

function formatMarkdown(scans, failOn, meta) {
  const allIssues = scans.flatMap((s) =>
    s.result.issues.map((issue) => ({ ...issue, source: s.path })),
  );
  const maxRisk = scans.reduce((m, s) => Math.max(m, s.result.riskScore ?? 0), 0);
  const totalScanned = scans.reduce((m, s) => m + (s.result.scannedPackageCount ?? 0), 0);
  const thresholdHit =
    failOn &&
    allIssues.some((i) => severityRank(i.severity) <= severityRank(failOn));

  const lines = [];
  lines.push('<!-- accessiblenow-oss-pr-gate -->');
  lines.push('## AccessibleNow OSS PR Gate');
  lines.push('');
  lines.push(
    thresholdHit
      ? `**Status:** ❌ failed (\`fail-on=${failOn}\`)`
      : '**Status:** ✅ passed',
  );
  lines.push('');
  lines.push(
    `| Manifests | Deps scanned | Issues | Risk score |`,
  );
  lines.push(`| ---: | ---: | ---: | ---: |`);
  lines.push(
    `| ${scans.length} | ${totalScanned} | ${allIssues.length} | **${maxRisk}/100** |`,
  );
  lines.push('');

  if (allIssues.length === 0) {
    lines.push('No known accessibility risks matched in changed dependencies.');
  } else {
    lines.push('| Severity | ID | Package | Manifest | Title | Fix |');
    lines.push('| --- | --- | --- | --- | --- | --- |');
    const sorted = [...allIssues].sort(
      (a, b) => severityRank(a.severity) - severityRank(b.severity),
    );
    for (const issue of sorted) {
      const fix =
        issue.fixedInVersion != null
          ? `Upgrade to \`${issue.fixedInVersion}+\``
          : issue.workaround
            ? issue.workaround.replace(/\|/g, '\\|').slice(0, 120)
            : '—';
      lines.push(
        `| ${issue.severity} | \`${issue.anId}\` | \`${issue.packageName}@${issue.installedVersion}\` | \`${issue.source}\` | ${issue.title.replace(/\|/g, '\\|')} | ${fix} |`,
      );
    }
    lines.push('');
    lines.push(
      '<details><summary>Workarounds & details</summary>',
    );
    lines.push('');
    for (const issue of sorted) {
      lines.push(`### ${issue.anId} — ${issue.title}`);
      lines.push('');
      lines.push(issue.description);
      lines.push('');
      if (issue.workaround) lines.push(`**Workaround:** ${issue.workaround}`);
      if (issue.fixedInVersion) lines.push(`**Fixed in:** \`${issue.fixedInVersion}\``);
      if (issue.atAffected?.length) {
        lines.push(`**AT affected:** ${issue.atAffected.join(', ')}`);
      }
      lines.push('');
    }
    lines.push('</details>');
  }

  lines.push('');
  lines.push('---');
  lines.push(
    `_Powered by [AccessibleNow OSS](https://accessiblenow.in/features/open-source) · API \`${meta.api}\` · commit \`${meta.sha?.slice(0, 7) ?? 'n/a'}\`_`,
  );
  return { markdown: lines.join('\n'), maxRisk, issueCount: allIssues.length, failed: Boolean(thresholdHit) };
}

async function main() {
  const paths = (process.env.PACKAGE_JSON_PATHS ?? '')
    .split(/\s+/)
    .map((p) => p.trim())
    .filter(Boolean);
  const includeDev = (process.env.INCLUDE_DEV ?? 'true').toLowerCase() !== 'false';
  const failOn = (process.env.FAIL_ON ?? '').trim() || undefined;

  if (paths.length === 0) {
    appendOutput('risk-score', '0');
    appendOutput('issue-count', '0');
    appendOutput('failed', 'false');
    appendOutput('comment-body-path', '');
    return;
  }

  const scans = [];
  for (const p of paths) {
    const abs = resolve(p);
    console.log(`Scanning ${p}…`);
    scans.push(await scanOne(abs, includeDev));
  }

  const { markdown, maxRisk, issueCount, failed } = formatMarkdown(scans, failOn, {
    api: apiBase(),
    sha: process.env.GITHUB_SHA,
  });

  const outDir = resolve(process.cwd(), '.accessiblenow');
  mkdirSync(outDir, { recursive: true });
  const commentPath = resolve(outDir, 'oss-pr-gate-comment.md');
  writeFileSync(commentPath, markdown, 'utf8');

  // Relative path is more portable for later steps
  const relComment = '.accessiblenow/oss-pr-gate-comment.md';
  appendOutput('risk-score', String(maxRisk));
  appendOutput('issue-count', String(issueCount));
  appendOutput('failed', failed ? 'true' : 'false');
  appendOutput('comment-body-path', relComment);

  console.log(markdown);
  console.log(`\nRisk=${maxRisk} issues=${issueCount} failed=${failed}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
