/**
 * AN Priority Score — risk-based violation ranking (AN-F007).
 *
 * Score = (userImpact × 0.4) + (regulatoryWeight × 0.3) + (atCoverage × 0.2) + (inverseFixComplexity × 0.1)
 * Each dimension is normalized to 0–100 before weighting.
 */

export interface PriorityWeights {
  userImpact: number;
  regulatoryWeight: number;
  atCoverage: number;
  inverseFixComplexity: number;
}

export const DEFAULT_PRIORITY_WEIGHTS: PriorityWeights = {
  userImpact: 0.4,
  regulatoryWeight: 0.3,
  atCoverage: 0.2,
  inverseFixComplexity: 0.1,
};

export interface ScoreableViolation {
  id: string;
  ruleId: string;
  impact: 'critical' | 'serious' | 'moderate' | 'minor' | string;
  standard?: string | null;
  description?: string | null;
  pageUrl?: string | null;
}

export interface PrioritizedViolation extends ScoreableViolation {
  priorityScore: number;
  estimatedFixHours: number;
  scoreBreakdown: {
    userImpact: number;
    regulatoryWeight: number;
    atCoverage: number;
    inverseFixComplexity: number;
  };
  scoreExplanation: string;
}

/** Impact → how often users hit this class of issue (proxy without analytics). */
function userImpactScore(impact: string): number {
  switch (impact) {
    case 'critical':
      return 95;
    case 'serious':
      return 75;
    case 'moderate':
      return 45;
    case 'minor':
      return 20;
    default:
      return 30;
  }
}

/** Regulatory weight — India packs score higher when present. */
function regulatoryScore(standard: string | null | undefined, ruleId: string): number {
  const std = (standard ?? 'WCAG22').toUpperCase();
  if (std === 'SEBI' || ruleId.startsWith('SEBI-')) return 100;
  if (std === 'IS17802' || ruleId.startsWith('IS-')) return 90;
  if (std === 'GIGW3' || ruleId.startsWith('GIGW-')) return 85;
  if (impactIsBlocking(ruleId)) return 70;
  return 40;
}

function impactIsBlocking(ruleId: string): boolean {
  return /image-alt|button-name|link-name|label|html-has-lang|color-contrast|keyboard/i.test(
    ruleId,
  );
}

/** How many AT/browser combos typically fail (heuristic matrix). */
function atCoverageScore(ruleId: string, impact: string): number {
  if (/image-alt|button-name|link-name|label|name/i.test(ruleId)) return 90;
  if (/color-contrast|focus|keyboard|tabindex/i.test(ruleId)) return 80;
  if (impact === 'critical') return 85;
  if (impact === 'serious') return 65;
  return 40;
}

/** Inverse fix complexity — easier fixes rank higher so teams ship wins. */
function inverseFixComplexityScore(ruleId: string): { score: number; hours: number } {
  if (/image-alt|html-has-lang|autofocus|link-name|button-name/i.test(ruleId)) {
    return { score: 90, hours: 0.5 };
  }
  if (/label|aria-|role|lang/i.test(ruleId)) {
    return { score: 70, hours: 1.5 };
  }
  if (/color-contrast|focus-order|keyboard/i.test(ruleId)) {
    return { score: 45, hours: 3 };
  }
  return { score: 30, hours: 5 };
}

function clampWeights(weights: Partial<PriorityWeights> | null | undefined): PriorityWeights {
  const w = { ...DEFAULT_PRIORITY_WEIGHTS, ...weights };
  const sum = w.userImpact + w.regulatoryWeight + w.atCoverage + w.inverseFixComplexity;
  if (sum <= 0) return DEFAULT_PRIORITY_WEIGHTS;
  return {
    userImpact: w.userImpact / sum,
    regulatoryWeight: w.regulatoryWeight / sum,
    atCoverage: w.atCoverage / sum,
    inverseFixComplexity: w.inverseFixComplexity / sum,
  };
}

export function scoreViolation(
  violation: ScoreableViolation,
  weights?: Partial<PriorityWeights> | null,
): PrioritizedViolation {
  const w = clampWeights(weights);
  const userImpact = userImpactScore(violation.impact);
  const regulatoryWeight = regulatoryScore(violation.standard, violation.ruleId);
  const atCoverage = atCoverageScore(violation.ruleId, violation.impact);
  const { score: inverseFixComplexity, hours } = inverseFixComplexityScore(violation.ruleId);

  // Keep 0–100 scale for display
  const displayScore = Math.min(
    100,
    Math.round(
      userImpact * w.userImpact +
        regulatoryWeight * w.regulatoryWeight +
        atCoverage * w.atCoverage +
        inverseFixComplexity * w.inverseFixComplexity,
    ),
  );

  const std = violation.standard ?? 'WCAG22';
  const scoreExplanation = `Score: ${displayScore} — impact ${violation.impact}, standard ${std}, rule ${violation.ruleId} (~${hours}h)`;

  return {
    ...violation,
    priorityScore: displayScore,
    estimatedFixHours: hours,
    scoreBreakdown: {
      userImpact,
      regulatoryWeight,
      atCoverage,
      inverseFixComplexity,
    },
    scoreExplanation,
  };
}

export function prioritizeViolations(
  violations: ScoreableViolation[],
  weights?: Partial<PriorityWeights> | null,
  sprintHours?: number,
): {
  violations: PrioritizedViolation[];
  sprintRecommendation: PrioritizedViolation[];
  totalHours: number;
} {
  const ranked = violations
    .map((v) => scoreViolation(v, weights))
    .sort((a, b) => b.priorityScore - a.priorityScore);

  const budget = sprintHours != null && sprintHours > 0 ? sprintHours : null;
  const sprintRecommendation: PrioritizedViolation[] = [];
  let totalHours = 0;

  if (budget != null) {
    for (const item of ranked) {
      if (totalHours + item.estimatedFixHours <= budget) {
        sprintRecommendation.push(item);
        totalHours += item.estimatedFixHours;
      }
    }
  } else {
    totalHours = ranked.reduce((sum, v) => sum + v.estimatedFixHours, 0);
  }

  return { violations: ranked, sprintRecommendation, totalHours };
}
