'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import { ButtonLink } from '@/components/marketing/ButtonLink';
import { LocaleLink } from '@/components/common/LocaleLink';
import { PricingBillingToggle } from '@/components/marketing/pricing/PricingBillingToggle';
import { PricingCurrencyToggle } from '@/components/marketing/pricing/PricingCurrencyToggle';
import { WidgetComplianceDisclaimer } from '@/components/marketing/pricing/WidgetComplianceDisclaimer';
import {
  PRICING_CATALOG,
  formatOneTimePrice,
  formatPlanPrice,
  taxNote,
  assessCheckoutSubline,
  type BillingPeriod,
  type PricingCurrency,
  type OneTimeSku,
} from '@/lib/pricing/catalog';
import { cn } from '@/lib/utils';
import * as Accordion from '@radix-ui/react-accordion';

const FAQ = [
  {
    question: 'Can I pay in INR or USD?',
    answer:
      'Yes. Use the currency toggle on this page for list prices. Indian customers typically pay in INR with GST invoices. International customers can be billed in USD. Final invoice currency is confirmed at checkout with sales.',
  },
  {
    question: 'Do you provide GST invoices?',
    answer:
      'Yes for INR payments. Every INR payment includes a GST-compliant invoice. USD invoices are issued without Indian GST; local tax may apply in your country.',
  },
  {
    question: 'What is your refund policy?',
    answer:
      'We offer a 14-day money-back guarantee on subscription plans. If you are not satisfied, email us within 14 days of purchase for a full refund. One-time remediation and completed audits are non-refundable after delivery.',
  },
  {
    question: 'Can I change plans later?',
    answer:
      'Yes. You can upgrade or downgrade at any time. Upgrades take effect immediately. Downgrades take effect at the next billing cycle. Prorated credits are applied to your account.',
  },
  {
    question: 'Is WCAG enough, or do I need the India pack?',
    answer:
      'WCAG 2.2 AA is the global baseline and is included on Professional and above. Add Regulatory Defense (or optional IS 17802 / GIGW / SEBI on audits) if you sell into Indian regulated or government markets.',
  },
  {
    question: 'Do you offer discounts for non-profits or education?',
    answer:
      'Yes. We offer 30% off Professional for registered non-profits and educational institutions. Contact sales with your registration documents.',
  },
];

function OneTimeCard({ service, currency }: { service: OneTimeSku; currency: PricingCurrency }) {
  return (
    <article
      className={cn(
        'relative flex h-full flex-col rounded-lg border bg-white p-6 shadow-sm',
        service.popular || service.highlighted ? 'border-2 border-primary-600' : 'border-gray-200',
      )}
    >
      {service.badge ? (
        <span className="absolute -top-3 left-4 inline-flex rounded-full bg-primary-600 px-3 py-0.5 text-xs font-semibold text-white">
          {service.badge}
        </span>
      ) : null}
      <h3 className="text-lg font-bold text-text-primary">{service.name}</h3>
      <p className="mt-1 text-sm text-text-secondary">{service.subtitle}</p>
      <p className="mt-4 text-3xl font-bold text-primary-600">
        {formatOneTimePrice(service, currency)}
      </p>
      {service.priceNote && (
        <p className="mt-2 text-sm font-medium text-text-secondary">{service.priceNote}</p>
      )}
      <ul className="mt-4 flex-1 space-y-2">
        {service.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm text-text-primary">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-success-700" aria-hidden="true" />
            {feature}
          </li>
        ))}
      </ul>
      <ButtonLink href={service.cta.href} variant="secondary" size="md" className="mt-6 w-full">
        {service.cta.text}
      </ButtonLink>
    </article>
  );
}

