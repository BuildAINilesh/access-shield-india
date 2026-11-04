/**
 * Execute a journey DSL with Playwright + per-step axe (AN-F003).
 */

import type { Database } from '@accessshield/db';
import {
  journeyCredentials,
  journeyScans,
  journeyStepResults,
  journeys,
} from '@accessshield/db';
import { and, eq, isNull } from 'drizzle-orm';
import { logger } from '../lib/logger';
import { decryptCredentials } from '../services/journey-crypto';
import {
  interpolateCreds,
  journeyDefinitionSchema,
  type JourneyDefinition,
  type JourneyStep,
} from '../services/journey-dsl';
import { runAxe } from './axe-runner';
import { createBrowser } from './playwright-runner';
import type { ComplianceStandard, ScanJobConfig, WcagLevel } from './types';

type Page = import('playwright').Page;

const DEFAULT_AXE_CONFIG: ScanJobConfig = {
  maxPages: 1,
  wcagLevel: 'AA' as WcagLevel,
  standards: ['WCAG22'] as ComplianceStandard[],
  excludePaths: [],
  viewports: [{ label: 'desktop', width: 1280, height: 800 }],
};

export interface StepResultSummary {
  stepId: string;
  stepIndex: number;
  action: string;
  status: 'passed' | 'failed' | 'skipped';
  pageUrl?: string;
  violationCount: number;
  criticalSerious: number;
  errorMessage?: string;
}

async function runStep(
  page: Page,
  step: JourneyStep,
  creds: Record<string, string>,
  assetId: string,
): Promise<{
  status: 'passed' | 'failed';
  pageUrl: string;
  violations: unknown[];
  errorMessage?: string;
}> {
  const pageUrl = page.url();

  try {
    switch (step.action) {
      case 'navigate': {
        const url = interpolateCreds(step.url, creds);
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
        await page.waitForTimeout(500);
        break;
      }
      case 'click':
        await page.click(step.selector, { timeout: 15_000 });
        await page.waitForTimeout(300);
        break;
      case 'fill': {
        const value = interpolateCreds(step.value, creds);
        await page.fill(step.selector, value, { timeout: 15_000 });
        break;
      }
      case 'press':
        await page.keyboard.press(step.key);
        break;
      case 'wait': {
        const timeout = step.timeoutMs ?? 15_000;
        if (step.selector) {
          await page.waitForSelector(step.selector, { timeout });
        } else if (step.urlIncludes) {
          await page.waitForURL((u) => u.href.includes(step.urlIncludes!), { timeout });
        } else {
          await page.waitForTimeout(Math.min(timeout, 3000));
        }
        break;
      }
      case 'axe': {
        const violations = await runAxe(page, DEFAULT_AXE_CONFIG, assetId, page.url());
        return {
          status: 'passed',
          pageUrl: page.url(),
          violations,
        };
      }
      default:
        break;
    }

    return { status: 'passed', pageUrl: page.url(), violations: [] };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      status: 'failed',
      pageUrl,
      violations: [],
      errorMessage: message.slice(0, 1000),
    };
  }
}

