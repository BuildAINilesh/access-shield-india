'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { getAccessToken } from '@/lib/api/client';
import { Button, Input } from '@accessshield/ui';

interface ApplyGitHubFixProps {
  ruleId: string;
  /** Fixed HTML / code to commit */
  fixedCode: string;
  wcagCriterion?: string | null;
}

async function isGitHubConnected(token: string): Promise<boolean> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/integrations/github`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) return false;
  const json = (await response.json()) as { data: { connected: boolean } };
  return json.data.connected === true;
}

export function ApplyGitHubFix({ ruleId, fixedCode, wcagCriterion }: ApplyGitHubFixProps) {
  const [repo, setRepo] = useState('');
  const [filePath, setFilePath] = useState('');
  const [branch, setBranch] = useState('main');
  const [message, setMessage] = useState<string | null>(null);
  const [commitUrl, setCommitUrl] = useState<string | null>(null);

  const { data: connected } = useQuery({
    queryKey: ['github-integration-connected'],
    queryFn: async () => {
      const token = await getAccessToken();
      return isGitHubConnected(token);
    },
  });

  const applyMutation = useMutation({
    mutationFn: async () => {
      const token = await getAccessToken();
      const genRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/fixes/generate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: fixedCode,
          ruleId,
          filePath: filePath.trim(),
          wcagCriterion: wcagCriterion ?? undefined,
        }),
      });
      if (!genRes.ok) {
        const body = (await genRes.json().catch(() => null)) as { detail?: string } | null;
        throw new Error(body?.detail ?? 'Failed to cache fix for apply');
      }
      const genJson = (await genRes.json()) as { data: { fixId: string | null; fixCode: string } };
      const fixId = genJson.data.fixId;
      if (!fixId) throw new Error('No fixId returned — cannot apply');

      // Prefer the already-reviewed fixed markup from the panel over a re-generated template
      const applyRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/fixes/apply`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fixId,
          repoFullName: repo.trim(),
          filePath: filePath.trim(),
          branch: branch.trim() || 'main',
          content: fixedCode,
        }),
      });
      if (!applyRes.ok) {
        const body = (await applyRes.json().catch(() => null)) as { detail?: string } | null;
        throw new Error(body?.detail ?? 'Failed to apply fix on GitHub');
      }
      return (await applyRes.json()) as {
        data: { commitSha: string; htmlUrl: string };
      };
    },
    onSuccess: (json) => {
      setMessage(`Committed ${json.data.commitSha.slice(0, 7)}`);
      setCommitUrl(json.data.htmlUrl);
    },
    onError: (err: Error) => {
      setMessage(err.message);
      setCommitUrl(null);
    },
  });

  if (connected === false) {
    return (
      <p className="text-sm text-text-secondary">
        Connect the GitHub App under{' '}
        <a
          href="/dashboard/settings?tab=integrations"
          className="font-medium text-primary-700 underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
        >
          Settings → Integrations
        </a>{' '}
        to commit this fix to a repository.
      </p>
    );
  }

  if (connected !== true) return null;

  return (
    <fieldset className="space-y-3 rounded-md border border-border p-4">
      <legend className="px-1 text-sm font-semibold text-text-primary">Apply fix to GitHub</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="gh-repo" className="text-sm font-medium text-text-secondary">
            Repository (owner/repo)
          </label>
          <Input
            id="gh-repo"
            name="repo"
            value={repo}
            onChange={(e) => setRepo(e.target.value)}
            placeholder="acme/web-app"
            autoComplete="off"
            aria-required="true"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="gh-path" className="text-sm font-medium text-text-secondary">
            File path
          </label>
          <Input
            id="gh-path"
            name="filePath"
            value={filePath}
            onChange={(e) => setFilePath(e.target.value)}
            placeholder="src/components/Button.tsx"
            autoComplete="off"
            aria-required="true"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="gh-branch" className="text-sm font-medium text-text-secondary">
            Branch
          </label>
          <Input
            id="gh-branch"
            name="branch"
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            placeholder="main"
            autoComplete="off"
          />
        </div>
      </div>
      <Button
        type="button"
        variant="primary"
        size="sm"
        className="min-h-11"
        disabled={
          applyMutation.isPending || !repo.trim() || !filePath.trim() || !fixedCode.trim()
        }
        aria-busy={applyMutation.isPending}
        onClick={() => {
          setMessage(null);
          applyMutation.mutate();
        }}
      >
        {applyMutation.isPending ? 'Committing…' : 'Commit fix to GitHub'}
      </Button>
      {message ? (
        <p className="text-sm text-text-secondary" role="status">
          {message}
          {commitUrl ? (
            <>
              {' '}
              <a
                href={commitUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary-700 underline underline-offset-2"
              >
                View on GitHub
              </a>
            </>
          ) : null}
        </p>
      ) : null}
    </fieldset>
  );
}
