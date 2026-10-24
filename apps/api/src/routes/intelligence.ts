/**
 * A11y Intelligence API — search curated package issues (AN-F002 / AN-F004).
 * Public read + community report submission (before auth middleware).
 */

import type { Database } from '@accessshield/db';
import { a11yIssueReports } from '@accessshield/db';
import type { ApiResponse } from '@accessshield/types';
import type { NextFunction, Request, Response, Router as ExpressRouter } from 'express';
import { Router } from 'express';
import { z } from 'zod';
import { sendProblem } from '../lib/problem-details';
import { getIntelligenceIssueByAnId, searchIntelligenceIssues } from '../services/oss-scan';

const listQuerySchema = z.object({
  q: z.string().max(200).optional(),
  package: z.string().max(255).optional(),
  severity: z.enum(['critical', 'high', 'medium', 'low']).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

const reportSchema = z.object({
  packageName: z.string().min(1).max(255),
  version: z.string().max(64).optional(),
  description: z.string().min(20).max(5000),
  reporterEmail: z.string().email().max(255).optional(),
});

export function createIntelligenceRouter(db: Database): ExpressRouter {
  const router = Router();

  // PUBLIC — GET /api/v1/intelligence/issues
  router.get('/issues', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = listQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        sendProblem(res, 400, 'validation-error', 'Invalid query parameters', undefined, {
          errors: parsed.error.flatten().fieldErrors,
        });
        return;
      }

      const result = await searchIntelligenceIssues(db, {
        q: parsed.data.q,
        packageName: parsed.data.package,
        severity: parsed.data.severity,
        limit: parsed.data.limit,
      });

      const response: ApiResponse<typeof result> = {
        data: result,
        timestamp: new Date().toISOString(),
      };
      res.json(response);
    } catch (err) {
      next(err);
    }
  });

  // PUBLIC — GET /api/v1/intelligence/issues/:anId
  router.get(
    '/issues/:anId',
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const anId = String(req.params.anId ?? '').trim();
        if (!anId || anId.length > 32) {
          sendProblem(res, 400, 'validation-error', 'Invalid issue id');
          return;
        }

        const issue = await getIntelligenceIssueByAnId(db, anId);
        if (!issue) {
          sendProblem(res, 404, 'not-found', `Issue ${anId} not found`);
          return;
        }

        const response: ApiResponse<typeof issue> = {
          data: issue,
          timestamp: new Date().toISOString(),
        };
        res.json(response);
      } catch (err) {
        next(err);
      }
    },
  );

  // PUBLIC — POST /api/v1/intelligence/reports (community submission)
  router.post(
    '/reports',
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const parsed = reportSchema.safeParse(req.body);
        if (!parsed.success) {
          sendProblem(res, 400, 'validation-error', 'Invalid report payload', undefined, {
            errors: parsed.error.flatten().fieldErrors,
          });
          return;
        }

        const [row] = await db
          .insert(a11yIssueReports)
          .values({
            packageName: parsed.data.packageName,
            version: parsed.data.version ?? null,
            description: parsed.data.description,
            reporterEmail: parsed.data.reporterEmail ?? null,
            status: 'pending',
          })
          .returning({ id: a11yIssueReports.id, status: a11yIssueReports.status });

        res.status(201).json({
          data: row,
          timestamp: new Date().toISOString(),
        } satisfies ApiResponse<typeof row>);
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}
