import { LocaleLink } from '@/components/common/LocaleLink';
import { PhaseBadge, StatusBadge } from '@/components/marketing/features/PhaseBadge';
import type { FeatureMeta } from '@/lib/features/catalog';
import type { FeatureItemCopy, FeaturesDict } from '@/lib/i18n/dictionaries/types';

interface FeatureCardProps {
  meta: FeatureMeta;
  item: FeatureItemCopy;
  dict: FeaturesDict;
}

export function FeatureCard({ meta, item, dict }: FeatureCardProps) {
  const phaseLabel = dict.hub.filterPhase.replace('{n}', String(meta.phase));
  const statusLabel = dict.status[meta.status];

  return (
    <article className="flex h-full flex-col rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap gap-2">
        <PhaseBadge phase={meta.phase} phaseLabel={phaseLabel} />
        <StatusBadge status={meta.status} label={statusLabel} />
      </div>
      <h3 className="mt-4 text-xl font-bold text-text-primary">
        <LocaleLink
          href={`/features/${meta.slug}`}
          className="rounded-sm hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
        >
          {item.name}
        </LocaleLink>
      </h3>
      <p className="mt-2 text-sm font-medium text-text-secondary">{item.tagline}</p>
      <p className="mt-3 flex-1 text-base leading-normal text-text-secondary">{item.summary}</p>
      <p className="mt-4 text-xs text-text-tertiary">
        <span className="font-medium text-text-secondary">{dict.detail.snykLabel}:</span>{' '}
        {item.snykParallel}
      </p>
      <LocaleLink
        href={`/features/${meta.slug}`}
        className="mt-6 inline-flex min-h-11 items-center text-base font-semibold text-primary-600 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
      >
        {dict.hub.viewDetails}
        <span className="sr-only">: {item.name}</span>
      </LocaleLink>
    </article>
  );
}
