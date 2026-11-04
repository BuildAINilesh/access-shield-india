'use client';

import { useEffect, useState } from 'react';
import { LocaleLink } from '@/components/common/LocaleLink';
import { getIntelligenceIssue, type IntelligenceIssueDetail } from '@/lib/api/intelligence';

interface IntelligenceIssueViewProps {
  anId: string;
}

export function IntelligenceIssueView({ anId }: IntelligenceIssueViewProps) {
  const [issue, setIssue] = useState<IntelligenceIssueDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void getIntelligenceIssue(anId)
      .then((data) => {
        if (cancelled) return;
        if (!data) setError('Issue not found');
        else setIssue(data);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [anId]);

  if (loading) {
    return (
      <p className="text-base text-text-secondary" role="status" aria-busy="true">
        Loading issue…
      </p>
    );
  }

  if (error || !issue) {
    return (
      <div role="alert" className="space-y-4">
        <p className="text-error-700">{error ?? 'Issue not found'}</p>
        <LocaleLink
          href="/intelligence"
          className="inline-flex min-h-11 items-center font-semibold text-primary-600 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
        >
          ← Back to Intelligence
        </LocaleLink>
      </div>
    );
  }

  return (
    <article className="space-y-6">
      <LocaleLink
        href="/intelligence"
        className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-600 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
      >
        ← Back to Intelligence
      </LocaleLink>

      <header className="space-y-3">
        <p className="text-sm text-text-tertiary">
          <code>{issue.anId}</code> · <span className="font-medium text-primary-700">{issue.packageName}</span>
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
          {issue.title}
        </h1>
        <ul className="flex flex-wrap gap-2" aria-label="Issue metadata">
          <li className="rounded-full border border-border bg-bg-tertiary px-3 py-1 text-xs font-medium text-text-secondary">
            Severity: {issue.severity}
          </li>
          <li className="rounded-full border border-border bg-bg-tertiary px-3 py-1 text-xs font-medium text-text-secondary">
            Type: {issue.issueType}
          </li>
          <li className="rounded-full border border-border bg-bg-tertiary px-3 py-1 text-xs font-medium text-text-secondary">
            Fix status: {issue.fixStatus}
          </li>
        </ul>
      </header>

      <section aria-labelledby="desc-heading">
        <h2 id="desc-heading" className="text-xl font-semibold text-text-primary">
          Description
        </h2>
        <p className="mt-2 text-base leading-relaxed text-text-secondary">{issue.description}</p>
      </section>

      {issue.atAffected && issue.atAffected.length > 0 ? (
        <section aria-labelledby="at-heading">
          <h2 id="at-heading" className="text-xl font-semibold text-text-primary">
            Assistive tech affected
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-base text-text-secondary">
            {issue.atAffected.map((at) => (
              <li key={at}>{at}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {issue.workaround ? (
        <section aria-labelledby="fix-heading">
          <h2 id="fix-heading" className="text-xl font-semibold text-text-primary">
            Workaround / fix
          </h2>
          <p className="mt-2 text-base leading-relaxed text-text-secondary">{issue.workaround}</p>
        </section>
      ) : null}

      {issue.versions.length > 0 ? (
        <section aria-labelledby="ver-heading">
          <h2 id="ver-heading" className="text-xl font-semibold text-text-primary">
            Affected versions
          </h2>
          <ul className="mt-2 space-y-2">
            {issue.versions.map((v) => (
              <li
                key={`${v.versionRange}-${v.fixedInVersion ?? 'open'}`}
                className="rounded-md border border-border bg-white px-4 py-3 text-sm text-text-secondary"
              >
                Range: <code>{v.versionRange}</code>
                {v.fixedInVersion ? (
                  <>
                    {' '}
                    · Fixed in: <code>{v.fixedInVersion}</code>
                  </>
                ) : (
                  ' · No known fixed version'
                )}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}
