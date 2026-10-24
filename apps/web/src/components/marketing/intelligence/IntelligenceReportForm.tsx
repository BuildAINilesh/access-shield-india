'use client';

import { useState } from 'react';
import { submitIntelligenceReport } from '@/lib/api/intelligence';

export function IntelligenceReportForm() {
  const [packageName, setPackageName] = useState('');
  const [version, setVersion] = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  return (
    <section
      className="rounded-lg border border-border bg-bg-secondary p-6"
      aria-labelledby="report-issue-heading"
    >
      <h2 id="report-issue-heading" className="text-xl font-bold text-text-primary">
        Report a package accessibility issue
      </h2>
      <p className="mt-2 text-sm text-text-secondary">
        Community reports are reviewed before they appear in the public catalog. Do not include
        secrets or personal data in the description.
      </p>

      <form
        className="mt-6 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          setStatus('pending');
          setMessage(null);
          void submitIntelligenceReport({
            packageName: packageName.trim(),
            version: version.trim() || undefined,
            description: description.trim(),
            reporterEmail: email.trim() || undefined,
          })
            .then(() => {
              setStatus('success');
              setMessage('Thanks — your report was submitted for review.');
              setPackageName('');
              setVersion('');
              setDescription('');
              setEmail('');
            })
            .catch((err: Error) => {
              setStatus('error');
              setMessage(err.message);
            });
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="rpt-pkg" className="text-sm font-medium text-text-secondary">
              Package name <span className="text-error-700">*</span>
            </label>
            <input
              id="rpt-pkg"
              name="packageName"
              required
              aria-required="true"
              value={packageName}
              onChange={(e) => setPackageName(e.target.value)}
              className="w-full min-h-11 rounded-md border border-border bg-white px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
              placeholder="react-select"
              autoComplete="off"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="rpt-ver" className="text-sm font-medium text-text-secondary">
              Version (optional)
            </label>
            <input
              id="rpt-ver"
              name="version"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              className="w-full min-h-11 rounded-md border border-border bg-white px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
              placeholder="4.3.1"
              autoComplete="off"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="rpt-desc" className="text-sm font-medium text-text-secondary">
            Description <span className="text-error-700">*</span>
          </label>
          <textarea
            id="rpt-desc"
            name="description"
            required
            aria-required="true"
            minLength={20}
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-md border border-border bg-white px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
            placeholder="What breaks for keyboard or screen reader users? Which AT/browser?"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="rpt-email" className="text-sm font-medium text-text-secondary">
            Email (optional — if we need a follow-up)
          </label>
          <input
            id="rpt-email"
            name="reporterEmail"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full min-h-11 rounded-md border border-border bg-white px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
          />
        </div>

        <button
          type="submit"
          disabled={status === 'pending'}
          aria-busy={status === 'pending'}
          className="min-h-11 rounded-md bg-primary-600 px-4 py-2 text-base font-semibold text-white hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 disabled:opacity-60"
        >
          {status === 'pending' ? 'Submitting…' : 'Submit report'}
        </button>

        {message ? (
          <p
            className={`text-sm ${status === 'error' ? 'text-error-700' : 'text-success-700'}`}
            role="status"
          >
            {message}
          </p>
        ) : null}
      </form>
    </section>
  );
}
