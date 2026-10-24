'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, Github, XCircle } from 'lucide-react';
import { getAccessToken } from '@/lib/api/client';
import { Button, Badge, Modal } from '@accessshield/ui';
import { LoadingState } from '@/components/dashboard/common/LoadingState';

interface GitHubStatus {
  connected: boolean;
  configured: boolean;
  installation: {
    installationId: number;
    accountLogin: string;
    accountType: string;
    connectedAt: string;
  } | null;
}

async function fetchGitHubStatus(token: string): Promise<GitHubStatus> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/integrations/github`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to load GitHub integration');
  const json = (await response.json()) as { data: GitHubStatus };
  return json.data;
}

async function disconnectGitHub(token: string) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/integrations/github`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok && response.status !== 204) throw new Error('Failed to disconnect GitHub');
}

export function GitHubIntegrationCard() {
  const queryClient = useQueryClient();
  const [disconnectOpen, setDisconnectOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['github-integration'],
    queryFn: async () => {
      const token = await getAccessToken();
      return fetchGitHubStatus(token);
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const token = await getAccessToken();
      await disconnectGitHub(token);
    },
    onSuccess: () => {
      setDisconnectOpen(false);
      void queryClient.invalidateQueries({ queryKey: ['github-integration'] });
    },
  });

  if (isLoading) {
    return <LoadingState message="Loading GitHub integration…" variant="card" />;
  }

  const connected = data?.connected === true;
  const configured = data?.configured === true;

  return (
    <section
      className="rounded-lg border border-border bg-bg-primary p-6"
      aria-labelledby="github-integration-heading"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-bg-tertiary"
            aria-hidden="true"
          >
            <Github className="h-5 w-5 text-text-primary" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2
                id="github-integration-heading"
                className="text-lg font-semibold text-text-primary"
              >
                GitHub
              </h2>
              {connected ? (
                <Badge variant="success" className="inline-flex items-center gap-1">
                  <CheckCircle className="h-3.5 w-3.5" aria-hidden="true" />
                  Connected
                </Badge>
              ) : (
                <Badge variant="secondary" className="inline-flex items-center gap-1">
                  <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                  Not connected
                </Badge>
              )}
            </div>
            <p className="mt-1 text-sm leading-normal text-text-secondary">
              Install the AccessibleNow GitHub App so AI fixes can be committed to a repo via the
              Contents API (AN Fix Apply).
            </p>
            {connected && data?.installation ? (
              <p className="mt-2 text-sm text-text-secondary">
                Account:{' '}
                <span className="font-medium text-text-primary">
                  {data.installation.accountLogin}
                </span>{' '}
                ({data.installation.accountType})
              </p>
            ) : null}
            {!configured ? (
              <p className="mt-2 text-sm text-warning-700" role="status">
                Server is missing GITHUB_APP_ID / GITHUB_APP_PRIVATE_KEY / GITHUB_APP_SLUG. Ask an
                admin to configure the GitHub App, then set the callback URL to{' '}
                <code className="rounded bg-bg-tertiary px-1 text-xs">
                  /dashboard/settings/github/callback
                </code>
                .
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {connected ? (
            <Button
              type="button"
              variant="secondary"
              className="min-h-11"
              onClick={() => setDisconnectOpen(true)}
            >
              Disconnect
            </Button>
          ) : (
            <Button
              type="button"
              variant="primary"
              className="min-h-11"
              disabled={!configured}
              onClick={() => {
                window.location.href = '/dashboard/settings/github/auth';
              }}
            >
              Connect GitHub App
            </Button>
          )}
        </div>
      </div>

      <Modal
        isOpen={disconnectOpen}
        onClose={() => setDisconnectOpen(false)}
        title="Disconnect GitHub?"
        description="Apply-fix commits will stop until you reconnect the GitHub App."
      >
        <div className="flex flex-wrap justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={() => setDisconnectOpen(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={() => disconnectMutation.mutate()}
            disabled={disconnectMutation.isPending}
            aria-busy={disconnectMutation.isPending}
          >
            {disconnectMutation.isPending ? 'Disconnecting…' : 'Disconnect'}
          </Button>
        </div>
      </Modal>
    </section>
  );
}
