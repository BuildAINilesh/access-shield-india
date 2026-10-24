import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { FeatureDetail } from '@/components/marketing/features/FeatureDetail';
import {
  FEATURE_CATALOG,
  FEATURE_SLUGS,
  getFeatureMeta,
  isFeatureSlug,
} from '@/lib/features/catalog';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import type { Locale } from '@/lib/i18n/config';

export function generateStaticParams() {
  return FEATURE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isFeatureSlug(slug)) {
    return { title: 'Feature not found' };
  }

  const dict = getDictionary(locale);
  const item = dict.features.items[slug];
  const description = item.summary.slice(0, 160);

  return {
    title: item.name,
    description,
    openGraph: {
      title: `${item.name} | ${dict.common.brand}`,
      description,
      type: 'website',
    },
    alternates: {
      canonical: `https://accessiblenow.in/features/${slug}`,
    },
  };
}

export default async function FeatureDetailPage({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isFeatureSlug(slug)) {
    notFound();
  }

  const dict = getDictionary(locale);
  const meta = getFeatureMeta(slug);
  const item = dict.features.items[slug];

  // Ensure catalog and dict stay aligned (compile-time keys + runtime guard).
  const known = FEATURE_CATALOG.some((f) => f.slug === slug);
  if (!known) {
    notFound();
  }

  return <FeatureDetail meta={meta} item={item} dict={dict.features} />;
}
