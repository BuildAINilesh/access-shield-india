'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Webhook, Send, History } from 'lucide-react';
import { getAccessToken } from '@/lib/api/client';
import { Button, Checkbox, CheckboxGroup, CopyButton, Input, Badge } from '@accessshield/ui';
import { LoadingState } from '@/components/dashboard/common/LoadingState';

const WEBHOOK_EVENT_OPTIONS = [
  {
    value: 'scan.completed',
    label: 'Scan completed',
    description: 'Fired when a website or document scan finishes',
  },
  {
    value: 'violation.introduced',
    label: 'New violation',
    description: 'Fired when a new accessibility violation is introduced',
  },
  {
    value: 'certificate.changed',
    label: 'Certificate changed',
    description: 'Fired when a certificate is issued or revoked',
  },
] as const;

type WebhookEvent = (typeof WEBHOOK_EVENT_OPTIONS)[number]['value'];

interface OrgWebhook {
  id: string;
  url: string;
  events: string[];
  isActive: boolean;
  createdAt: string;
}

interface WebhookDelivery {
  id: string;
  eventType: string;
  status: string;
  attempts: number;
  lastError: string | null;
  createdAt: string;
}

async function fetchWebhooks(token: string): Promise<OrgWebhook[]> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/webhooks`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to load webhooks');
  const json = (await response.json()) as { data: OrgWebhook[] };
  return json.data;
}

async function createWebhook(
  token: string,
  input: { url: string; events: WebhookEvent[] },
): Promise<OrgWebhook & { secret: string }> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/webhooks`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error('Failed to create webhook');
  const json = (await response.json()) as { data: OrgWebhook & { secret: string } };
  return json.data;
}

async function deleteWebhook(token: string, id: string) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/webhooks/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok && response.status !== 204) throw new Error('Failed to delete webhook');
}

async function testWebhook(token: string, id: string) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/webhooks/${id}/test`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { detail?: string } | null;
    throw new Error(body?.detail ?? 'Failed to send test webhook');
  }
}

async function fetchDeliveries(token: string, id: string): Promise<WebhookDelivery[]> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/webhooks/${id}/deliveries`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!response.ok) throw new Error('Failed to load deliveries');
  const json = (await response.json()) as { data: WebhookDelivery[] };
  return json.data;
}

