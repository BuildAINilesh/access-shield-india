export interface OssScanPayload {
  dependencies: Record<string, string>;
  devDependencies?: Record<string, string>;
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

export interface IntelligenceIssue {
  anId: string;
  packageName: string;
  title: string;
  severity: string;
  issueType: string;
  atAffected: string[] | null;
  description: string;
  fixStatus: string;
  workaround: string | null;
}

function apiBase(): string {
  return (process.env.ACCESSIBLENOW_API_URL ?? process.env.AN_API_URL ?? 'http://localhost:4000').replace(
    /\/$/,
    '',
  );
}

async function parseJson<T>(res: Response): Promise<T> {
  const body = (await res.json()) as { data?: T; title?: string; detail?: string };
  if (!res.ok) {
    const msg = body.detail ?? body.title ?? `HTTP ${res.status}`;
    throw new Error(msg);
  }
  if (body.data === undefined) {
    throw new Error('Unexpected API response (missing data)');
  }
  return body.data;
}

export async function postOssScan(payload: OssScanPayload): Promise<OssScanResult> {
  const res = await fetch(`${apiBase()}/api/v1/oss/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseJson<OssScanResult>(res);
}

export async function searchIssues(opts: {
  q?: string;
  packageName?: string;
  severity?: string;
}): Promise<{ issues: IntelligenceIssue[]; total: number }> {
  const params = new URLSearchParams();
  if (opts.q) params.set('q', opts.q);
  if (opts.packageName) params.set('package', opts.packageName);
  if (opts.severity) params.set('severity', opts.severity);
  const qs = params.toString();
  const res = await fetch(`${apiBase()}/api/v1/intelligence/issues${qs ? `?${qs}` : ''}`, {
    headers: { Accept: 'application/json' },
  });
  return parseJson<{ issues: IntelligenceIssue[]; total: number }>(res);
}
