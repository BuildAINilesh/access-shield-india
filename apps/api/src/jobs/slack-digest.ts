/**
 * Daily accessibility digest → org webhooks subscribed to digest.daily (AN-F010).
 * Slack Incoming Webhook URLs get Block Kit; others get the HMAC JSON envelope.
 */

import type { Database } from '@accessshield/db';
import { issues, organisations, orgWebhooks } from '@accessshield/db';
import { and, eq, inArray, isNull, sql } from 'drizzle-orm';
import type { Redis } from 'ioredis';
import { logger } from '../lib/logger';
import { deliverWebhookEvent, type DigestSummary } from '../services/webhooks';

const LOCK_KEY = 'slack-digest-lock';
const LOCK_TTL_SECONDS = 55 * 60;
/** Check hourly; send at most once per org per UTC day via Redis marker. */
const CHECK_INTERVAL_MS = 60 * 60 * 1000;
const SENT_KEY_PREFIX = 'slack-digest:sent:';

const OPEN_STATUSES = ['open', 'in_progress'] as const;

const SEVERITY_ORDER: Record<string, number> = {
  critical: 0,
  serious: 1,
  moderate: 2,
  minor: 3,
};

function utcDateKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

export async function buildDigestForOrg(
  db: Database,
  orgId: string,
  orgName: string,
): Promise<DigestSummary> {
  const rows = await db
    .select({
      title: issues.title,
      severity: issues.severity,
    })
    .from(issues)
    .where(
      and(eq(issues.organisationId, orgId), inArray(issues.status, [...OPEN_STATUSES])),
    )
    .limit(500);

  const criticalCount = rows.filter((r) => r.severity === 'critical').length;
  const seriousCount = rows.filter((r) => r.severity === 'serious').length;
  const topIssues = [...rows]
    .sort(
      (a, b) =>
        (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9),
    )
    .slice(0, 5)
    .map((r) => ({ title: r.title, severity: r.severity }));

  const portalBase =
    process.env.CORS_ORIGIN ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  return {
    orgName,
    openCount: rows.length,
    criticalCount,
    seriousCount,
    topIssues,
    portalUrl: `${portalBase.replace(/\/$/, '')}/dashboard/issues`,
  };
}

export async function runSlackDigest(db: Database, redis: Redis): Promise<number> {
  const locked = await redis.set(LOCK_KEY, '1', 'EX', LOCK_TTL_SECONDS, 'NX');
  if (locked !== 'OK') return 0;

  const day = utcDateKey();
  let sent = 0;

  try {
    const hooks = await db
      .select({
        id: orgWebhooks.id,
        organisationId: orgWebhooks.organisationId,
        events: orgWebhooks.events,
      })
      .from(orgWebhooks)
      .where(and(eq(orgWebhooks.isActive, true), isNull(orgWebhooks.deletedAt)));

    const orgIds = [
      ...new Set(
        hooks
          .filter((h) => h.events.includes('digest.daily'))
          .map((h) => h.organisationId),
      ),
    ];

    for (const orgId of orgIds) {
      const markerKey = `${SENT_KEY_PREFIX}${day}:${orgId}`;
      const already = await redis.get(markerKey);
      if (already) continue;

      const [org] = await db
        .select({ name: organisations.name })
        .from(organisations)
        .where(eq(organisations.id, orgId))
        .limit(1);

      const digest = await buildDigestForOrg(db, orgId, org?.name ?? 'Organisation');
      await deliverWebhookEvent(db, orgId, 'digest.daily', digest as unknown as Record<string, unknown>);

      // Mark sent until end of next UTC day (+ 2h buffer)
      await redis.set(markerKey, '1', 'EX', 26 * 60 * 60);
      sent += 1;
    }

    if (sent > 0) {
      logger.info({ sent, day }, 'Slack/webhook daily digests delivered');
    }
  } catch (err) {
    logger.error({ err }, 'Slack digest job failed');
  }

  return sent;
}

export function startSlackDigestJob(db: Database, redis: Redis): () => void {
  const timer = setInterval(() => {
    void runSlackDigest(db, redis);
  }, CHECK_INTERVAL_MS);

  // Prefer running after ~09:00 UTC on first tick; still safe if restarted mid-day (Redis marker)
  setTimeout(() => {
    void runSlackDigest(db, redis);
  }, 30_000);

  return () => clearInterval(timer);
}

/** Exposed for tests — count open issues without side effects. */
export async function countOpenIssues(db: Database, orgId: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(issues)
    .where(
      and(eq(issues.organisationId, orgId), inArray(issues.status, [...OPEN_STATUSES])),
    );
  return row?.count ?? 0;
}