export function WebhooksSettingsCard() {
  const queryClient = useQueryClient();
  const [url, setUrl] = useState('');
  const [events, setEvents] = useState<WebhookEvent[]>(['scan.completed']);
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);
  const [deliveriesFor, setDeliveriesFor] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const { data: webhooks = [], isLoading } = useQuery({
    queryKey: ['org-webhooks'],
    queryFn: async () => {
      const token = await getAccessToken();
      return fetchWebhooks(token);
    },
  });

  const { data: deliveries = [], isLoading: deliveriesLoading } = useQuery({
    queryKey: ['org-webhook-deliveries', deliveriesFor],
    enabled: Boolean(deliveriesFor),
    queryFn: async () => {
      const token = await getAccessToken();
      return fetchDeliveries(token, deliveriesFor!);
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const token = await getAccessToken();
      return createWebhook(token, { url: url.trim(), events });
    },
    onSuccess: (row) => {
      setCreatedSecret(row.secret);
      setUrl('');
      setEvents(['scan.completed']);
      setFormError(null);
      setActionMessage('Webhook created. Copy the signing secret now — it is shown only once.');
      void queryClient.invalidateQueries({ queryKey: ['org-webhooks'] });
    },
    onError: (err: Error) => setFormError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = await getAccessToken();
      await deleteWebhook(token, id);
    },
    onSuccess: () => {
      setActionMessage('Webhook removed.');
      void queryClient.invalidateQueries({ queryKey: ['org-webhooks'] });
    },
  });

  const testMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = await getAccessToken();
      await testWebhook(token, id);
    },
    onSuccess: (_data, id) => {
      setActionMessage('Test event sent.');
      setDeliveriesFor(id);
      void queryClient.invalidateQueries({ queryKey: ['org-webhook-deliveries', id] });
    },
    onError: (err: Error) => setActionMessage(err.message),
  });

  const eventSet = useMemo(() => new Set(events), [events]);

  function toggleEvent(value: WebhookEvent, checked: boolean) {
    setEvents((prev) => {
      if (checked) return prev.includes(value) ? prev : [...prev, value];
      return prev.filter((e) => e !== value);
    });
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!url.trim()) {
      setFormError('Enter a HTTPS webhook URL.');
      return;
    }
    if (events.length === 0) {
      setFormError('Select at least one event.');
      return;
    }
    createMutation.mutate();
  }

  if (isLoading) {
    return <LoadingState message="Loading webhooks…" variant="card" />;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-white p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary-100">
            <Webhook className="h-6 w-6 text-primary-700" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Outbound webhooks</h2>
            <p className="mt-1 text-base text-text-secondary">
              Push scan and certificate events to Slack, Zapier, or your own HTTPS endpoint.
              Payloads are signed with HMAC-SHA256 (
              <code className="text-sm">X-AccessibleNow-Signature</code>).
            </p>
          </div>
        </div>
      </div>

      {actionMessage ? (
        <p
          className="rounded-md border border-border bg-bg-secondary px-4 py-3 text-sm text-text-secondary"
          role="status"
        >
          {actionMessage}
        </p>
      ) : null}

      {createdSecret ? (
        <div
          className="rounded-lg border border-warning-200 bg-warning-50 p-4"
          role="status"
          aria-live="polite"
        >
          <p className="text-sm font-medium text-warning-700">Signing secret (copy now)</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <code className="break-all rounded bg-white px-2 py-1 text-sm text-text-primary">
              {createdSecret}
            </code>
            <CopyButton text={createdSecret} label="Copy secret" />
          </div>
        </div>
      ) : null}

      <form
        onSubmit={handleCreate}
        className="space-y-4 rounded-lg border border-border bg-white p-6"
        aria-labelledby="add-webhook-heading"
      >
        <h3 id="add-webhook-heading" className="text-base font-semibold text-text-primary">
          Add webhook
        </h3>
        <Input
          name="webhook-url"
          label="Endpoint URL"
          type="url"
          placeholder="https://hooks.example.com/accessiblenow"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
          aria-required="true"
          hint="Must be HTTPS in production"
        />

        <CheckboxGroup legend="Events" hint="Choose which events to deliver">
          {WEBHOOK_EVENT_OPTIONS.map((opt) => (
            <Checkbox
              key={opt.value}
              checked={eventSet.has(opt.value)}
              onCheckedChange={(checked) => toggleEvent(opt.value, checked === true)}
              label={opt.label}
              hint={opt.description}
            />
          ))}
        </CheckboxGroup>

        {formError ? (
          <p className="text-sm text-error-700" role="alert">
            {formError}
          </p>
        ) : null}

        <Button type="submit" variant="primary" isLoading={createMutation.isPending}>
          <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
          Create webhook
        </Button>
      </form>

      <div className="rounded-lg border border-border bg-white p-6">
        <h3 className="mb-4 text-base font-semibold text-text-primary">Registered endpoints</h3>
        {webhooks.length === 0 ? (
          <p className="text-sm text-text-secondary">No webhooks yet.</p>
        ) : (
          <ul className="space-y-4" aria-label="Registered webhooks">
            {webhooks.map((hook) => (
              <li key={hook.id} className="rounded-md border border-border bg-bg-secondary p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="break-all font-mono text-sm text-text-primary">{hook.url}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {hook.events.map((ev) => (
                        <Badge key={ev} variant="secondary">
                          {ev}
                        </Badge>
                      ))}
                      <Badge variant={hook.isActive ? 'success' : 'outline'}>
                        {hook.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testMutation.mutate(hook.id)}
                      isLoading={testMutation.isPending && testMutation.variables === hook.id}
                      disabled={!hook.events.includes('scan.completed')}
                      disabledReason={
                        !hook.events.includes('scan.completed')
                          ? 'Subscribe to scan.completed to send a test'
                          : undefined
                      }
                    >
                      <Send className="mr-1.5 h-4 w-4" aria-hidden="true" />
                      Test
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeliveriesFor((cur) => (cur === hook.id ? null : hook.id))}
                    >
                      <History className="mr-1.5 h-4 w-4" aria-hidden="true" />
                      Deliveries
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-error-700 hover:bg-error-50"
                      onClick={() => {
                        if (
                          window.confirm(
                            'Remove this webhook? Future events will no longer be delivered.',
                          )
                        ) {
                          deleteMutation.mutate(hook.id);
                        }
                      }}
                      isLoading={deleteMutation.isPending && deleteMutation.variables === hook.id}
                    >
                      <Trash2 className="mr-1.5 h-4 w-4" aria-hidden="true" />
                      Remove
                    </Button>
                  </div>
                </div>

                {deliveriesFor === hook.id ? (
                  <div className="mt-4 border-t border-border pt-3">
                    <h4 className="mb-2 text-sm font-medium text-text-primary">
                      Recent deliveries
                    </h4>
                    {deliveriesLoading ? (
                      <p className="text-sm text-text-secondary">Loading…</p>
                    ) : deliveries.length === 0 ? (
                      <p className="text-sm text-text-secondary">No deliveries yet.</p>
                    ) : (
                      <ul className="space-y-2">
                        {deliveries.map((d) => (
                          <li key={d.id} className="text-sm text-text-secondary">
                            <span className="font-medium text-text-primary">{d.eventType}</span>
                            {' · '}
                            <Badge
                              variant={
                                d.status === 'delivered'
                                  ? 'success'
                                  : d.status === 'failed'
                                    ? 'error'
                                    : 'secondary'
                              }
                              size="sm"
                            >
                              {d.status}
                            </Badge>
                            {' · '}
                            {new Date(d.createdAt).toLocaleString('en-IN')}
                            {d.lastError ? (
                              <span className="mt-1 block text-error-700">{d.lastError}</span>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
