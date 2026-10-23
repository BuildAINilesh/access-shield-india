/**
 * AN OSS — match package.json dependencies against a11y intelligence DB (AN-F002).
 */

import type { Database } from '@accessshield/db';
import { a11yPackageIssues, a11yPackageVersions } from '@accessshield/db';
import { and, eq, ilike, inArray, or, sql } from 'drizzle-orm';
import semver from 'semver';

export interface DependencyMap {
  [name: string]: string;
}

export interface MatchedOssIssue {
  anId: string;
  packageName: string;
  installedVersion: string;
  title: string;
  severity: string;
  issueType: string;
  atAffected: string[] | null;
  description: string;
  fixStatus: string;
  workaround: string | null;
  versionRange: string;
  fixedInVersion: string | null;
}

export interface OssScanResult {
  issues: MatchedOssIssue[];
  riskScore: number;
  scannedPackageCount: number;
  matchedPackageCount: number;
}

/** Strip npm range prefixes (^, ~) to a concrete version when possible. */
export function coerceInstalledVersion(raw: string): string | null {
  const cleaned = raw
    .trim()
    .replace(/^workspace:/, '')
    .replace(/^npm:/, '');
  if (cleaned === '*' || cleaned.startsWith('file:') || cleaned.startsWith('git')) {
    return null;
  }
  const coerced = semver.coerce(cleaned);
  return coerced ? coerced.version : null;
}

export function versionMatchesRange(installed: string, range: string): boolean {
  if (range === '*' || range.trim() === '') return true;
  const version = coerceInstalledVersion(installed);
  if (!version) return false;
  try {
    return semver.satisfies(version, range, { includePrerelease: true });
  } catch {
    return false;
  }
}

function severityWeight(severity: string): number {
  switch (severity.toLowerCase()) {
    case 'critical':
      return 40;
    case 'high':
      return 25;
    case 'medium':
      return 12;
    case 'low':
      return 5;
    default:
      return 8;
  }
}

export function computeRiskScore(issues: MatchedOssIssue[]): number {
  if (issues.length === 0) return 0;
  const raw = issues.reduce((sum, issue) => sum + severityWeight(issue.severity), 0);
  return Math.min(100, raw);
}

function resolveInstalled(combined: DependencyMap, packageName: string): string | undefined {
  if (combined[packageName]) return combined[packageName];
  const key = Object.keys(combined).find((k) => k.toLowerCase() === packageName.toLowerCase());
  return key ? combined[key] : undefined;
}

export async function scanDependencies(
  db: Database,
  dependencies: DependencyMap,
  devDependencies?: DependencyMap,
): Promise<OssScanResult> {
  const combined: DependencyMap = { ...devDependencies, ...dependencies };
  const names = Object.keys(combined);
  if (names.length === 0) {
    return { issues: [], riskScore: 0, scannedPackageCount: 0, matchedPackageCount: 0 };
  }

  const rows = await db
    .select({
      anId: a11yPackageIssues.anId,
      packageName: a11yPackageIssues.packageName,
      title: a11yPackageIssues.title,
      severity: a11yPackageIssues.severity,
      issueType: a11yPackageIssues.issueType,
      atAffected: a11yPackageIssues.atAffected,
      description: a11yPackageIssues.description,
      fixStatus: a11yPackageIssues.fixStatus,
      workaround: a11yPackageIssues.workaround,
      versionRange: a11yPackageVersions.versionRange,
      fixedInVersion: a11yPackageVersions.fixedInVersion,
    })
    .from(a11yPackageIssues)
    .innerJoin(a11yPackageVersions, eq(a11yPackageVersions.issueId, a11yPackageIssues.id))
    .where(inArray(a11yPackageIssues.packageName, names));

  const issues: MatchedOssIssue[] = [];
  const matchedPackages = new Set<string>();

  for (const row of rows) {
    const installedRaw = resolveInstalled(combined, row.packageName);
    if (!installedRaw) continue;
    if (!versionMatchesRange(installedRaw, row.versionRange)) continue;

    matchedPackages.add(row.packageName);
    issues.push({
      anId: row.anId,
      packageName: row.packageName,
      installedVersion: coerceInstalledVersion(installedRaw) ?? installedRaw,
      title: row.title,
      severity: row.severity,
      issueType: row.issueType,
      atAffected: row.atAffected,
      description: row.description,
      fixStatus: row.fixStatus,
      workaround: row.workaround,
      versionRange: row.versionRange,
      fixedInVersion: row.fixedInVersion,
    });
  }

  issues.sort((a, b) => severityWeight(b.severity) - severityWeight(a.severity));

  return {
    issues,
    riskScore: computeRiskScore(issues),
    scannedPackageCount: names.length,
    matchedPackageCount: matchedPackages.size,
  };
}

export async function searchIntelligenceIssues(
  db: Database,
  opts: { q?: string; packageName?: string; severity?: string; limit?: number },
) {
  const limit = Math.min(opts.limit ?? 50, 100);
  const conditions = [];

  if (opts.packageName) {
    conditions.push(ilike(a11yPackageIssues.packageName, opts.packageName));
  }
  if (opts.severity) {
    conditions.push(eq(a11yPackageIssues.severity, opts.severity));
  }
  if (opts.q) {
    const pattern = `%${opts.q}%`;
    conditions.push(
      or(
        ilike(a11yPackageIssues.packageName, pattern),
        ilike(a11yPackageIssues.title, pattern),
        ilike(a11yPackageIssues.anId, pattern),
        ilike(a11yPackageIssues.description, pattern),
      )!,
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const base = db
    .select({
      anId: a11yPackageIssues.anId,
      packageName: a11yPackageIssues.packageName,
      title: a11yPackageIssues.title,
      severity: a11yPackageIssues.severity,
      issueType: a11yPackageIssues.issueType,
      atAffected: a11yPackageIssues.atAffected,
      description: a11yPackageIssues.description,
      fixStatus: a11yPackageIssues.fixStatus,
      workaround: a11yPackageIssues.workaround,
    })
    .from(a11yPackageIssues)
    .limit(limit)
    .orderBy(sql`${a11yPackageIssues.packageName} asc`);

  const issues = whereClause ? await base.where(whereClause) : await base;

  return { issues, total: issues.length };
}

export async function getIntelligenceIssueByAnId(db: Database, anId: string) {
  const [issue] = await db
    .select({
      anId: a11yPackageIssues.anId,
      packageName: a11yPackageIssues.packageName,
      title: a11yPackageIssues.title,
      severity: a11yPackageIssues.severity,
      issueType: a11yPackageIssues.issueType,
      atAffected: a11yPackageIssues.atAffected,
      description: a11yPackageIssues.description,
      fixStatus: a11yPackageIssues.fixStatus,
      workaround: a11yPackageIssues.workaround,
      id: a11yPackageIssues.id,
    })
    .from(a11yPackageIssues)
    .where(eq(a11yPackageIssues.anId, anId))
    .limit(1);

  if (!issue) return null;

  const versions = await db
    .select({
      versionRange: a11yPackageVersions.versionRange,
      fixedInVersion: a11yPackageVersions.fixedInVersion,
    })
    .from(a11yPackageVersions)
    .where(eq(a11yPackageVersions.issueId, issue.id));

  return {
    anId: issue.anId,
    packageName: issue.packageName,
    title: issue.title,
    severity: issue.severity,
    issueType: issue.issueType,
    atAffected: issue.atAffected,
    description: issue.description,
    fixStatus: issue.fixStatus,
    workaround: issue.workaround,
    versions,
  };
}
