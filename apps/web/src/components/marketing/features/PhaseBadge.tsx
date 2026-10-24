import { cn } from '@/lib/utils';
import type { FeaturePhase, FeatureStatus } from '@/lib/features/catalog';

interface PhaseBadgeProps {
  phase: FeaturePhase;
  phaseLabel: string;
  className?: string;
}

export function PhaseBadge({ phase, phaseLabel, className }: PhaseBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        phase === 1 && 'bg-primary-100 text-primary-700',
        phase === 2 && 'bg-accent-100 text-accent-700',
        phase === 3 && 'bg-bg-tertiary text-text-secondary',
        className,
      )}
    >
      {phaseLabel}
    </span>
  );
}

interface StatusBadgeProps {
  status: FeatureStatus;
  label: string;
  className?: string;
}

/** Status uses text + colour (WCAG 1.4.1 — never colour alone). */
export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        status === 'available' && 'border-success-700/30 bg-success-100 text-success-700',
        status === 'in_progress' && 'border-accent-700/30 bg-accent-100 text-accent-700',
        status === 'coming_soon' && 'border-border bg-bg-tertiary text-text-secondary',
        className,
      )}
    >
      {label}
    </span>
  );
}
