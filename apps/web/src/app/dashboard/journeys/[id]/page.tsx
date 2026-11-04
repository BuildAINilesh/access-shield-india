'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Play, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { getAccessToken } from '@/lib/api/client';
import { Badge, Button } from '@accessshield/ui';
import { LoadingState } from '@/components/dashboard/common/LoadingState';

interface JourneyDetail {
  id: string;
  name: string;
  slug: string;
  definitionJson: {
    startUrl?: string;
    steps?: Array<{ id: string; action: string }>;
  };
  hasCredentials: boolean;
}

interface JourneyScanRow {
  id: string;
  status: string;
  totalViolations: number;
  createdAt: string;
  completedAt: string | null;
  errorMessage: string | null;
}

interface ScanDetail {
  scan: {
    id: string;
    status: string;
    totalViolations: number;
    failureMapJson: {
      failedSteps?: Array<{ stepId: string; errorMessage?: string }>;
      axeHotspots?: Array<{ stepId: string; criticalSerious: number; violationCount: number }>;
      steps?: Array<{
        stepId: string;
        action: string;
        status: string;
        pageUrl?: string;
        violationCount: number;
        criticalSerious: number;
        errorMessage?: string;
      }>;
    } | null;
    errorMessage: string | null;
  };
  steps: Array<{
    stepId: string;
    stepIndex: number;
    action: string;
    status: string;
    pageUrl: string | null;
    violationCount: number;
    errorMessage: string | null;
    durationMs: number | null;
  }>;
}

export default function JourneyDetailPage() {
  const params = useParams();
  const id = String(params.id);
  const queryClient = useQueryClient();

  const { data: journey, isLoading } = useQuery({
    queryKey: ['journey', id],
    queryFn: async () => {
      const token = await getAccessToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/dynamic/journeys/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load journey');
      const json = (await res.json()) as { data: JourneyDetail };
      return json.data;
    },
  });

  const { data: scans = [] } = useQuery({
    queryKey: ['journey-scans', id],
    queryFn: async () => {
      const token = await getAccessToken();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/dynamic/journeys/${id}/scans`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!res.ok) throw new Error('Failed to load scans');
      const json = (await res.json()) as { data: JourneyScanRow[] };
      return json.data;
    },
    refetchInterval: (query) => {
      const rows = query.state.data as JourneyScanRow[] | undefined;
      const busy = rows?.some((s) => s.status === 'queued' || s.status === 'running');
      return busy ? 3000 : false;
    },
  });

  const latestScanId = scans[0]?.id;
  const { data: latestDetail } = useQuery({
    queryKey: ['journey-scan-detail', latestScanId],
    enabled: Boolean(latestScanId),
    queryFn: async () => {
      const token = await getAccessToken();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/dynamic/scans/${latestScanId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!res.ok) throw new Error('Failed to load scan detail');
      const json = (await res.json()) as { data: ScanDetail };
      return json.data;
    },
    refetchInterval: (q) => {
      const st = (q.state.data as ScanDetail | undefined)?.scan.status;
      return st === 'queued' || st === 'running' ? 3000 : false;
    },
  });

  const runMutation = useMutation({
    mutationFn: async () => {
      const token = await getAccessToken();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/dynamic/journeys/${id}/scans`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { detail?: string } | null;
        throw new Error(err?.detail ?? 'Failed to start journey scan');
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['journey-scans', id] });
    },
  });

  if (isLoading || !journey) {
    return <LoadingState message="Loading journey…" />;
  }

  const failureMap = latestDetail?.scan.failureMapJson;
  const mapSteps = failureMap?.steps ?? [];

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/dashboard/journeys"
          className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-600 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
        >
          ← Journeys
        </Link>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">{journey.name}</h1>
            <p className="mt-1 text-sm text-text-secondary">
              Start: <code>{journey.definitionJson.startUrl}</code>
              {journey.hasCredentials ? ' · Credentials stored' : ' · No credentials'}
            </p>
          </div>
          <Button
            type="button"
            variant="primary"
            className="min-h-11"
            onClick={() => runMutation.mutate()}
            disabled={runMutation.isPending}
            aria-busy={runMutation.isPending}
          >
            <Play className="mr-2 h-4 w-4" aria-hidden="true" />
            {runMutation.isPending ? 'Starting…' : 'Run journey scan'}
          </Button>
        </div>
        {runMutation.isError ? (
          <p className="mt-2 text-sm text-error-700" role="alert">
            {(runMutation.error as Error).message}
          </p>
        ) : null}
      </div>

      {latestDetail ? (
        <section
          className="rounded-lg border border-border bg-white p-6"
          aria-labelledby="failure-map-heading"
        >
          <div className="flex flex-wrap items-center gap-3">
            <h2 id="failure-map-heading" className="text-lg font-semibold text-text-primary">
              Failure map
            </h2>
            <Badge
              variant={
                latestDetail.scan.status === 'completed'
                  ? 'success'
                  : latestDetail.scan.status === 'failed'
                    ? 'error'
                    : 'secondary'
              }
            >
              {latestDetail.scan.status}
            </Badge>
            <span className="text-sm text-text-secondary">
              {latestDetail.scan.totalViolations} violations
            </span>
          </div>

          {latestDetail.scan.errorMessage ? (
            <p className="mt-3 text-sm text-error-700" role="alert">
              {latestDetail.scan.errorMessage}
            </p>
          ) : null}

          <ol className="mt-6 space-y-3">
            {mapSteps.map((step) => {
              const hot = (step.criticalSerious ?? 0) > 0;
              const failed = step.status === 'failed';
              return (
                <li
                  key={`${step.stepId}-${step.action}`}
                  className={`rounded-md border px-4 py-3 ${
                    failed
                      ? 'border-error-100 bg-error-100/40'
                      : hot
                        ? 'border-warning-100 bg-warning-100/40'
                        : 'border-border bg-bg-secondary'
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    {failed || hot ? (
                      <AlertTriangle
                        className={`h-4 w-4 ${failed ? 'text-error-700' : 'text-warning-700'}`}
                        aria-hidden="true"
                      />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-success-700" aria-hidden="true" />
                    )}
                    <span className="font-medium text-text-primary">{step.stepId}</span>
                    <code className="text-xs text-text-tertiary">{step.action}</code>
                    <Badge variant="outline">{step.status}</Badge>
                    {step.violationCount > 0 ? (
                      <span className="text-sm text-text-secondary">
                        {step.violationCount} issues
                        {step.criticalSerious
                          ? ` (${step.criticalSerious} critical/serious)`
                          : ''}
                      </span>
                    ) : null}
                  </div>
                  {step.pageUrl ? (
                    <p className="mt-1 truncate text-xs text-text-tertiary">{step.pageUrl}</p>
                  ) : null}
                  {step.errorMessage ? (
                    <p className="mt-1 text-sm text-error-700">{step.errorMessage}</p>
                  ) : null}
                </li>
              );
            })}
          </ol>
        </section>
      ) : null}

      <section aria-labelledby="history-heading">
        <h2 id="history-heading" className="text-lg font-semibold text-text-primary">
          Scan history
        </h2>
        {scans.length === 0 ? (
          <p className="mt-2 text-sm text-text-secondary">No runs yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {scans.map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-white px-4 py-3 text-sm"
              >
                <Badge variant="outline">{s.status}</Badge>
                <span className="text-text-secondary">{s.totalViolations} violations</span>
                <time className="text-text-tertiary" dateTime={s.createdAt}>
                  {new Date(s.createdAt).toLocaleString('en-IN')}
                </time>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
