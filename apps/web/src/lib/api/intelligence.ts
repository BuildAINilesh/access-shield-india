/** Public AN Intelligence client helpers (AN-F004). */

const apiBase = () => process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export interface IntelligenceIssueSummary {
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

export interface IntelligenceIssueDetail extends IntelligenceIssueSummary {
  versions: Array<{ versionRange: string; fixedInVersion: string | null }>;
}

export async function searchIntelligenceIssues(params: {
  q?: string;
  package?: string;
  severity?: string;
  limit?: number;
}): Promise<{ issues: IntelligenceIssueSummary[]; total: number }> {
  const url = new URL(`${apiBase()}/api/v1/intelligence/issues`);
  if (params.q) url.searchParams.set('q', params.q);
  if (params.package) url.searchParams.set('package', params.package);
  if (params.severity) url.searchParams.set('severity', params.severity);
  if (params.limit) url.searchParams.set('limit', String(params.limit));

  const res = await fetch(url.toString(), { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to search intelligence issues');
  const json = (await res.json()) as { data: { issues: IntelligenceIssueSummary[]; total: number } };
  return json.data;
}

export async function getIntelligenceIssue(
  anId: string,
): Promise<IntelligenceIssueDetail | null> {
  const res = await fetch(`${apiBase()}/api/v1/intelligence/issues/${encodeURIComponent(anId)}`, {
    cache: 'no-store',
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Failed to load intelligence issue');
  const json = (await res.json()) as { data: IntelligenceIssueDetail };
  return json.data;
}

export async function submitIntelligenceReport(input: {
  packageName: string;
  version?: string;
  description: string;
  reporterEmail?: string;
}): Promise<{ id: string; status: string }> {
  const res = await fetch(`${apiBase()}/api/v1/intelligence/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { detail?: string } | null;
    throw new Error(body?.detail ?? 'Failed to submit report');
  }
  const json = (await res.json()) as { data: { id: string; status: string } };
  return json.data;
}
