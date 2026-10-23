/**
 * AN Fix API — generate / history / apply stubs (AN-F005).
 */

import type { Database } from '@accessshield/db';
import { fixApplications, fixSuggestions, organisations } from '@accessshield/db';
import { and, desc, eq } from 'drizzle-orm';
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
  repoFullName: z.string().min(3).max(255).optional(),
  prNumber: z.number().int().positive().optional(),
  filePath: z.string().max(500).optional(),
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
        const [fix] = await db
          .select()
          .from(fixSuggestions)
          .where(
            and(eq(fixSuggestions.id, parsed.data.fixId), eq(fixSuggestions.organisationId, orgId)),
          )
          .limit(1);

        if (!fix) {
          sendProblem(res, 404, 'not-found', 'Fix suggestion not found');
          return;
        }

        // GitHub Contents API apply lands with PR Gate (AN-F010). Record intent for audit.
        const [application] = await db
          .insert(fixApplications)
          .values({
            organisationId: orgId,
            fixId: fix.id,
            repo: parsed.data.repoFullName ?? null,
            prNumber: parsed.data.prNumber ?? null,
            filePath: parsed.data.filePath ?? null,
            commitSha: null,
          })
          .returning({ id: fixApplications.id });

        sendProblem(
          res,
          501,
          'not-implemented',
          'PR Apply fix via GitHub API is not enabled yet. Fix was recorded; copy fixedCode from /fixes/generate meanwhile.',
          undefined,
          { applicationId: application?.id, fixId: fix.id },
        );
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}
