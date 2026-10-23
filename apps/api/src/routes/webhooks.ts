/**
 * Webhook registration API (AN-F010).
 */

import type { Database } from '@accessshield/db';
import { orgWebhooks, webhookDeliveries } from '@accessshield/db';
import type { ApiResponse } from '@accessshield/types';
import { and, desc, eq, isNull } from 'drizzle-orm';
import type { NextFunction, Request, Response, Router as ExpressRouter } from 'express';
import { Router } from 'express';
import { z } from 'zod';
import { sendProblem } from '../lib/problem-details';
import { requireRoles } from '../middleware/rbac';
import { WEBHOOK_EVENTS, deliverWebhookEvent, generateWebhookSecret } from '../services/webhooks';

const registerSchema = z.object({
  url: z.string().url().max(2000),
  events: z.array(z.enum(WEBHOOK_EVENTS)).min(1),
  secret: z.string().min(16).max(128).optional(),
});

export function createWebhooksRouter(db: Database): ExpressRouter {
  const router = Router();

  router.get(
    '/',
    requireRoles('customer_admin', 'accessibility_officer'),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const orgId = req.user!.org_id;
        const rows = await db
          .select({
            id: orgWebhooks.id,
            url: orgWebhooks.url,
            events: orgWebhooks.events,
            isActive: orgWebhooks.isActive,
            createdAt: orgWebhooks.createdAt,
          })
          .from(orgWebhooks)
          .where(and(eq(orgWebhooks.organisationId, orgId), isNull(orgWebhooks.deletedAt)))
          .orderBy(desc(orgWebhooks.createdAt));

        const response: ApiResponse<typeof rows> = {
          data: rows,
          timestamp: new Date().toISOString(),
        };
        res.json(response);
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    '/',
    requireRoles('customer_admin'),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const parsed = registerSchema.safeParse(req.body);
        if (!parsed.success) {
          sendProblem(res, 400, 'validation-error', 'Invalid webhook payload', undefined, {
            errors: parsed.error.flatten().fieldErrors,
          });
          return;
        }

        const orgId = req.user!.org_id;
        const secret = parsed.data.secret ?? generateWebhookSecret();

        const [row] = await db
          .insert(orgWebhooks)
          .values({
            organisationId: orgId,
            url: parsed.data.url,
            secret,
            events: parsed.data.events,
          })
          .returning({
            id: orgWebhooks.id,
            url: orgWebhooks.url,
            events: orgWebhooks.events,
            isActive: orgWebhooks.isActive,
            createdAt: orgWebhooks.createdAt,
          });

        const response: ApiResponse<typeof row & { secret: string }> = {
          data: { ...row!, secret },
          timestamp: new Date().toISOString(),
        };
        res.status(201).json(response);
      } catch (err) {
        next(err);
      }
    },
  );

  router.delete(
    '/:id',
    requireRoles('customer_admin'),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const webhookId = req.params.id ?? '';
        const orgId = req.user!.org_id;
        if (!z.string().uuid().safeParse(webhookId).success) {
          sendProblem(res, 400, 'validation-error', 'Invalid webhook ID');
          return;
        }

        const [updated] = await db
          .update(orgWebhooks)
          .set({ deletedAt: new Date().toISOString(), isActive: false })
          .where(and(eq(orgWebhooks.id, webhookId), eq(orgWebhooks.organisationId, orgId)))
          .returning({ id: orgWebhooks.id });

        if (!updated) {
          sendProblem(res, 404, 'not-found', 'Webhook not found');
          return;
        }

        res.status(204).send();
      } catch (err) {
        next(err);
      }
    },
  );

  router.get(
    '/:id/deliveries',
    requireRoles('customer_admin', 'accessibility_officer'),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const webhookId = req.params.id ?? '';
        const orgId = req.user!.org_id;
        if (!z.string().uuid().safeParse(webhookId).success) {
          sendProblem(res, 400, 'validation-error', 'Invalid webhook ID');
          return;
        }

        const rows = await db
          .select({
            id: webhookDeliveries.id,
            eventType: webhookDeliveries.eventType,
            status: webhookDeliveries.status,
            attempts: webhookDeliveries.attempts,
            lastError: webhookDeliveries.lastError,
            createdAt: webhookDeliveries.createdAt,
          })
          .from(webhookDeliveries)
          .where(
            and(
              eq(webhookDeliveries.webhookId, webhookId),
              eq(webhookDeliveries.organisationId, orgId),
            ),
          )
          .orderBy(desc(webhookDeliveries.createdAt))
          .limit(50);

        const response: ApiResponse<typeof rows> = {
          data: rows,
          timestamp: new Date().toISOString(),
        };
        res.json(response);
      } catch (err) {
        next(err);
      }
    },
  );

  /** POST /webhooks/:id/test — fire a sample scan.completed event to this endpoint only. */
  router.post(
    '/:id/test',
    requireRoles('customer_admin'),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const webhookId = req.params.id ?? '';
        const orgId = req.user!.org_id;
        if (!z.string().uuid().safeParse(webhookId).success) {
          sendProblem(res, 400, 'validation-error', 'Invalid webhook ID');
          return;
        }

        const [hook] = await db
          .select({
            id: orgWebhooks.id,
            events: orgWebhooks.events,
            isActive: orgWebhooks.isActive,
          })
          .from(orgWebhooks)
          .where(
            and(
              eq(orgWebhooks.id, webhookId),
              eq(orgWebhooks.organisationId, orgId),
              isNull(orgWebhooks.deletedAt),
            ),
          )
          .limit(1);

        if (!hook) {
          sendProblem(res, 404, 'not-found', 'Webhook not found');
          return;
        }

        if (!hook.isActive) {
          sendProblem(res, 422, 'inactive', 'Webhook is inactive');
          return;
        }

        // Temporarily deliver only to this hook by using org-wide delivery filtered in service —
        // call deliverWebhookEvent which fans out; acceptable for test if events include scan.completed.
        if (!hook.events.includes('scan.completed')) {
          sendProblem(
            res,
            422,
            'event-not-subscribed',
            'Subscribe to scan.completed to send a test event',
          );
          return;
        }

        await deliverWebhookEvent(
          db,
          orgId,
          'scan.completed',
          {
            test: true,
            webhookId: hook.id,
            message: 'AccessibleNow webhook test delivery',
          },
          { webhookId: hook.id },
        );

        const response: ApiResponse<{ ok: true }> = {
          data: { ok: true },
          timestamp: new Date().toISOString(),
        };
        res.json(response);
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}
