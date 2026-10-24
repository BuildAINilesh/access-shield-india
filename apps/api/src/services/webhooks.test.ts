import { describe, expect, it } from 'vitest';
import {
  formatSlackPayload,
  isSlackIncomingWebhook,
  signPayload,
  WEBHOOK_EVENTS,
} from './webhooks';

describe('webhooks', () => {
  it('signs payloads with HMAC-SHA256', () => {
    const sig = signPayload('test-secret', '{"event":"scan.completed"}');
    expect(sig).toMatch(/^[a-f0-9]{64}$/);
    expect(signPayload('test-secret', '{"event":"scan.completed"}')).toBe(sig);
    expect(signPayload('other', '{"event":"scan.completed"}')).not.toBe(sig);
  });

  it('includes digest.daily in supported events', () => {
    expect(WEBHOOK_EVENTS).toContain('digest.daily');
  });

  it('detects Slack Incoming Webhook hosts', () => {
    expect(isSlackIncomingWebhook('https://hooks.slack.com/services/T/B/x')).toBe(true);
    expect(isSlackIncomingWebhook('https://example.com/hooks')).toBe(false);
    expect(isSlackIncomingWebhook('not-a-url')).toBe(false);
  });

  it('formats Slack digest Block Kit payloads', () => {
    const raw = formatSlackPayload('digest.daily', {
      orgName: 'Acme',
      openCount: 12,
      criticalCount: 2,
      seriousCount: 4,
      topIssues: [{ title: 'Missing alt', severity: 'critical' }],
      portalUrl: 'http://localhost:3000/dashboard/issues',
    });
    const body = JSON.parse(raw) as { text: string; blocks: unknown[] };
    expect(body.text).toContain('Acme');
    expect(body.blocks.length).toBeGreaterThan(1);
  });
});
