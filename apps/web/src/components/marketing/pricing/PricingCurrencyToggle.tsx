'use client';

import { cn } from '@/lib/utils';
import type { PricingCurrency } from '@/lib/pricing/catalog';

interface PricingCurrencyToggleProps {
  currency: PricingCurrency;
  onChange: (currency: PricingCurrency) => void;
}

/**
 * INR / USD switch for marketing pricing. List prices are fixed per currency
 * (not live FX) so quotes stay stable for sales.
 */
export function PricingCurrencyToggle({ currency, onChange }: PricingCurrencyToggleProps) {
  return (
    <div
      className="inline-flex rounded-lg border border-border bg-bg-secondary p-1"
      role="group"
      aria-label="Currency"
    >
      {(['INR', 'USD'] as const).map((code) => {
        const selected = currency === code;
        return (
          <button
            key={code}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(code)}
            className={cn(
              'min-h-11 min-w-[4.5rem] rounded-md px-4 text-sm font-semibold transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2',
              selected
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-text-secondary hover:bg-white hover:text-text-primary',
            )}
          >
            {code === 'INR' ? '₹ INR' : '$ USD'}
          </button>
        );
      })}
    </div>
  );
}
