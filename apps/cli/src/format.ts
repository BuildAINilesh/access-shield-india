import type { IntelligenceIssue, MatchedOssIssue, OssScanResult } from './api.js';

const SEVERITY_ORDER = ['critical', 'high', 'medium', 'low'] as const;

function pad(s: string, n: number): string {
  return s.length >= n ? s.slice(0, n) : s + ' '.repeat(n - s.length);
}

export function formatScanText(result: OssScanResult): string {
  const lines: string[] = [];
  lines.push(`AccessibleNow OSS scan`);
  lines.push(
    `Packages scanned: ${result.scannedPackageCount} | Matched: ${result.matchedPackageCount} | Risk score: ${result.riskScore}/100`,
  );
  lines.push('');

  if (result.issues.length === 0) {
    lines.push('No known accessibility package issues matched.');
    return lines.join('\n');
  }

  lines.push(pad('SEVERITY', 10) + pad('ID', 18) + pad('PACKAGE', 28) + 'TITLE');
  lines.push('-'.repeat(90));

  const sorted = [...result.issues].sort(
    (a, b) =>
      SEVERITY_ORDER.indexOf(a.severity as (typeof SEVERITY_ORDER)[number]) -
      SEVERITY_ORDER.indexOf(b.severity as (typeof SEVERITY_ORDER)[number]),
  );

  for (const issue of sorted) {
    lines.push(
      pad(issue.severity.toUpperCase(), 10) +
        pad(issue.anId, 18) +
        pad(`${issue.packageName}@${issue.installedVersion}`, 28) +
        issue.title,
    );
    if (issue.workaround) {
      lines.push(`  → Workaround: ${issue.workaround}`);
    }
    if (issue.fixedInVersion) {
      lines.push(`  → Fixed in: ${issue.fixedInVersion}`);
    }
  }

  return lines.join('\n');
}

export function formatScanJson(result: OssScanResult): string {
  return JSON.stringify(result, null, 2);
}

export function formatIssuesText(issues: IntelligenceIssue[]): string {
  if (issues.length === 0) return 'No issues found.';
  return issues
    .map(
      (i) =>
        `${i.severity.toUpperCase()}  ${i.anId}  ${i.packageName}\n  ${i.title}\n  ${i.description.slice(0, 160)}${i.description.length > 160 ? '…' : ''}`,
    )
    .join('\n\n');
}

export function exitCodeForScan(result: OssScanResult, failOn: string | undefined): number {
  if (!failOn) return 0;
  const threshold = failOn.toLowerCase();
  const rank = (s: string) => {
    const idx = SEVERITY_ORDER.indexOf(s as (typeof SEVERITY_ORDER)[number]);
    return idx === -1 ? 99 : idx;
  };
  const thresholdRank = rank(threshold);
  if (thresholdRank === 99) return 0;
  const hit = result.issues.some((i: MatchedOssIssue) => rank(i.severity) <= thresholdRank);
  return hit ? 1 : 0;
}
