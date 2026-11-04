'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Gauge, Save, RotateCcw } from 'lucide-react';
import { getAccessToken } from '@/lib/api/client';
import { Button, Input } from '@accessshield/ui';
import { LoadingState } from '@/components/dashboard/common/LoadingState';

export interface PriorityWeights {
  userImpact: number;
  regulatoryWeight: number;
  atCoverage: number;
  inverseFixComplexity: number;
}

const DEFAULT_WEIGHTS: PriorityWeights = {
  userImpact: 0.4,
  regulatoryWeight: 0.3,
  atCoverage: 0.2,
  inverseFixComplexity: 0.1,
};

const FIELD_META: Array<{
  key: keyof PriorityWeights;
  label: string;
  description: string;
}> = [
  {
    key: 'userImpact',
    label: 'User impact',
    description: 'How severely the issue blocks people with disabilities',
  },
  {
    key: 'regulatoryWeight',
    label: 'Regulatory weight',
    description: 'India packs (IS 17802, GIGW, SEBI) score higher than base WCAG',
  },
  {
    key: 'atCoverage',
    label: 'Assistive tech coverage',
    description: 'How many AT/browser combinations typically fail',
  },
  {
    key: 'inverseFixComplexity',
    label: 'Easy-win bias',
    description: 'Higher = prefer issues that are quicker to remediate',
  },
];

async function fetchPriorityConfig(token: string): Promise<PriorityWeights> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/organisation/priority-config`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!response.ok) throw new Error('Failed to load priority config');
  const json = (await response.json()) as { data: PriorityWeights };
  return json.data;
}

async function savePriorityConfig(token: string, weights: PriorityWeights) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/organisation/priority-config`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(weights),
    },
  );
  if (!response.ok) throw new Error('Failed to save priority config');
  return response.json();
}

function toPercent(weight: number): number {
  return Math.round(weight * 100);
}

function fromPercent(percent: number): number {
  return Math.min(1, Math.max(0, percent / 100));
}

export function PriorityConfigForm() {
  const queryClient = useQueryClient();
  const [weights, setWeights] = useState<PriorityWeights>(DEFAULT_WEIGHTS);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['priority-config'],
    queryFn: async () => {
      const token = await getAccessToken();
      return fetchPriorityConfig(token);
    },
  });

  useEffect(() => {
    if (data) setWeights(data);
  }, [data]);

  const totalPercent = useMemo(
    () =>
      toPercent(weights.userImpact) +
      toPercent(weights.regulatoryWeight) +
      toPercent(weights.atCoverage) +
      toPercent(weights.inverseFixComplexity),
    [weights],
  );

  const saveMutation = useMutation({
    mutationFn: async () => {
      const token = await getAccessToken();
      return savePriorityConfig(token, weights);
    },
    onSuccess: () => {
      setStatusMessage('Priority weights saved. New rankings apply on the next issues refresh.');
      void queryClient.invalidateQueries({ queryKey: ['priority-config'] });
      void queryClient.invalidateQueries({ queryKey: ['issues'] });
    },
    onError: (err: Error) => setStatusMessage(err.message),
  });

  if (isLoading) {
    return <LoadingState message="Loading priority configuration…" variant="card" />;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-white p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary-100">
            <Gauge className="h-6 w-6 text-primary-700" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Priority Score</h2>
            <p className="mt-1 text-base text-text-secondary">
              Tune how AccessibleNow ranks remediation work. Weights are normalised to 100% when
              saved. Use <strong>Sort by priority</strong> on the Issues page to see the ranking.
            </p>
          </div>
        </div>
      </div>

      <form
        className="space-y-5 rounded-lg border border-border bg-white p-6"
        onSubmit={(e) => {
          e.preventDefault();
          setStatusMessage(null);
          saveMutation.mutate();
        }}
        aria-labelledby="priority-weights-heading"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 id="priority-weights-heading" className="text-base font-semibold text-text-primary">
            Dimension weights
          </h3>
          <p className="text-sm text-text-secondary" aria-live="polite">
            Total: <strong>{totalPercent}%</strong>
            {totalPercent !== 100 ? ' (will be normalised on save)' : ''}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {FIELD_META.map((field) => (
            <Input
              key={field.key}
              name={field.key}
              type="number"
              min={0}
              max={100}
              step={1}
              label={`${field.label} (%)`}
              hint={field.description}
              value={String(toPercent(weights[field.key]))}
              onChange={(e) => {
                const next = fromPercent(Number(e.target.value) || 0);
                setWeights((prev) => ({ ...prev, [field.key]: next }));
              }}
              aria-required="true"
            />
          ))}
        </div>

        {statusMessage ? (
          <p className="text-sm text-text-secondary" role="status">
            {statusMessage}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Button type="submit" variant="primary" isLoading={saveMutation.isPending}>
            <Save className="mr-2 h-4 w-4" aria-hidden="true" />
            Save weights
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setWeights(DEFAULT_WEIGHTS);
              setStatusMessage('Reset to defaults (not saved yet).');
            }}
          >
            <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />
            Reset defaults
          </Button>
        </div>
      </form>
    </div>
  );
}
