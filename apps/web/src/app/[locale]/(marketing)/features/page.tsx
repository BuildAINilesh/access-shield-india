import type { Metadata } from 'next';
import { FeaturesHub } from '@/components/marketing/features/FeaturesHub';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import type { Locale } from '@/lib/i18n/config';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const dict = getDictionary(locale);

  return {
    title: dict.features.meta.title,
    description: dict.features.meta.description,
    openGraph: {
      title: `${dict.features.meta.title} | ${dict.common.brand}`,
      description: dict.features.meta.description,
      type: 'website',
    },
    alternates: {
      canonical: 'https://accessiblenow.in/features',
    },
  };
}

export default async function FeaturesPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const dict = getDictionary(locale);

  return <FeaturesHub dict={dict.features} />;
}