export async function executeJourneyScan(
  db: Database,
  journeyScanId: string,
  orgId: string,
): Promise<void> {
  const [scan] = await db
    .select()
    .from(journeyScans)
    .where(and(eq(journeyScans.id, journeyScanId), eq(journeyScans.organisationId, orgId)))
    .limit(1);

  if (!scan) {
    logger.warn({ journeyScanId, orgId }, 'Journey scan not found');
    return;
  }

  const [journey] = await db
    .select()
    .from(journeys)
    .where(
      and(
        eq(journeys.id, scan.journeyId),
        eq(journeys.organisationId, orgId),
        isNull(journeys.deletedAt),
      ),
    )
    .limit(1);

  if (!journey) {
    await db
      .update(journeyScans)
      .set({
        status: 'failed',
        errorMessage: 'Journey not found',
        completedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(journeyScans.id, journeyScanId));
    return;
  }

  const parsed = journeyDefinitionSchema.safeParse(journey.definitionJson);
  if (!parsed.success) {
    await db
      .update(journeyScans)
      .set({
        status: 'failed',
        errorMessage: 'Invalid journey definition',
        completedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(journeyScans.id, journeyScanId));
    return;
  }

  const definition: JourneyDefinition = parsed.data;
  let creds: Record<string, string> = {};
  const [credRow] = await db
    .select()
    .from(journeyCredentials)
    .where(
      and(
        eq(journeyCredentials.journeyId, journey.id),
        eq(journeyCredentials.organisationId, orgId),
      ),
    )
    .limit(1);

  if (credRow) {
    try {
      creds = decryptCredentials({
        ciphertext: credRow.ciphertext,
        iv: credRow.iv,
        authTag: credRow.authTag,
      });
    } catch (err) {
      logger.error({ err, journeyScanId }, 'Failed to decrypt journey credentials');
      await db
        .update(journeyScans)
        .set({
          status: 'failed',
          errorMessage: 'Credential decryption failed',
          completedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .where(eq(journeyScans.id, journeyScanId));
      return;
    }
  }

  await db
    .update(journeyScans)
    .set({
      status: 'running',
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .where(eq(journeyScans.id, journeyScanId));

  const browser = await createBrowser();
  const stepSummaries: StepResultSummary[] = [];
  let totalViolations = 0;

  try {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      ignoreHTTPSErrors: true,
    });
    const page = await context.newPage();
    await page.goto(definition.startUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(500);

    for (let i = 0; i < definition.steps.length; i++) {
      const step = definition.steps[i]!;
      const started = Date.now();
      const result = await runStep(page, step, creds, journey.id);
      const durationMs = Date.now() - started;

      const criticalSerious =
        step.action === 'axe'
          ? (result.violations as Array<{ severity?: string }>).filter(
              (v) => v.severity === 'critical' || v.severity === 'serious',
            ).length
          : 0;

      totalViolations += result.violations.length;

      const summary: StepResultSummary = {
        stepId: step.id,
        stepIndex: i,
        action: step.action,
        status: result.status,
        pageUrl: result.pageUrl,
        violationCount: result.violations.length,
        criticalSerious,
        errorMessage: result.errorMessage,
      };
      stepSummaries.push(summary);

      await db.insert(journeyStepResults).values({
        organisationId: orgId,
        journeyScanId,
        stepId: step.id,
        stepIndex: i,
        action: step.action,
        status: result.status,
        pageUrl: result.pageUrl,
        violationCount: result.violations.length,
        violationsJson: result.violations.slice(0, 50),
        errorMessage: result.errorMessage ?? null,
        durationMs,
      });

      if (result.status === 'failed') {
        // Stop journey on action failure (axe always "passed" even with findings)
        break;
      }
    }

    await context.close();

    const failureMap = {
      failedSteps: stepSummaries.filter((s) => s.status === 'failed'),
      axeHotspots: stepSummaries.filter((s) => s.action === 'axe' && s.criticalSerious > 0),
      steps: stepSummaries,
    };

    await db
      .update(journeyScans)
      .set({
        status: stepSummaries.some((s) => s.status === 'failed') ? 'failed' : 'completed',
        completedAt: new Date().toISOString(),
        totalViolations,
        failureMapJson: failureMap,
        updatedAt: new Date().toISOString(),
        errorMessage: stepSummaries.find((s) => s.status === 'failed')?.errorMessage ?? null,
      })
      .where(eq(journeyScans.id, journeyScanId));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error({ err, journeyScanId }, 'Journey scan crashed');
    await db
      .update(journeyScans)
      .set({
        status: 'failed',
        errorMessage: message.slice(0, 1000),
        completedAt: new Date().toISOString(),
        totalViolations,
        failureMapJson: { steps: stepSummaries, crash: message },
        updatedAt: new Date().toISOString(),
      })
      .where(eq(journeyScans.id, journeyScanId));
  } finally {
    await browser.close();
  }
}
