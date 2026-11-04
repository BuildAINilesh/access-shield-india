'use client';

import { useMemo, useState } from 'react';
import { FeatureCard } from '@/components/marketing/features/FeatureCard';
import { FEATURE_CATALOG, type FeaturePhase } from '@/lib/features/catalog';
import type { FeaturesDict } from '@/lib/i18n/dictionaries/types';
import { cn } from '@/lib/utils';

type PhaseFilter = 'all' | FeaturePhase;

interface FeaturesHubProps {
  dict: FeaturesDict;
}

export function FeaturesHub({ dict }: FeaturesHubProps) {
  const [phase, setPhase] = useState<PhaseFilter>('all');

  const filtered = useMemo(() => {
    if (phase === 'all') return FEATURE_CATALOG;
    return FEATURE_CATALOG.filter((item) => item.phase === phase);
  }, [phase]);

  const filters: { value: PhaseFilter; label: string }[] = [
    { value: 'all', label: dict.hub.filterAll },
    { value: 1, label: dict.hub.filterPhase.replace('{n}', '1') },
    { value: 2, label: dict.hub.filterPhase.replace('{n}', '2') },
    { value: 3, label: dict.hub.filterPhase.replace('{n}', '3') },
  ];

  return (
    <>
      <header className="border-b border-gray-200 bg-gradient-to-b from-primary-50 via-white to-white px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary-600">
            {dict.hub.eyebrow}
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-text-primary sm:text-5xl">
            {dict.hub.title}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-text-secondary">
            {dict.hub.subtitle}
          </p>
        </div>
      </header>

      <section
        className="bg-white px-4 py-12 sm:px-6 lg:px-8"
        aria-labelledby="features-grid-heading"
      >
        <div className="mx-auto max-w-7xl">
          <h2 id="features-grid-heading" className="sr-only">
            {dict.hub.title}
          </h2>

          <div
            className="flex flex-wrap justify-center gap-2"
            role="group"
            aria-label={dict.hub.filterAria}
          >
            {filters.map((filter) => {
              const selected = phase === filter.value;
              return (
                <button
                  key={String(filter.value)}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setPhase(filter.value)}
                  className={cn(
                    'min-h-11 rounded-full px-4 text-sm font-semibold transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2',
                    selected
                      ? 'bg-primary-600 text-white'
                      : 'border border-border bg-bg-secondary text-text-secondary hover:bg-white hover:text-text-primary',
                  )}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>

          {filtered.length === 0 ? (
            <p className="mt-12 text-center text-base text-text-secondary" role="status">
              {dict.hub.emptyFilter}
            </p>
          ) : (
            <ul className="mt-12 grid list-none grid-cols-1 gap-6 p-0 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((meta) => (
                <li key={meta.slug}>
                  <FeatureCard meta={meta} item={dict.items[meta.slug]} dict={dict} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
