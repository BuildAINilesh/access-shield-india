/**
 * Outbound webhook delivery (AN-F010) — HMAC-SHA256 signed payloads.
 */

import { createHmac, randomBytes } from 'crypto';
import type { Database } from '@accessshield/db';
import { orgWebhooks, webhookDeliveries } from '@accessshield/db';
import { and, eq, isNull } from 'drizzle-orm';
import { logger } from '../lib/logger';

export const WEBHOOK_EVENTS = [
  'scan.completed',
  'violation.introduced',
  'certificate.changed',
  'digest.daily',
] as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

export function generateWebhookSecret(): string {
  return randomBytes(32).toString('hex');
}

export function signPayload(secret: string, body: string): string {
  return createHmac('sha256', secret).update(body).digest('hex');
}

/** Slack Incoming Webhooks only accept hooks.slack.com hosts. */
export function isSlackIncomingWebhook(url: string): boolean {
  try {
    return new URL(url).hostname === 'hooks.slack.com';
  } catch {
    return false;
  }
}

export interface DigestSummary {
  orgName: string;
  openCount: number;
  criticalCount: number;
  seriousCount: number;
  topIssues: Array<{ title: string; severity: string }>;
  portalUrl: string;
}

/** Build Slack Block Kit body for Incoming Webhooks. */
export function formatSlackPayload(
  eventType: WebhookEvent,
  payload: Record<string, unknown>,
): string {
  if (eventType === 'digest.daily') {
    const d = payload as unknown as DigestSummary;
    const lines = d.topIssues
      .slice(0, 5)
      .map((i) => `• *${i.severity}* — ${i.title}`)
      .join('\n');
    const text = `AccessibleNow daily digest for ${d.orgName}: ${d.openCount} open issues (${d.criticalCount} critical, ${d.seriousCount} serious)`;
    return JSON.stringify({
      text,
      blocks: [
        {
          type: 'header',
          text: { type: 'plain_text', text: 'AccessibleNow daily digest', emoji: true },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${d.orgName}*\nOpen: *${d.openCount}* · Critical: *${d.criticalCount}* · Serious: *${d.seriousCount}*`,
          },
        },
        ...(lines
          ? [
              {
                type: 'section',
                text: { type: 'mrkdwn', text: `*Top issues*\n${lines}` },
              },
            ]
          : []),
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: { type: 'plain_text', text: 'Open issues', emoji: true },
              url: d.portalUrl,
            },
          ],
        },
      ],
    });
  }

  const text = `AccessibleNow event: ${eventType}`;
  return JSON.stringify({
    text,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${eventType}*\n\`\`\`${JSON.stringify(payload).slice(0, 2500)}\`\`\``,
        },
      },
    ],
  });
}

export async function deliverWebhookEvent(
  db: Database,
  orgId: string,
  eventType: WebhookEvent,
  payload: Record<string, unknown>,
  options?: { webhookId?: string },
): Promise<void> {
  const conditions = [
    eq(orgWebhooks.organisationId, orgId),
    eq(orgWebhooks.isActive, true),
    isNull(orgWebhooks.deletedAt),
  ];
  if (options?.webhookId) {
    conditions.push(eq(orgWebhooks.id, options.webhookId));
  }

  const hooks = await db
    .select()
    .from(orgWebhooks)
    .where(and(...conditions));

  const envelope = {
    event: eventType,
    occurredAt: new Date().toISOString(),
    data: payload,
  };

  for (const hook of hooks) {
    if (!hook.events.includes(eventType)) continue;

    const slack = isSlackIncomingWebhook(hook.url);
    const body = slack
      ? formatSlackPayload(eventType, payload)
      : JSON.stringify(envelope);

    const [delivery] = await db
      .insert(webhookDeliveries)
      .values({
        organisationId: orgId,
        webhookId: hook.id,
        eventType,
        status: 'pending',
        attempts: 1,
        payloadJson: slack ? (JSON.parse(body) as unknown) : envelope,
      })
      .returning({ id: webhookDeliveries.id });

    const signature = signPayload(hook.secret, body);

    try {
      const response = await fetch(hook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-AccessibleNow-Event': eventType,
          'X-AccessibleNow-Signature': signature,
          'User-Agent': 'AccessibleNow-Webhooks/1.0',
        },
        body,
        signal: AbortSignal.timeout(10_000),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      if (delivery) {
        await db
          .update(webhookDeliveries)
          .set({ status: 'delivered', updatedAt: new Date().toISOString() })
          .where(eq(webhookDeliveries.id, delivery.id));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.warn({ err, webhookId: hook.id, eventType }, 'Webhook delivery failed');
      if (delivery) {
        await db
          .update(webhookDeliveries)
          .set({
            status: 'failed',
            lastError: message.slice(0, 500),
            updatedAt: new Date().toISOString(),
          })
          .where(eq(webhookDeliveries.id, delivery.id));
      }
    }
  }
}
