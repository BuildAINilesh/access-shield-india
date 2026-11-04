/**
 * AN Fix API — generate / history / apply via GitHub App (AN-F005).
 */

import type { Database } from '@accessshield/db';
import { fixSuggestions, organisations } from '@accessshield/db';
import { desc, eq } from 'drizzle-orm';
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
import { generateCodeFix } from '../services/code-fix';
import { applyFixToGitHub } from '../services/github-apply';

const generateSchema = z.object({
  code: z.string().min(1).max(50_000),
  ruleId: z.string().min(1).max(100),
  violationId: z.string().uuid().optional(),
  filePath: z.string().max(500).optional(),
  codeContext: z.string().max(2000).optional(),
  wcagCriterion: z.string().max(32).optional(),
});

const applySchema = z.object({
  fixId: z.string().uuid(),
  repoFullName: z.string().min(3).max(255),
  filePath: z.string().min(1).max(500),
  branch: z.string().min(1).max(255).optional(),
  prNumber: z.number().int().positive().optional(),
  /** Reviewed markup from the portal — preferred over re-running generate */
  content: z.string().min(1).max(50_000).optional(),
});

export function createFixesRouter(db: Database): ExpressRouter {
  const router = Router();

  router.post(
    '/generate',
    requireRoles('developer', 'accessibility_officer', 'customer_admin'),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const parsed = generateSchema.safeParse(req.body);
        if (!parsed.success) {
          sendProblem(res, 400, 'validation-error', 'Invalid generate payload', undefined, {
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
          context: parsed.data.codeContext ?? parsed.data.filePath,
          wcagCriterion: parsed.data.wcagCriterion,
          violationId: parsed.data.violationId,
        });

        const response: ApiResponse<{
          fixCode: string;
          diff: string;
          explanation: string;
          confidence: string;
          fixId: string | null;
          source: string;
        }> = {
          data: {
            fixCode: result.fixedCode,
            diff: result.diffHint,
            explanation: result.explanation,
            confidence: result.confidence,
            fixId: result.fixId,
            source: result.source,
          },
          timestamp: new Date().toISOString(),
        };
        res.json(response);
      } catch (err) {
        next(err);
      }
    },
  );

  router.get(
    '/history',
    requireRoles('developer', 'accessibility_officer', 'customer_admin', 'auditor'),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const orgId = req.user!.org_id;
        const rows = await db
          .select({
            id: fixSuggestions.id,
            ruleId: fixSuggestions.ruleId,
            confidence: fixSuggestions.confidence,
            explanation: fixSuggestions.explanation,
            createdAt: fixSuggestions.createdAt,
            modelVersion: fixSuggestions.modelVersion,
          })
          .from(fixSuggestions)
          .where(eq(fixSuggestions.organisationId, orgId))
          .orderBy(desc(fixSuggestions.createdAt))
          .limit(50);

        const response: ApiResponse<{ fixes: typeof rows; acceptanceRate: number | null }> = {
          data: { fixes: rows, acceptanceRate: null },
          timestamp: new Date().toISOString(),
        };
        res.json(response);
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    '/apply',
    requireRoles('developer', 'accessibility_officer', 'customer_admin'),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const parsed = applySchema.safeParse(req.body);
        if (!parsed.success) {
          sendProblem(res, 400, 'validation-error', 'Invalid apply payload', undefined, {
            errors: parsed.error.flatten(),
          });
          return;
        }

        const orgId = req.user!.org_id;
        const userId = req.user!.sub;

        try {
          const result = await applyFixToGitHub(db, {
            orgId,
            userId,
            fixId: parsed.data.fixId,
            repoFullName: parsed.data.repoFullName,
            filePath: parsed.data.filePath,
            branch: parsed.data.branch,
            prNumber: parsed.data.prNumber,
            contentOverride: parsed.data.content,
          });

          const response: ApiResponse<typeof result> = {
            data: result,
            timestamp: new Date().toISOString(),
          };
          res.json(response);
        } catch (err) {
          const status =
            typeof err === 'object' && err && 'status' in err
              ? Number((err as { status: number }).status)
              : 500;
          const code =
            typeof err === 'object' && err && 'code' in err
              ? String((err as { code: string }).code)
              : 'internal-error';
          const message = err instanceof Error ? err.message : 'Failed to apply fix';
          if (status >= 400 && status < 600) {
            sendProblem(res, status, code, message);
            return;
          }
          throw err;
        }
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}
