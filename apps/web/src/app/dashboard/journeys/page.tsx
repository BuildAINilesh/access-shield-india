'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Plus, Route } from 'lucide-react';
import { getAccessToken } from '@/lib/api/client';
import { Button, Input, Badge } from '@accessshield/ui';
import { LoadingState } from '@/components/dashboard/common/LoadingState';

interface JourneyRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  updatedAt: string;
}

const EXAMPLE_DEFINITION = {
  startUrl: 'https://example.com/login',
  steps: [
    { id: 'email', action: 'fill', selector: '#email', value: '{{creds.username}}' },
    { id: 'password', action: 'fill', selector: '#password', value: '{{creds.password}}' },
    { id: 'submit', action: 'click', selector: 'button[type=submit]' },
    { id: 'wait-home', action: 'wait', urlIncludes: '/dashboard', timeoutMs: 15000 },
    { id: 'axe-home', action: 'axe', label: 'Post-login home' },
  ],
};

async function fetchJourneys(token: string): Promise<JourneyRow[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/dynamic/journeys`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to load journeys');
  const json = (await res.json()) as { data: JourneyRow[] };
  return json.data;
}

export default function JourneysPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [definitionText, setDefinitionText] = useState(
    JSON.stringify(EXAMPLE_DEFINITION, null, 2),
  );
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const { data: journeys = [], isLoading } = useQuery({
    queryKey: ['journeys'],
    queryFn: async () => {
      const token = await getAccessToken();
      return fetchJourneys(token);
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const token = await getAccessToken();
      let definition: unknown;
      try {
        definition = JSON.parse(definitionText);
      } catch {
        throw new Error('Definition must be valid JSON');
      }
      const body: Record<string, unknown> = { name: name.trim(), definition };
      if (username || password) {
        body.credentials = { username, password };
      }
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/dynamic/journeys`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { detail?: string } | null;
        throw new Error(err?.detail ?? 'Failed to create journey');
      }
      return res.json();
    },
    onSuccess: () => {
      setShowForm(false);
      setName('');
      setUsername('');
      setPassword('');
      setFormError(null);
      void queryClient.invalidateQueries({ queryKey: ['journeys'] });
    },
    onError: (err: Error) => setFormError(err.message),
  });

  if (isLoading) {
    return <LoadingState message="Loading journeys…" />;
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Dynamic journeys</h1>
          <p className="mt-1 text-base text-text-secondary">
            Authenticated multi-step flows with axe at selected steps (AN-F003).
          </p>
        </div>
        <Button
          type="button"
          variant="primary"
          className="min-h-11"
          onClick={() => setShowForm((v) => !v)}
        >
          <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
          New journey
        </Button>
      </header>

      {showForm ? (
        <form
          className="space-y-4 rounded-lg border border-border bg-white p-6"
          onSubmit={(e) => {
            e.preventDefault();
            setFormError(null);
            createMutation.mutate();
          }}
        >
          <h2 className="text-lg font-semibold text-text-primary">Create journey</h2>
          <div className="space-y-1.5">
            <label htmlFor="j-name" className="text-sm font-medium text-text-secondary">
              Name
            </label>
            <Input
              id="j-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              aria-required="true"
              placeholder="Login → dashboard"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="j-def" className="text-sm font-medium text-text-secondary">
              Definition (JSON DSL — YAML-compatible keys)
            </label>
            <textarea
              id="j-def"
              value={definitionText}
              onChange={(e) => setDefinitionText(e.target.value)}
              rows={14}
              className="w-full rounded-md border border-border px-3 py-2 font-mono text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
              spellCheck={false}
            />
          </div>
          <fieldset className="grid gap-4 sm:grid-cols-2">
            <legend className="mb-2 text-sm font-medium text-text-secondary">
              Credentials (encrypted at rest, optional)
            </legend>
            <div className="space-y-1.5">
              <label htmlFor="j-user" className="text-sm text-text-secondary">
                Username / email
              </label>
              <Input
                id="j-user"
                autoComplete="off"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="j-pass" className="text-sm text-text-secondary">
                Password
              </label>
              <Input
                id="j-pass"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </fieldset>
          {formError ? (
            <p className="text-sm text-error-700" role="alert">
              {formError}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-3">
            <Button
              type="submit"
              variant="primary"
              disabled={createMutation.isPending || !name.trim()}
              aria-busy={createMutation.isPending}
            >
              {createMutation.isPending ? 'Saving…' : 'Save journey'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : null}

      {journeys.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-bg-secondary p-8 text-center text-text-secondary">
          No journeys yet. Create one to scan authenticated flows with per-step axe.
        </p>
      ) : (
        <ul className="space-y-3" aria-label="Journeys">
          {journeys.map((j) => (
            <li key={j.id}>
              <Link
                href={`/dashboard/journeys/${j.id}`}
                className="flex items-start gap-3 rounded-lg border border-border bg-white p-4 transition hover:border-primary-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
              >
                <Route className="mt-0.5 h-5 w-5 shrink-0 text-primary-700" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-text-primary">{j.name}</span>
                    <Badge variant={j.isActive ? 'success' : 'secondary'}>
                      {j.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <code className="text-xs text-text-tertiary">{j.slug}</code>
                  </div>
                  {j.description ? (
                    <p className="mt-1 text-sm text-text-secondary">{j.description}</p>
                  ) : null}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
