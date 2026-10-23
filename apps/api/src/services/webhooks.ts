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
] as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

export function generateWebhookSecret(): string {
  return randomBytes(32).toString('hex');
}

export function signPayload(secret: string, body: string): string {
  return createHmac('sha256', secret).update(body).digest('hex');
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

  const body = JSON.stringify({
    event: eventType,
    occurredAt: new Date().toISOString(),
    data: payload,
  });

  for (const hook of hooks) {
    if (!hook.events.includes(eventType)) continue;

    const [delivery] = await db
      .insert(webhookDeliveries)
      .values({
        organisationId: orgId,
        webhookId: hook.id,
        eventType,
        status: 'pending',
        attempts: 1,
        payloadJson: JSON.parse(body) as unknown,
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
