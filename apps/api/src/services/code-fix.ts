import { createHash } from 'crypto';
import type { Database } from '@accessshield/db';
import { fixSuggestions } from '@accessshield/db';
import { requestAiFix } from '../lib/ai-client';
import { logger } from '../lib/logger';
import { applyTemplateFix, findBuiltinTemplate, type FixConfidence } from './fix-templates';

export interface GenerateCodeFixInput {
  orgId: string;
  planTier?: string;
  aiProvider?: string;
  aiModel?: string;
  code: string;
  ruleId: string;
  filetype?: string;
  wcagCriterion?: string;
  context?: string;
  violationId?: string;
}

export interface GenerateCodeFixResult {
  fixId: string | null;
  fixedCode: string;
  explanation: string;
  confidence: FixConfidence;
  source: 'template' | 'ai';
  diffHint: string;
}

function hashCode(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

/**
 * Generate an accessible fix for a code snippet — template first, Claude fallback.
 */
export async function generateCodeFix(
  db: Database,
  input: GenerateCodeFixInput,
): Promise<GenerateCodeFixResult> {
  const template = findBuiltinTemplate(input.ruleId);
  const templated = applyTemplateFix(input.ruleId, input.code);

  if (template && templated && templated !== input.code) {
    const codeHash = hashCode(`${input.ruleId}:${input.code}`);
    const [row] = await db
      .insert(fixSuggestions)
      .values({
        organisationId: input.orgId,
        violationId: input.violationId ?? null,
        ruleId: input.ruleId,
        codeHash,
        fixCode: templated,
        diff: `template:${input.ruleId}`,
        explanation: template.explanation,
        confidence: template.confidence,
        modelVersion: 'template-v1',
      })
      .returning({ id: fixSuggestions.id });

    return {
      fixId: row?.id ?? null,
      fixedCode: templated,
      explanation: template.explanation,
      confidence: template.confidence,
      source: 'template',
      diffHint: template.fixTemplate,
    };
  }

  try {
    const ai = await requestAiFix(
      {
        rule_id: input.ruleId,
        element_html: input.code.slice(0, 4000),
        wcag_criterion: input.wcagCriterion ?? '2.1',
        standard: 'WCAG22',
        page_context: (input.context ?? input.filetype ?? 'ide-snippet').slice(0, 500),
        violation_id: input.violationId ?? '00000000-0000-4000-8000-000000000000',
      },
      input.orgId,
      input.planTier ?? 'professional',
      input.aiProvider,
      input.aiModel,
    );

    const fixedCode = ai.fix_html || input.code;
    const explanation =
      ai.explanation ||
      template?.explanation ||
      'AI-generated accessibility fix. Review before applying.';
    const codeHash = hashCode(`${input.ruleId}:${input.code}`);

    const [row] = await db
      .insert(fixSuggestions)
      .values({
        organisationId: input.orgId,
        violationId: input.violationId ?? null,
        ruleId: input.ruleId,
        codeHash,
        fixCode: fixedCode,
        diff: ai.before_after ? JSON.stringify(ai.before_after) : null,
        explanation,
        confidence: 'medium',
        modelVersion: 'ai-service',
      })
      .returning({ id: fixSuggestions.id });

    return {
      fixId: row?.id ?? null,
      fixedCode,
      explanation,
      confidence: 'medium',
      source: 'ai',
      diffHint: template?.fixTemplate ?? 'Review AI-suggested markup carefully.',
    };
  } catch (err) {
    logger.warn({ err, ruleId: input.ruleId }, 'AI fix failed; returning template guidance');

    if (template) {
      return {
        fixId: null,
        fixedCode: templated ?? input.code,
        explanation: template.explanation,
        confidence: template.confidence,
        source: 'template',
        diffHint: template.fixTemplate,
      };
    }

    throw err;
  }
}
