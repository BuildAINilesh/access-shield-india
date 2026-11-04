/**
 * GitHub App JWT + Contents API apply for AN Fix (AN-F005).
 */

import { createHmac, timingSafeEqual } from 'crypto';
import type { Database } from '@accessshield/db';
import { fixApplications, fixSuggestions, githubInstallations } from '@accessshield/db';
import { and, eq, isNull } from 'drizzle-orm';
import { importPKCS8, SignJWT } from 'jose';
import { logger } from '../lib/logger';

export interface GitHubAppConfig {
  appId: string;
  privateKeyPem: string;
  slug: string;
  clientId?: string;
}

export function getGitHubAppConfig(): GitHubAppConfig | null {
  const appId = process.env.GITHUB_APP_ID?.trim();
  const privateKeyPem = process.env.GITHUB_APP_PRIVATE_KEY?.replace(/\\n/g, '\n')?.trim();
  const slug = process.env.GITHUB_APP_SLUG?.trim();
  if (!appId || !privateKeyPem || !slug) return null;
  return {
    appId,
    privateKeyPem,
    slug,
    clientId: process.env.GITHUB_APP_CLIENT_ID?.trim(),
  };
}

export function signInstallState(orgId: string, secret: string): string {
  const payload = Buffer.from(JSON.stringify({ orgId, ts: Date.now() })).toString('base64url');
  const sig = createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export function verifyInstallState(
  state: string,
  secret: string,
  maxAgeMs = 15 * 60 * 1000,
): { orgId: string } | null {
  const [payload, sig] = state.split('.');
  if (!payload || !sig) return null;
  const expected = createHmac('sha256', secret).update(payload).digest('base64url');
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      orgId?: string;
      ts?: number;
    };
    if (!parsed.orgId || typeof parsed.ts !== 'number') return null;
    if (Date.now() - parsed.ts > maxAgeMs) return null;
    return { orgId: parsed.orgId };
  } catch {
    return null;
  }
}

export function buildGitHubInstallUrl(config: GitHubAppConfig, state: string): string {
  const params = new URLSearchParams({ state });
  return `https://github.com/apps/${encodeURIComponent(config.slug)}/installations/new?${params}`;
}

async function createAppJwt(config: GitHubAppConfig): Promise<string> {
  const key = await importPKCS8(config.privateKeyPem, 'RS256');
  return new SignJWT({})
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuedAt()
    .setExpirationTime('9m')
    .setIssuer(config.appId)
    .sign(key);
}

