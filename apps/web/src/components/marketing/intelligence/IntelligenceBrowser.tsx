'use client';

import { useEffect, useState, useTransition } from 'react';
import { LocaleLink } from '@/components/common/LocaleLink';
import { IntelligenceReportForm } from '@/components/marketing/intelligence/IntelligenceReportForm';
import {
  searchIntelligenceIssues,
  type IntelligenceIssueSummary,
} from '@/lib/api/intelligence';

const SEVERITIES = [
  { value: '', label: 'All severities' },
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
] as const;

function severityClass(severity: string): string {
  switch (severity) {
    case 'critical':
      return 'border-red-200 bg-red-100 text-red-800';
    case 'high':
      return 'border-amber-200 bg-amber-100 text-amber-800';
    case 'medium':
      return 'border-primary-300 bg-primary-100 text-primary-800';
    default:
      return 'border-gray-200 bg-gray-100 text-gray-700';
  }
}

export function IntelligenceBrowser() {
  const [q, setQ] = useState('');
  const [severity, setSeverity] = useState('');
  const [issues, setIssues] = useState<IntelligenceIssueSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const runSearch = (query: string, sev: string) => {
    startTransition(async () => {
      try {
        setError(null);
        const data = await searchIntelligenceIssues({
          q: query.trim() || undefined,
          severity: sev || undefined,
          limit: 50,
        });
        setIssues(data.issues);
        setTotal(data.total);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed');
        setIssues([]);
        setTotal(0);
      }
    });
  };

  useEffect(() => {
    runSearch('', '');
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial load only
  }, []);

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <form
        className="space-y-4 rounded-lg border border-border bg-white p-6"
        onSubmit={(e) => {
          e.preventDefault();
          runSearch(q, severity);
        }}
        role="search"
        aria-label="Search accessibility intelligence"
      >
        <div className="grid gap-4 sm:grid-cols-[1fr_auto_auto]">
          <div className="space-y-1.5">
            <label htmlFor="intel-q" className="text-sm font-medium text-text-secondary">
              Search packages or issues
            </label>
            <input
              id="intel-q"
              name="q"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="e.g. react-select, antd, modal focus"
              className="w-full min-h-11 rounded-md border border-border px-3 py-2 text-base text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
              autoComplete="off"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="intel-sev" className="text-sm font-medium text-text-secondary">
              Severity
            </label>
            <select
              id="intel-sev"
              name="severity"
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="min-h-11 w-full rounded-md border border-border bg-white px-3 py-2 text-base text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 sm:w-40"
            >
              {SEVERITIES.map((s) => (
                <option key={s.value || 'all'} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="min-h-11 w-full rounded-md bg-primary-600 px-4 py-2 text-base font-semibold text-white hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 sm:w-auto"
              disabled={pending}
              aria-busy={pending}
            >
              {pending ? 'Searching…' : 'Search'}
            </button>
          </div>
        </div>
      </form>

      <div aria-live="polite" aria-atomic="true">
        {error ? (
          <p className="rounded-md border border-error-100 bg-error-100 px-4 py-3 text-sm text-error-700" role="alert">
            {error}
          </p>
        ) : (
          <p className="text-sm text-text-secondary">
            {pending ? 'Loading…' : `${total} issue${total === 1 ? '' : 's'} found`}
          </p>
        )}
      </div>

      <ul className="space-y-3" aria-label="Intelligence issues">
        {issues.map((issue) => (
          <li key={issue.anId}>
            <LocaleLink
              href={`/intelligence/${issue.anId}`}
              className="block rounded-lg border border-border bg-white p-4 transition hover:border-primary-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${severityClass(issue.severity)}`}
                >
                  {issue.severity}
                </span>
                <code className="text-xs text-text-tertiary">{issue.anId}</code>
                <span className="text-sm font-medium text-primary-700">{issue.packageName}</span>
              </div>
              <p className="mt-2 text-base font-semibold text-text-primary">{issue.title}</p>
              <p className="mt-1 line-clamp-2 text-sm text-text-secondary">{issue.description}</p>
            </LocaleLink>
          </li>
        ))}
      </ul>

      <IntelligenceReportForm />
    </div>
  );
}
