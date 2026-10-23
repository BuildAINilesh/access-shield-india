import { Check } from 'lucide-react';
import { LocaleLink } from '@/components/common/LocaleLink';
import { ButtonLink } from '@/components/marketing/ButtonLink';
import { PhaseBadge, StatusBadge } from '@/components/marketing/features/PhaseBadge';
import type { FeatureMeta } from '@/lib/features/catalog';
import type { FeatureItemCopy, FeaturesDict } from '@/lib/i18n/dictionaries/types';

interface FeatureDetailProps {
  meta: FeatureMeta;
  item: FeatureItemCopy;
  dict: FeaturesDict;
}

export function FeatureDetail({ meta, item, dict }: FeatureDetailProps) {
  const phaseLabel = dict.phases[meta.phase];
  const statusLabel = dict.status[meta.status];
  const primaryCta =
    meta.status === 'available'
      ? { href: '/scan', label: dict.cta.freeScan }
      : meta.status === 'in_progress'
        ? { href: `/contact?feature=${meta.slug}`, label: dict.cta.contact }
        : { href: `/waitlist?feature=${meta.slug}`, label: dict.cta.waitlist };

  return (
    <>
      <header className="border-b border-gray-200 bg-gradient-to-b from-primary-50 via-white to-white px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <LocaleLink
            href="/features"
            className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-600 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
          >
            ← {dict.detail.backToHub}
          </LocaleLink>

          <div className="mt-6 flex flex-wrap gap-2">
            <PhaseBadge phase={meta.phase} phaseLabel={phaseLabel} />
            <StatusBadge status={meta.status} label={statusLabel} />
          </div>

          <h1 className="mt-4 text-4xl font-bold tracking-tight text-text-primary sm:text-5xl">
            {item.name}
          </h1>
          <p className="mt-3 text-xl font-medium text-text-secondary">{item.tagline}</p>
          <p className="mt-6 text-lg leading-relaxed text-text-secondary">{item.summary}</p>
          <p className="mt-4 text-sm text-text-tertiary">
            <span className="font-medium text-text-secondary">{dict.detail.snykLabel}:</span>{' '}
            {item.snykParallel}
            <span className="mx-2" aria-hidden="true">
              ·
            </span>
            <span className="font-medium text-text-secondary">{dict.detail.phaseLabel}:</span>{' '}
            {phaseLabel}
            <span className="mx-2" aria-hidden="true">
              ·
            </span>
            <span className="font-medium text-text-secondary">{dict.detail.statusLabel}:</span>{' '}
            {statusLabel}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <ButtonLink href={primaryCta.href} size="lg" variant="primary">
              {primaryCta.label}
            </ButtonLink>
            <ButtonLink href="/pricing" size="lg" variant="secondary">
              {dict.cta.pricing}
            </ButtonLink>
            <ButtonLink href="/scan" size="lg" variant="secondary">
              {dict.cta.freeScan}
            </ButtonLink>
          </div>
        </div>
      </header>

      <section
        className="border-b border-gray-200 bg-white px-4 py-14 sm:px-6 lg:px-8"
        aria-labelledby="user-stories-heading"
      >
        <div className="mx-auto max-w-3xl">
          <h2 id="user-stories-heading" className="text-2xl font-bold text-text-primary">
            {dict.detail.userStoriesHeading}
          </h2>
          <ul className="mt-6 space-y-3">
            {item.userStories.map((story) => (
              <li key={story} className="flex items-start gap-3 text-base text-text-secondary">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-success-700" aria-hidden="true" />
                {story}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section
        className="bg-bg-secondary px-4 py-14 sm:px-6 lg:px-8"
        aria-labelledby="capabilities-heading"
      >
        <div className="mx-auto max-w-3xl">
          <h2 id="capabilities-heading" className="text-2xl font-bold text-text-primary">
            {dict.detail.capabilitiesHeading}
          </h2>
          <ul className="mt-6 space-y-3">
            {item.capabilities.map((capability) => (
              <li key={capability} className="flex items-start gap-3 text-base text-text-secondary">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary-600" aria-hidden="true" />
                {capability}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
