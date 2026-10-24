/** Stable feature IDs and slugs for /features hub + detail pages (PRD AN-F001–F012). */

export const FEATURE_SLUGS = [
  'code',
  'open-source',
  'fix',
  'priority-score',
  'integrations',
  'dynamic',
  'intelligence',
  'learn',
  'policy',
  'posture',
  'analytics',
  'red',
] as const;

export type FeatureSlug = (typeof FEATURE_SLUGS)[number];

export type FeaturePhase = 1 | 2 | 3;

/** Product readiness shown on marketing pages (not engineering backlog status). */
export type FeatureStatus = 'available' | 'in_progress' | 'coming_soon';

export interface FeatureMeta {
  id: string;
  slug: FeatureSlug;
  phase: FeaturePhase;
  status: FeatureStatus;
}

/**
 * Phase 1 products first in hub default order; status reflects what exists in product today.
 * Fix / Integrations are in progress (portal AI fix + Jira already ship).
 */
export const FEATURE_CATALOG: readonly FeatureMeta[] = [
  { id: 'AN-F001', slug: 'code', phase: 1, status: 'in_progress' },
  { id: 'AN-F002', slug: 'open-source', phase: 1, status: 'available' },
  { id: 'AN-F005', slug: 'fix', phase: 1, status: 'available' },
  { id: 'AN-F007', slug: 'priority-score', phase: 1, status: 'available' },
  { id: 'AN-F010', slug: 'integrations', phase: 1, status: 'available' },
  { id: 'AN-F003', slug: 'dynamic', phase: 2, status: 'coming_soon' },
  { id: 'AN-F004', slug: 'intelligence', phase: 2, status: 'coming_soon' },
  { id: 'AN-F006', slug: 'learn', phase: 2, status: 'coming_soon' },
  { id: 'AN-F008', slug: 'policy', phase: 3, status: 'coming_soon' },
  { id: 'AN-F009', slug: 'posture', phase: 3, status: 'coming_soon' },
  { id: 'AN-F011', slug: 'analytics', phase: 3, status: 'coming_soon' },
  { id: 'AN-F012', slug: 'red', phase: 3, status: 'coming_soon' },
] as const;

export function isFeatureSlug(value: string): value is FeatureSlug {
  return (FEATURE_SLUGS as readonly string[]).includes(value);
}

export function getFeatureMeta(slug: FeatureSlug): FeatureMeta {
  const meta = FEATURE_CATALOG.find((item) => item.slug === slug);
  if (!meta) {
    throw new Error(`Unknown feature slug: ${slug}`);
  }
  return meta;
}
