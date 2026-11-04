'use client';

import { cn } from '@/lib/utils';
import type { BillingPeriod } from '@/lib/pricing/catalog';

interface PricingBillingToggleProps {
  period: BillingPeriod;
  onChange: (period: BillingPeriod) => void;
  monthlyLabel?: string;
  annualLabel?: string;
  saveLabel?: string;
}

export function PricingBillingToggle({
  period,
  onChange,
  monthlyLabel = 'Monthly',
  annualLabel = 'Annual',
  saveLabel = 'Save ~17%',
}: PricingBillingToggleProps) {
  const isAnnual = period === 'annual';

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <span
        className={cn(
          'text-base font-medium',
          !isAnnual ? 'text-text-primary' : 'text-text-tertiary',
        )}
      >
        {monthlyLabel}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={isAnnual}
        aria-label={`Billing period: ${isAnnual ? annualLabel : monthlyLabel}`}
        onClick={() => onChange(isAnnual ? 'monthly' : 'annual')}
        className={cn(
          'relative h-8 w-14 rounded-full transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2',
          isAnnual ? 'bg-primary-600' : 'bg-gray-300',
        )}
      >
        <span
          className={cn(
            'absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow transition-transform',
            isAnnual && 'translate-x-6',
          )}
          aria-hidden="true"
        />
      </button>
      <span
        className={cn(
          'text-base font-medium',
          isAnnual ? 'text-text-primary' : 'text-text-tertiary',
        )}
      >
        {annualLabel}
      </span>
      {isAnnual && (
        <span className="rounded-full bg-success-100 px-2.5 py-0.5 text-xs font-semibold text-success-700">
          {saveLabel}
        </span>
      )}
    </div>
  );
}
