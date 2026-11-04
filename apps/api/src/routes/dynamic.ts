/**
 * AN Dynamic journeys API (AN-F003).
 */

import type { Database } from '@accessshield/db';
import {
  journeyCredentials,
  journeyScans,
  journeyStepResults,
  journeys,
} from '@accessshield/db';
import type { ApiResponse } from '@accessshield/types';
import { and, asc, desc, eq, isNull } from 'drizzle-orm';
import type { NextFunction, Request, Response, Router as ExpressRouter } from 'express';
import { Router } from 'express';
import { z } from 'zod';
import { sendProblem } from '../lib/problem-details';
import { requireRoles } from '../middleware/rbac';
import { publishJourneyScanJob } from '../scanner/journey-queue';
import { encryptCredentials } from '../services/journey-crypto';
import {
  journeyDefinitionSchema,
  slugifyJourneyName,
} from '../services/journey-dsl';

const createSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(128).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().max(2000).optional(),
  definition: journeyDefinitionSchema,
  credentials: z.record(z.string().max(500)).optional(),
});

const updateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional().nullable(),
  definition: journeyDefinitionSchema.optional(),
  isActive: z.boolean().optional(),
  credentials: z.record(z.string().max(500)).optional(),
});

export function createDynamicRouter(db: Database): ExpressRouter {
  const router = Router();

  router.get(
    '/journeys',
    requireRoles('developer', 'accessibility_officer', 'customer_admin', 'auditor'),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const orgId = req.user!.org_id;
        const rows = await db
          .select({
            id: journeys.id,
            name: journeys.name,
            slug: journeys.slug,
            description: journeys.description,
            isActive: journeys.isActive,
            createdAt: journeys.createdAt,
            updatedAt: journeys.updatedAt,
          })
          .from(journeys)
          .where(and(eq(journeys.organisationId, orgId), isNull(journeys.deletedAt)))
          .orderBy(desc(journeys.updatedAt));

        res.json({
          data: rows,
          timestamp: new Date().toISOString(),
        } satisfies ApiResponse<typeof rows>);
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    '/journeys',
    requireRoles('customer_admin', 'accessibility_officer', 'developer'),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const parsed = createSchema.safeParse(req.body);
        if (!parsed.success) {
          sendProblem(res, 400, 'validation-error', 'Invalid journey payload', undefined, {
            errors: parsed.error.flatten(),
          });
          return;
        }

        const orgId = req.user!.org_id;
        const slug = parsed.data.slug ?? slugifyJourneyName(parsed.data.name);

        const [row] = await db
          .insert(journeys)
          .values({
            organisationId: orgId,
            name: parsed.data.name,
            slug,
            description: parsed.data.description ?? null,
            definitionJson: parsed.data.definition,
          })
          .returning({
            id: journeys.id,
            name: journeys.name,
            slug: journeys.slug,
            createdAt: journeys.createdAt,
          });

        if (parsed.data.credentials && Object.keys(parsed.data.credentials).length > 0) {
          const blob = encryptCredentials(parsed.data.credentials);
          await db.insert(journeyCredentials).values({
            organisationId: orgId,
            journeyId: row!.id,
            label: 'default',
            ciphertext: blob.ciphertext,
            iv: blob.iv,
            authTag: blob.authTag,
          });
        }

        res.status(201).json({
          data: row,
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        next(err);
      }
    },
  );

  router.get(
    '/journeys/:id',
    requireRoles('developer', 'accessibility_officer', 'customer_admin', 'auditor'),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const orgId = req.user!.org_id;
        const id = String(req.params.id);
        const [row] = await db
          .select()
          .from(journeys)
          .where(
            and(eq(journeys.id, id), eq(journeys.organisationId, orgId), isNull(journeys.deletedAt)),
          )
          .limit(1);

        if (!row) {
          sendProblem(res, 404, 'not-found', 'Journey not found');
          return;
        }

        const [cred] = await db
          .select({ id: journeyCredentials.id, label: journeyCredentials.label })
          .from(journeyCredentials)
          .where(
            and(
              eq(journeyCredentials.journeyId, id),
              eq(journeyCredentials.organisationId, orgId),
            ),
          )
          .limit(1);

        res.json({
          data: {
            ...row,
            hasCredentials: Boolean(cred),
            credentialLabel: cred?.label ?? null,
          },
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        next(err);
      }
    },
  );

  router.patch(
    '/journeys/:id',
    requireRoles('customer_admin', 'accessibility_officer', 'developer'),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const parsed = updateSchema.safeParse(req.body);
        if (!parsed.success) {
          sendProblem(res, 400, 'validation-error', 'Invalid update payload', undefined, {
            errors: parsed.error.flatten(),
          });
          return;
        }

        const orgId = req.user!.org_id;
        const id = String(req.params.id);
        const [existing] = await db
          .select({ id: journeys.id })
          .from(journeys)
          .where(
            and(eq(journeys.id, id), eq(journeys.organisationId, orgId), isNull(journeys.deletedAt)),
          )
          .limit(1);

        if (!existing) {
          sendProblem(res, 404, 'not-found', 'Journey not found');
          return;
        }

        await db
          .update(journeys)
          .set({
            ...(parsed.data.name ? { name: parsed.data.name } : {}),
            ...(parsed.data.description !== undefined
              ? { description: parsed.data.description }
              : {}),
            ...(parsed.data.definition ? { definitionJson: parsed.data.definition } : {}),
            ...(parsed.data.isActive !== undefined ? { isActive: parsed.data.isActive } : {}),
            updatedAt: new Date().toISOString(),
          })
          .where(eq(journeys.id, id));

        if (parsed.data.credentials && Object.keys(parsed.data.credentials).length > 0) {
          const blob = encryptCredentials(parsed.data.credentials);
          const [existingCred] = await db
            .select({ id: journeyCredentials.id })
            .from(journeyCredentials)
            .where(eq(journeyCredentials.journeyId, id))
            .limit(1);

          if (existingCred) {
            await db
              .update(journeyCredentials)
              .set({
                ciphertext: blob.ciphertext,
                iv: blob.iv,
                authTag: blob.authTag,
                updatedAt: new Date().toISOString(),
              })
              .where(eq(journeyCredentials.id, existingCred.id));
          } else {
            await db.insert(journeyCredentials).values({
              organisationId: orgId,
              journeyId: id,
              label: 'default',
              ciphertext: blob.ciphertext,
              iv: blob.iv,
              authTag: blob.authTag,
            });
          }
        }

        res.json({
          data: { id },
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        next(err);
      }
    },
  );

  router.delete(
    '/journeys/:id',
    requireRoles('customer_admin'),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const orgId = req.user!.org_id;
        const id = String(req.params.id);
        await db
          .update(journeys)
          .set({ deletedAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
          .where(
            and(eq(journeys.id, id), eq(journeys.organisationId, orgId), isNull(journeys.deletedAt)),
          );
        res.status(204).send();
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    '/journeys/:id/scans',
    requireRoles('customer_admin', 'accessibility_officer', 'developer'),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const orgId = req.user!.org_id;
        const id = String(req.params.id);
        const [journey] = await db
          .select({ id: journeys.id, isActive: journeys.isActive })
          .from(journeys)
          .where(
            and(eq(journeys.id, id), eq(journeys.organisationId, orgId), isNull(journeys.deletedAt)),
          )
          .limit(1);

        if (!journey) {
          sendProblem(res, 404, 'not-found', 'Journey not found');
          return;
        }
        if (!journey.isActive) {
          sendProblem(res, 422, 'inactive', 'Journey is inactive');
          return;
        }

        const [scan] = await db
          .insert(journeyScans)
          .values({
            organisationId: orgId,
            journeyId: id,
            status: 'queued',
          })
          .returning({ id: journeyScans.id, status: journeyScans.status });

        try {
          await publishJourneyScanJob({
            journeyScanId: scan!.id,
            journeyId: id,
            orgId,
          });
        } catch (err) {
          await db
            .update(journeyScans)
            .set({
              status: 'failed',
              errorMessage: 'Failed to enqueue journey scan',
              completedAt: new Date().toISOString(),
            })
            .where(eq(journeyScans.id, scan!.id));
          throw err;
        }

        res.status(201).json({
          data: scan,
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        next(err);
      }
    },
  );

  router.get(
    '/journeys/:id/scans',
    requireRoles('developer', 'accessibility_officer', 'customer_admin', 'auditor'),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const orgId = req.user!.org_id;
        const id = String(req.params.id);
        const rows = await db
          .select({
            id: journeyScans.id,
            status: journeyScans.status,
            totalViolations: journeyScans.totalViolations,
            startedAt: journeyScans.startedAt,
            completedAt: journeyScans.completedAt,
            createdAt: journeyScans.createdAt,
            errorMessage: journeyScans.errorMessage,
          })
          .from(journeyScans)
          .where(and(eq(journeyScans.journeyId, id), eq(journeyScans.organisationId, orgId)))
          .orderBy(desc(journeyScans.createdAt))
          .limit(50);

        res.json({
          data: rows,
          timestamp: new Date().toISOString(),
        } satisfies ApiResponse<typeof rows>);
      } catch (err) {
        next(err);
      }
    },
  );

  router.get(
    '/scans/:scanId',
    requireRoles('developer', 'accessibility_officer', 'customer_admin', 'auditor'),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const orgId = req.user!.org_id;
        const scanId = String(req.params.scanId);
        const [scan] = await db
          .select()
          .from(journeyScans)
          .where(and(eq(journeyScans.id, scanId), eq(journeyScans.organisationId, orgId)))
          .limit(1);

        if (!scan) {
          sendProblem(res, 404, 'not-found', 'Journey scan not found');
          return;
        }

        const steps = await db
          .select({
            id: journeyStepResults.id,
            stepId: journeyStepResults.stepId,
            stepIndex: journeyStepResults.stepIndex,
            action: journeyStepResults.action,
            status: journeyStepResults.status,
            pageUrl: journeyStepResults.pageUrl,
            violationCount: journeyStepResults.violationCount,
            errorMessage: journeyStepResults.errorMessage,
            durationMs: journeyStepResults.durationMs,
            violationsJson: journeyStepResults.violationsJson,
          })
          .from(journeyStepResults)
          .where(eq(journeyStepResults.journeyScanId, scanId))
          .orderBy(asc(journeyStepResults.stepIndex));

        res.json({
          data: { scan, steps },
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}
