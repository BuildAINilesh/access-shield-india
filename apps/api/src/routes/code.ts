/**
 * AN Code API — static snippet analysis + quick fixes for IDE / portal (AN-F001 / AN-F005).
 */

import { createHash } from 'crypto';
import type { Database } from '@accessshield/db';
import { codeDiagnostics, organisations } from '@accessshield/db';
import { eq } from 'drizzle-orm';
import {
  Router,
  type NextFunction,
  type Request,
  type Response,
  type Router as ExpressRouter,
} from 'express';
import { z } from 'zod';
import type { ApiResponse } from '@accessshield/types';
import { sendProblem } from '../lib/problem-details';
import { requireRoles } from '../middleware/rbac';
import { analyzeCode } from '../services/code-analyzer';
import { generateCodeFix } from '../services/code-fix';

const analyzeSchema = z.object({
  code: z.string().min(1).max(200_000),
  filetype: z.string().min(1).max(32),
  sessionId: z.string().max(128).optional(),
  filePath: z.string().max(500).optional(),
});

const fixSchema = z.object({
  code: z.string().min(1).max(50_000),
  ruleId: z.string().min(1).max(100),
  filetype: z.string().max(32).optional(),
  wcagCriterion: z.string().max(32).optional(),
  context: z.string().max(2000).optional(),
  violationId: z.string().uuid().optional(),
});

export function createCodeRouter(db: Database): ExpressRouter {
  const router = Router();

  router.post(
    '/analyze',
    requireRoles('developer', 'accessibility_officer', 'customer_admin', 'auditor'),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const parsed = analyzeSchema.safeParse(req.body);
        if (!parsed.success) {
          sendProblem(res, 400, 'validation-error', 'Invalid analyze payload', undefined, {
            errors: parsed.error.flatten(),
          });
          return;
        }

        const orgId = req.user!.org_id;
        const { code, filetype, sessionId } = parsed.data;
        const result = analyzeCode(code, filetype);
        const fileHash = createHash('sha256').update(code).digest('hex');

        await db.insert(codeDiagnostics).values({
          organisationId: orgId,
          sessionId: sessionId ?? null,
          fileHash,
          filetype: result.filetype,
          violationsJson: result.violations,
        });

        const response: ApiResponse<typeof result & { fileHash: string }> = {
          data: { ...result, fileHash },
          timestamp: new Date().toISOString(),
        };
        res.json(response);
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    '/fix',
    requireRoles('developer', 'accessibility_officer', 'customer_admin'),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const parsed = fixSchema.safeParse(req.body);
        if (!parsed.success) {
          sendProblem(res, 400, 'validation-error', 'Invalid fix payload', undefined, {
            errors: parsed.error.flatten(),
          });
          return;
        }

        const orgId = req.user!.org_id;
        const [org] = await db
          .select({
            planTier: organisations.planTier,
            aiProvider: organisations.aiProvider,
            aiModel: organisations.aiModel,
          })
          .from(organisations)
          .where(eq(organisations.id, orgId))
          .limit(1);

        const result = await generateCodeFix(db, {
          orgId,
          planTier: org?.planTier ?? 'starter',
          aiProvider: org?.aiProvider ?? undefined,
          aiModel: org?.aiModel ?? undefined,
          code: parsed.data.code,
          ruleId: parsed.data.ruleId,
          filetype: parsed.data.filetype,
          wcagCriterion: parsed.data.wcagCriterion,
          context: parsed.data.context,
          violationId: parsed.data.violationId,
        });

        const response: ApiResponse<typeof result> = {
          data: result,
          timestamp: new Date().toISOString(),
        };
        res.json(response);
      } catch (err) {
        if (err instanceof Error && err.message.includes('not configured')) {
          sendProblem(res, 503, 'service-unavailable', 'AI service is temporarily unavailable');
          return;
        }
        next(err);
      }
    },
  );

  return router;
}