async function getInstallationToken(
  config: GitHubAppConfig,
  installationId: number,
): Promise<string> {
  const jwt = await createAppJwt(config);
  const res = await fetch(
    `https://api.github.com/app/installations/${installationId}/access_tokens`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${jwt}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'AccessibleNow-Fix/1.0',
      },
    },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub installation token failed: HTTP ${res.status} ${text.slice(0, 200)}`);
  }
  const json = (await res.json()) as { token: string };
  return json.token;
}

export async function getOrgInstallation(db: Database, orgId: string) {
  const [row] = await db
    .select()
    .from(githubInstallations)
    .where(
      and(eq(githubInstallations.organisationId, orgId), isNull(githubInstallations.deletedAt)),
    )
    .limit(1);
  return row ?? null;
}

export interface ApplyFixInput {
  orgId: string;
  userId: string;
  fixId: string;
  repoFullName: string;
  filePath: string;
  branch?: string;
  prNumber?: number;
  /** When set, commit this content instead of the cached suggestion body */
  contentOverride?: string;
}

export interface ApplyFixResult {
  applicationId: string;
  commitSha: string;
  htmlUrl: string;
  repo: string;
  filePath: string;
}

export async function applyFixToGitHub(
  db: Database,
  input: ApplyFixInput,
): Promise<ApplyFixResult> {
  const config = getGitHubAppConfig();
  if (!config) {
    throw Object.assign(new Error('GitHub App is not configured on the server'), {
      status: 503,
      code: 'github-not-configured',
    });
  }

  const installation = await getOrgInstallation(db, input.orgId);
  if (!installation) {
    throw Object.assign(
      new Error('Connect the GitHub App under Settings → Integrations before applying fixes'),
      { status: 422, code: 'github-not-connected' },
    );
  }

  const [fix] = await db
    .select()
    .from(fixSuggestions)
    .where(
      and(eq(fixSuggestions.id, input.fixId), eq(fixSuggestions.organisationId, input.orgId)),
    )
    .limit(1);

  if (!fix) {
    throw Object.assign(new Error('Fix suggestion not found'), {
      status: 404,
      code: 'not-found',
    });
  }

  const repoMatch = /^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)$/.exec(input.repoFullName.trim());
  if (!repoMatch) {
    throw Object.assign(new Error('repoFullName must be owner/repo'), {
      status: 400,
      code: 'validation-error',
    });
  }

  const owner = repoMatch[1]!;
  const repo = repoMatch[2]!;
  const filePath = input.filePath.replace(/^\//, '');
  const branch = input.branch?.trim() || 'main';
  const token = await getInstallationToken(config, installation.installationId);

  const getUrl = new URL(
    `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(filePath).replace(/%2F/g, '/')}`,
  );
  getUrl.searchParams.set('ref', branch);

  const getRes = await fetch(getUrl, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'AccessibleNow-Fix/1.0',
    },
  });

  if (!getRes.ok && getRes.status !== 404) {
    const text = await getRes.text();
    throw Object.assign(
      new Error(`Failed to read file from GitHub: HTTP ${getRes.status} ${text.slice(0, 200)}`),
      { status: 502, code: 'github-api-error' },
    );
  }

  const existing =
    getRes.status === 404
      ? null
      : ((await getRes.json()) as { sha: string; type: string; encoding?: string });

  if (existing && existing.type !== 'file') {
    throw Object.assign(new Error('Path is not a file in the repository'), {
      status: 422,
      code: 'not-a-file',
    });
  }

  const fileContent = input.contentOverride?.trim() ? input.contentOverride : fix.fixCode;
  const contentBase64 = Buffer.from(fileContent, 'utf8').toString('base64');
  const putRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(filePath).replace(/%2F/g, '/')}`,
    {
      method: 'PUT',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'AccessibleNow-Fix/1.0',
      },
      body: JSON.stringify({
        message: `fix(a11y): ${fix.ruleId} via AccessibleNow`,
        content: contentBase64,
        branch,
        ...(existing?.sha ? { sha: existing.sha } : {}),
      }),
    },
  );

  if (!putRes.ok) {
    const text = await putRes.text();
    logger.warn({ status: putRes.status, text: text.slice(0, 300) }, 'GitHub Contents PUT failed');
    throw Object.assign(
      new Error(`Failed to commit fix to GitHub: HTTP ${putRes.status}`),
      { status: 502, code: 'github-api-error' },
    );
  }

  const putJson = (await putRes.json()) as {
    commit?: { sha?: string; html_url?: string };
    content?: { html_url?: string; sha?: string };
  };

  const commitSha = putJson.commit?.sha ?? putJson.content?.sha ?? '';
  const htmlUrl =
    putJson.commit?.html_url ??
    putJson.content?.html_url ??
    `https://github.com/${owner}/${repo}/blob/${branch}/${filePath}`;

  const [application] = await db
    .insert(fixApplications)
    .values({
      organisationId: input.orgId,
      fixId: fix.id,
      repo: `${owner}/${repo}`,
      prNumber: input.prNumber ?? null,
      filePath,
      appliedBy: input.userId,
      commitSha: commitSha || null,
    })
    .returning({ id: fixApplications.id });

  return {
    applicationId: application!.id,
    commitSha,
    htmlUrl,
    repo: `${owner}/${repo}`,
    filePath,
  };
}
