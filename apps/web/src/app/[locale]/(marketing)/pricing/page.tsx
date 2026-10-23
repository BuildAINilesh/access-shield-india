import type { Metadata } from 'next';
import { PricingPageContent } from '@/components/marketing/pricing/PricingPageContent';
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
    title: dict.pricing.page.title,
    description: dict.pricing.page.description,
    openGraph: {
      title: `${dict.pricing.page.title} | ${dict.common.brand}`,
      description: dict.pricing.page.description,
      type: 'website',
    },
    alternates: {
      canonical: 'https://accessiblenow.in/pricing',
    },
  };
}

export default function PricingPage() {
  return <PricingPageContent />;
}