export function PricingPageContent() {
  const [currency, setCurrency] = useState<PricingCurrency>('INR');
  const [period, setPeriod] = useState<BillingPeriod>('monthly');
  const plans = PRICING_CATALOG.monthlyPlans;
  const assess = PRICING_CATALOG.standaloneAssessment;

  return (
    <>
      <header className="border-b border-gray-200 bg-gradient-to-b from-primary-50 via-white to-white px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary-600">Pricing</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-text-primary sm:text-5xl">
            Transparent pricing in INR or USD
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-text-secondary">
            WCAG 2.2 AA first for global teams. Optional India regulatory pack for SEBI, RPwD, GIGW
            &amp; IS 17802. {taxNote(currency)}.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <PricingCurrencyToggle currency={currency} onChange={setCurrency} />
            <PricingBillingToggle period={period} onChange={setPeriod} />
          </div>
          <p className="mt-4 text-sm text-text-tertiary" aria-live="polite">
            Showing {currency} {period === 'annual' ? 'annual' : 'monthly'} list prices
          </p>
        </div>
      </header>

      {/* Free + audit */}
      <section
        aria-labelledby="start-heading"
        className="border-b border-gray-200 bg-accent-50 px-4 py-16 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-5xl">
          <h2 id="start-heading" className="text-center text-3xl font-bold text-text-primary">
            Start with an audit
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-base text-text-secondary">
            Most teams begin with a free scan or a Compliance Website Audit, then choose monitoring.
          </p>
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
            <article className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
              <h3 className="text-xl font-bold text-text-primary">
                {PRICING_CATALOG.freeTier.name}
              </h3>
              <p className="mt-2 text-3xl font-bold text-primary-600">Free</p>
              <p className="mt-3 text-base text-text-secondary">
                {PRICING_CATALOG.freeTier.description}
              </p>
              <ButtonLink
                href={PRICING_CATALOG.freeTier.cta.href}
                size="lg"
                variant="primary"
                className="mt-8 w-full"
              >
                {PRICING_CATALOG.freeTier.cta.text}
              </ButtonLink>
            </article>
            <OneTimeCard service={assess} currency={currency} />
          </div>
        </div>
      </section>

      {/* Subscriptions */}
      <section
        aria-labelledby="plans-heading"
        className="border-b border-gray-200 bg-white px-4 py-16 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <h2 id="plans-heading" className="text-center text-3xl font-bold text-text-primary">
            Subscription plans
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-base text-text-secondary">
            Widget, scans, and monitoring. Regulatory Defense adds the India compliance pack.
          </p>
          <div className="mt-8 flex justify-center">
            <PricingBillingToggle period={period} onChange={setPeriod} />
          </div>

          <div className="mt-12 grid grid-cols-1 items-stretch gap-6 md:grid-cols-2 xl:grid-cols-4">
            {plans.map((plan) => (
              <article
                key={plan.id}
                className={cn(
                  'relative flex flex-col rounded-lg border bg-white p-6 shadow-sm',
                  plan.popular ? 'border-2 border-primary-600 shadow-lg' : 'border-gray-200',
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="inline-flex rounded-full bg-primary-600 px-4 py-1 text-sm font-semibold text-white">
                      Most popular
                    </span>
                  </div>
                )}
                <div className="mb-3 flex flex-wrap justify-center gap-2">
                  {plan.badge && (
                    <span
                      className={cn(
                        'inline-flex rounded-full px-3 py-0.5 text-xs font-semibold',
                        plan.noAuditRequired
                          ? 'bg-accent-100 text-accent-700'
                          : plan.indiaPack
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-primary-100 text-primary-700',
                      )}
                    >
                      {plan.badge}
                    </span>
                  )}
                  {plan.remediationRequired && (
                    <span className="inline-flex rounded-full bg-amber-100 px-3 py-0.5 text-xs font-semibold text-amber-900">
                      Remediation required
                    </span>
                  )}
                </div>
                <h3 className="text-center text-xl font-bold text-text-primary">{plan.name}</h3>
                <p className="mt-2 min-h-[3rem] text-center text-sm text-text-secondary">
                  {plan.description}
                </p>
                <p className="mt-4 text-center text-3xl font-bold text-primary-600">
                  {formatPlanPrice(plan, period, currency)}
                </p>
                {plan.checkoutNote === 'assess' && (
                  <p className="mt-3 text-center text-xs text-text-secondary">
                    {assessCheckoutSubline()}
                  </p>
                )}
                <ButtonLink
                  href={plan.cta.href}
                  size="lg"
                  variant={plan.popular ? 'primary' : 'secondary'}
                  className="mt-5 w-full"
                >
                  {plan.cta.text}
                </ButtonLink>
                <ul className="mt-6 flex-1 space-y-2.5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check
                        className="mt-0.5 h-4 w-4 shrink-0 text-success-700"
                        aria-hidden="true"
                      />
                      <span className="text-sm text-text-primary">{feature}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>

          <p className="mx-auto mt-10 max-w-2xl text-center text-sm text-text-secondary">
            {PRICING_CATALOG.enterprise.note}{' '}
            <LocaleLink
              href={PRICING_CATALOG.enterprise.cta.href}
              className="font-medium text-primary-600 underline hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
            >
              {PRICING_CATALOG.enterprise.cta.text}
            </LocaleLink>
          </p>
          <div className="mt-6">
            <WidgetComplianceDisclaimer />
          </div>
        </div>
      </section>

      {/* Remediation */}
      <section
        aria-labelledby="remediation-heading"
        className="border-b border-gray-200 bg-bg-secondary px-4 py-16 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-5xl">
          <h2 id="remediation-heading" className="text-center text-3xl font-bold text-text-primary">
            Remediation by site size
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-base text-text-secondary">
            Remove code-level barriers, then move to ongoing monitoring.
          </p>
          <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {PRICING_CATALOG.remediation.map((tier) => (
              <OneTimeCard key={tier.id} service={tier} currency={currency} />
            ))}
          </div>
        </div>
      </section>

      {/* Add-ons */}
      <section
        aria-labelledby="addons-heading"
        className="border-b border-gray-200 bg-white px-4 py-16 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-5xl">
          <h2 id="addons-heading" className="text-center text-3xl font-bold text-text-primary">
            Add-ons
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {PRICING_CATALOG.addons.map((addon) => (
              <OneTimeCard key={addon.id} service={addon} currency={currency} />
            ))}
          </div>
        </div>
      </section>

      {/* Tax / compliance note */}
      <section
        aria-labelledby="tax-heading"
        className="border-b border-gray-200 bg-primary-50 px-4 py-12 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-3xl text-center">
          <h2 id="tax-heading" className="text-xl font-bold text-text-primary">
            Invoicing &amp; compliance standards
          </h2>
          <p className="mt-3 text-base text-text-secondary">
            {PRICING_CATALOG.indiaCompliance.gstNote}
          </p>
          <ul className="mt-6 flex flex-wrap justify-center gap-3">
            {PRICING_CATALOG.indiaCompliance.links.map((link) => (
              <li key={link.href}>
                <LocaleLink
                  href={link.href}
                  className="inline-flex min-h-11 items-center rounded-md border border-primary-200 bg-white px-4 text-sm font-medium text-primary-700 hover:bg-primary-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
                >
                  {link.label}
                </LocaleLink>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section aria-labelledby="faq-heading" className="bg-white px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h2 id="faq-heading" className="text-center text-3xl font-bold text-text-primary">
            Frequently asked questions
          </h2>
          <Accordion.Root type="single" collapsible className="mt-10 space-y-3">
            {FAQ.map((item, index) => (
              <Accordion.Item
                key={item.question}
                value={`faq-${index}`}
                className="rounded-lg border border-gray-200 bg-bg-secondary"
              >
                <Accordion.Header>
                  <Accordion.Trigger className="flex min-h-11 w-full items-center justify-between gap-4 px-5 py-4 text-left text-base font-semibold text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2">
                    {item.question}
                    <span className="text-primary-600" aria-hidden="true">
                      +
                    </span>
                  </Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Content className="px-5 pb-4 text-base text-text-secondary">
                  {item.answer}
                </Accordion.Content>
              </Accordion.Item>
            ))}
          </Accordion.Root>
        </div>
      </section>
    </>
  );
}
