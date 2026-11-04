/**
 * AN Learn API — public lesson catalog + auth progress (AN-F006 bootstrap).
 */

import type { Database } from '@accessshield/db';
import { learnLessons, learnProgress, lookupUserByAuthId } from '@accessshield/db';
import type { ApiResponse } from '@accessshield/types';
import { and, asc, eq } from 'drizzle-orm';
import type { NextFunction, Request, Response, Router as ExpressRouter } from 'express';
import { Router } from 'express';
import { z } from 'zod';
import { sendProblem } from '../lib/problem-details';
import { requireRoles } from '../middleware/rbac';

const progressSchema = z.object({
  status: z.enum(['started', 'completed']),
});

/** Public catalog — mount before auth middleware. */
export function createLearnPublicRouter(db: Database): ExpressRouter {
  const router = Router();

  router.get('/lessons', async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rows = await db
        .select({
          id: learnLessons.id,
          slug: learnLessons.slug,
          title: learnLessons.title,
          summary: learnLessons.summary,
          durationMinutes: learnLessons.durationMinutes,
          sortOrder: learnLessons.sortOrder,
        })
        .from(learnLessons)
        .where(eq(learnLessons.isPublished, true))
        .orderBy(asc(learnLessons.sortOrder));

      const response: ApiResponse<{ lessons: typeof rows }> = {
        data: { lessons: rows },
        timestamp: new Date().toISOString(),
      };
      res.json(response);
    } catch (err) {
      next(err);
    }
  });

  router.get(
    '/lessons/:slug',
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const slug = String(req.params.slug ?? '').trim();
        if (!slug || slug.length > 128) {
          sendProblem(res, 400, 'validation-error', 'Invalid lesson slug');
          return;
        }

        const [lesson] = await db
          .select()
          .from(learnLessons)
          .where(and(eq(learnLessons.slug, slug), eq(learnLessons.isPublished, true)))
          .limit(1);

        if (!lesson) {
          sendProblem(res, 404, 'not-found', 'Lesson not found');
          return;
        }

        const response: ApiResponse<typeof lesson> = {
          data: lesson,
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

/** Progress mutations — mount after auth middleware. */
export function createLearnAuthRouter(db: Database): ExpressRouter {
  const router = Router();

  router.post(
    '/lessons/:slug/progress',
    requireRoles('developer', 'accessibility_officer', 'customer_admin', 'auditor'),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const parsed = progressSchema.safeParse(req.body);
        if (!parsed.success) {
          sendProblem(res, 400, 'validation-error', 'Invalid progress payload');
          return;
        }

        const slug = String(req.params.slug ?? '').trim();
        const [lesson] = await db
          .select({ id: learnLessons.id })
          .from(learnLessons)
          .where(eq(learnLessons.slug, slug))
          .limit(1);
        if (!lesson) {
          sendProblem(res, 404, 'not-found', 'Lesson not found');
          return;
        }

        const appUser = await lookupUserByAuthId(db, req.user!.sub);
        if (!appUser) {
          sendProblem(res, 403, 'forbidden', 'User profile not found for this account');
          return;
        }

        const orgId = req.user!.org_id;
        const completedAt =
          parsed.data.status === 'completed' ? new Date().toISOString() : null;

        const existing = await db
          .select({ id: learnProgress.id })
          .from(learnProgress)
          .where(
            and(eq(learnProgress.userId, appUser.id), eq(learnProgress.lessonId, lesson.id)),
          )
          .limit(1);

        if (existing[0]) {
          await db
            .update(learnProgress)
            .set({
              status: parsed.data.status,
              completedAt,
              updatedAt: new Date().toISOString(),
            })
            .where(eq(learnProgress.id, existing[0].id));
        } else {
          await db.insert(learnProgress).values({
            organisationId: orgId,
            userId: appUser.id,
            lessonId: lesson.id,
            status: parsed.data.status,
            completedAt,
          });
        }

        res.status(201).json({
          data: { lessonId: lesson.id, status: parsed.data.status },
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}
