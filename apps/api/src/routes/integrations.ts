/**
 * Third-party integrations API — Jira stub + GitHub App (AN-F010 / AN-F005).
 */

import type { Database } from '@accessshield/db';
import { githubInstallations } from '@accessshield/db';
import type { ApiResponse } from '@accessshield/types';
import { and, eq, isNull } from 'drizzle-orm';
import type { NextFunction, Request, Response, Router as ExpressRouter } from 'express';
import { Router } from 'express';
import { z } from 'zod';
import { sendProblem } from '../lib/problem-details';
import { requireRoles } from '../middleware/rbac';
import {
  buildGitHubInstallUrl,
  getGitHubAppConfig,
  getOrgInstallation,
  signInstallState,
  verifyInstallState,
} from '../services/github-apply';

const githubCallbackSchema = z.object({
  installationId: z.coerce.number().int().positive(),
  accountLogin: z.string().min(1).max(255),
  accountType: z.enum(['User', 'Organization']).default('Organization'),
  state: z.string().min(8).max(2000),
});

export function createIntegrationsRouter(db: Database): ExpressRouter {
  const router = Router();

  // ─── Jira (stub — persistence lands separately) ────────────────────────────

  router.get(
    '/jira',
    requireRoles('customer_admin', 'accessibility_officer'),
    async (_req: Request, res: Response, _next: NextFunction): Promise<void> => {
      sendProblem(res, 404, 'not-found', 'Jira integration not connected');
    },
  );

  router.delete(
    '/jira',
    requireRoles('customer_admin'),
    async (_req: Request, res: Response, _next: NextFunction): Promise<void> => {
      sendProblem(res, 404, 'not-found', 'Jira integration not connected');
    },
  );

  router.post(
    '/jira/sync',
    requireRoles('customer_admin', 'accessibility_officer'),
    async (_req: Request, res: Response, _next: NextFunction): Promise<void> => {
      sendProblem(res, 404, 'not-found', 'Jira integration not connected');
    },
  );

  // ─── GitHub App ────────────────────────────────────────────────────────────

  router.get(
    '/github',
    requireRoles('customer_admin', 'accessibility_officer', 'developer'),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const orgId = req.user!.org_id;
        const row = await getOrgInstallation(db, orgId);
        const configured = Boolean(getGitHubAppConfig());
        const response: ApiResponse<{
          connected: boolean;
          configured: boolean;
          installation: {
            installationId: number;
            accountLogin: string;
            accountType: string;
            connectedAt: string;
          } | null;
        }> = {
          data: {
            connected: Boolean(row),
            configured,
            installation: row
              ? {
                  installationId: row.installationId,
                  accountLogin: row.accountLogin,
                  accountType: row.accountType,
                  connectedAt: row.createdAt,
                }
              : null,
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
    '/github/install',
    requireRoles('customer_admin'),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const config = getGitHubAppConfig();
        if (!config) {
          sendProblem(
            res,
            503,
            'github-not-configured',
            'GitHub App env vars are not set (GITHUB_APP_ID, GITHUB_APP_PRIVATE_KEY, GITHUB_APP_SLUG)',
          );
          return;
        }
        const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
        if (!secret) {
          sendProblem(res, 503, 'misconfigured', 'AUTH_SECRET is required to sign install state');
          return;
        }
        const state = signInstallState(req.user!.org_id, secret);
        const url = buildGitHubInstallUrl(config, state);
        const response: ApiResponse<{ url: string }> = {
          data: { url },
          timestamp: new Date().toISOString(),
        };
        res.json(response);
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    '/github/callback',
    requireRoles('customer_admin'),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const parsed = githubCallbackSchema.safeParse(req.body);
        if (!parsed.success) {
          sendProblem(res, 400, 'validation-error', 'Invalid GitHub callback payload', undefined, {
            errors: parsed.error.flatten().fieldErrors,
          });
          return;
        }

        const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
        if (!secret) {
          sendProblem(res, 503, 'misconfigured', 'AUTH_SECRET is required');
          return;
        }

        const verified = verifyInstallState(parsed.data.state, secret);
        if (!verified || verified.orgId !== req.user!.org_id) {
          sendProblem(res, 400, 'invalid-state', 'Install state is invalid or expired');
          return;
        }

        const existing = await db
          .select()
          .from(githubInstallations)
          .where(eq(githubInstallations.organisationId, verified.orgId))
          .limit(1);

        if (existing[0]) {
          await db
            .update(githubInstallations)
            .set({
              installationId: parsed.data.installationId,
              accountLogin: parsed.data.accountLogin,
              accountType: parsed.data.accountType,
              deletedAt: null,
              updatedAt: new Date().toISOString(),
            })
            .where(eq(githubInstallations.id, existing[0].id));
        } else {
          await db.insert(githubInstallations).values({
            organisationId: verified.orgId,
            installationId: parsed.data.installationId,
            accountLogin: parsed.data.accountLogin,
            accountType: parsed.data.accountType,
          });
        }

        const row = await getOrgInstallation(db, verified.orgId);
        const response: ApiResponse<{
          installationId: number;
          accountLogin: string;
          accountType: string;
        }> = {
          data: {
            installationId: row!.installationId,
            accountLogin: row!.accountLogin,
            accountType: row!.accountType,
          },
          timestamp: new Date().toISOString(),
        };
        res.status(201).json(response);
      } catch (err) {
        next(err);
      }
    },
  );

  router.delete(
    '/github',
    requireRoles('customer_admin'),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const orgId = req.user!.org_id;
        await db
          .update(githubInstallations)
          .set({ deletedAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
          .where(
            and(eq(githubInstallations.organisationId, orgId), isNull(githubInstallations.deletedAt)),
          );
        res.status(204).send();
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}
