'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import { ButtonLink } from '@/components/marketing/ButtonLink';
import {
  DOCUMENT_OFFER,
  WEBSITE_OFFERS,
  formatMoney,
  formatOfferPrice,
  type DisplayCurrency,
  type PublicOffer,
} from '@/lib/pricing/catalog';
import { useDictionary } from '@/lib/i18n/locale-context';
import { cn } from '@/lib/utils';

function OfferCard({
  offer,
  currency,
}: {
  offer: PublicOffer;
  currency: DisplayCurrency;
}) {
  return (
    <li
      className={cn(
        'relative flex flex-col rounded-xl border bg-[#12121a] p-6',
        offer.highlighted
          ? 'border-primary-400 shadow-[0_0_40px_rgba(124,58,237,0.18)]'
          : 'border-white/10',
      )}
    >
      {offer.badge ? (
        <p className="absolute -top-3 left-6 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#07070c]">
          {offer.badge}
        </p>
      ) : null}
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
        {offer.subtitle}
      </p>
      <h3 className="mt-3 text-xl font-semibold text-white">{offer.name}</h3>
      <p className="mt-4 text-3xl font-semibold tabular-nums text-white">
        {formatOfferPrice(offer, currency)}
      </p>
      <p className="mt-1 text-sm text-zinc-400">{offer.priceNote}</p>
      {offer.overageInr != null ? (
        <p className="mt-1 text-sm text-zinc-400">
          Extra scans: {formatMoney(offer.overageInr, currency)} each
        </p>
      ) : null}
      <ul className="mt-6 flex-1 space-y-3">
        {offer.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5 text-sm leading-normal text-zinc-300">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <ButtonLink
        href={offer.cta.href}
        size="md"
        variant={offer.highlighted ? 'primary' : 'secondary'}
        className="mt-8 w-full"
      >
        {offer.cta.text}
      </ButtonLink>
    </li>
  );
}

export function PricingOfferings() {
  const { pricing } = useDictionary();
  const [currency, setCurrency] = useState<DisplayCurrency>('INR');

  return (
    <div>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
            {pricing.packages.stepLabel}
          </p>
          <h2 id="packages-heading" className="mt-3 text-3xl font-semibold text-white">
            {pricing.packages.title}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-zinc-400">{pricing.packages.subtitle}</p>
        </div>
        <div
          className="inline-flex rounded-lg border border-white/15 p-1"
          role="group"
          aria-label={pricing.packages.currencyLabel}
        >
          {(['INR', 'USD'] as const).map((code) => (
            <button
              key={code}
              type="button"
              aria-pressed={currency === code}
              onClick={() => setCurrency(code)}
              className={cn(
                'min-h-11 min-w-[4.5rem] rounded-md px-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#07070c]',
                currency === code
                  ? 'bg-white text-[#07070c]'
                  : 'text-zinc-300 hover:bg-white/5 hover:text-white',
              )}
            >
              {code === 'INR' ? pricing.packages.inr : pricing.packages.usd}
            </button>
          ))}
        </div>
      </div>

      <ul className="mt-12 grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
        {WEBSITE_OFFERS.map((offer) => (
          <OfferCard key={offer.id} offer={offer} currency={currency} />
        ))}
      </ul>

      <div className="mt-20">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
          {pricing.packages.documentsStepLabel}
        </p>
        <h2 id="documents-heading" className="mt-3 text-3xl font-semibold text-white">
          {pricing.packages.documentsTitle}
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-400">
          {pricing.packages.documentsSubtitle}
        </p>
        <ul className="mt-10 grid gap-6 lg:max-w-md">
          <OfferCard offer={DOCUMENT_OFFER} currency={currency} />
        </ul>
      </div>
    </div>
  );
}
