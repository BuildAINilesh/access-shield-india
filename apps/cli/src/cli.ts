#!/usr/bin/env node
/**
 * @accessiblenow/scan — CLI for AN OSS package.json a11y scans (AN-F002)
 *
 * Usage:
 *   accessiblenow-scan [path/to/package.json]
 *   accessiblenow-scan scan ./package.json --json --fail-on=high
 *   accessiblenow-scan search react-select
 *   accessiblenow-scan search --package=antd --severity=medium
 */

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { postOssScan, searchIssues } from './api.js';
import { exitCodeForScan, formatIssuesText, formatScanJson, formatScanText } from './format.js';

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
}

function printHelp(): void {
  process.stdout.write(`AccessibleNow OSS scanner (@accessiblenow/scan)

Usage:
  accessiblenow-scan [package.json]           Scan dependencies (default: ./package.json)
  accessiblenow-scan scan [package.json]      Same as above
  accessiblenow-scan search <query>           Search intelligence DB
  accessiblenow-scan search --package=name    Filter by package
  accessiblenow-scan --help

Options:
  --json                 Machine-readable JSON output
  --fail-on=<severity>   Exit 1 if any issue at or above severity (critical|high|medium|low)
  --no-dev               Skip devDependencies
  --include-optional     Include optionalDependencies

Env:
  ACCESSIBLENOW_API_URL  API base (default http://localhost:4000)
`);
}

function getFlag(args: string[], name: string): boolean {
  return args.includes(name);
}

function getOpt(args: string[], name: string): string | undefined {
  const pref = `${name}=`;
  const hit = args.find((a) => a.startsWith(pref));
  return hit ? hit.slice(pref.length) : undefined;
}

async function loadPackageJson(path: string): Promise<PackageJson> {
  const raw = await readFile(path, 'utf8');
  return JSON.parse(raw) as PackageJson;
}

async function runScan(args: string[]): Promise<number> {
  const positional = args.filter((a) => !a.startsWith('-'));
  const pkgPath = resolve(positional[0] ?? 'package.json');
  const asJson = getFlag(args, '--json');
  const noDev = getFlag(args, '--no-dev');
  const includeOptional = getFlag(args, '--include-optional');
  const failOn = getOpt(args, '--fail-on');

  const pkg = await loadPackageJson(pkgPath);
  const dependencies = { ...(pkg.dependencies ?? {}) };
  if (includeOptional) {
    Object.assign(dependencies, pkg.optionalDependencies ?? {});
  }

  const result = await postOssScan({
    dependencies,
    devDependencies: noDev ? undefined : pkg.devDependencies,
  });

  process.stdout.write((asJson ? formatScanJson(result) : formatScanText(result)) + '\n');
  return exitCodeForScan(result, failOn);
}

async function runSearch(args: string[]): Promise<number> {
  const positional = args.filter((a) => !a.startsWith('-'));
  const q = positional[0];
  const packageName = getOpt(args, '--package');
  const severity = getOpt(args, '--severity');
  const asJson = getFlag(args, '--json');

  if (!q && !packageName && !severity) {
    process.stderr.write('Provide a search query or --package / --severity filter.\n');
    return 2;
  }

  const result = await searchIssues({ q, packageName, severity });
  if (asJson) {
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  } else {
    process.stdout.write(formatIssuesText(result.issues) + '\n');
    process.stdout.write(`\nTotal: ${result.total}\n`);
  }
  return 0;
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);

  if (argv.length === 0 || getFlag(argv, '--help') || getFlag(argv, '-h')) {
    if (argv.length === 0) {
      process.exitCode = await runScan([]);
      return;
    }
    printHelp();
    return;
  }

  const cmd = argv[0];
  if (cmd === 'scan') {
    process.exitCode = await runScan(argv.slice(1));
    return;
  }
  if (cmd === 'search') {
    process.exitCode = await runSearch(argv.slice(1));
    return;
  }
  if (cmd === 'help') {
    printHelp();
    return;
  }

  // Bare path or flags → scan
  process.exitCode = await runScan(argv);
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  process.stderr.write(`Error: ${message}\n`);
  process.exitCode = 1;
});
