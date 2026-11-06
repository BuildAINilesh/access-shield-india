import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import type { Metadata } from 'next';
import { HeroSection } from '@/components/marketing/home/HeroSection';
import { RiskStatsBar } from '@/components/marketing/home/RiskStatsBar';
import { HowItWorksSection } from '@/components/marketing/home/HowItWorksSection';
import { FeaturesSection } from '@/components/marketing/home/FeaturesSection';
import { WhoWeBuildForSection } from '@/components/marketing/home/WhoWeBuildForSection';
import { StandardsSection } from '@/components/marketing/home/StandardsSection';
import { TestimonialsSection } from '@/components/marketing/home/TestimonialsSection';
import { BlogPreviewSection } from '@/components/marketing/home/BlogPreviewSection';
import { MarketingSectionSkeleton } from '@/components/marketing/MarketingSectionSkeleton';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { localeFromParams } from '@/lib/i18n/server';
import { localizedHref } from '@/lib/i18n/paths';
import type { Locale } from '@/lib/i18n/config';

/** ISR — refresh marketing home hourly (blog preview may lag up to 60s via Sanity revalidate). */
export const revalidate = 3600;

const StoryCarousel = dynamic(
  () =>
    import('@/components/marketing/home/StoryCarousel').then((mod) => ({
      default: mod.StoryCarousel,
    })),
  { loading: () => <MarketingSectionSkeleton className="min-h-[220px]" /> },
);

const DisabilitySimulator = dynamic(
  () =>
    import('@/components/marketing/home/DisabilitySimulator').then((mod) => ({
      default: mod.DisabilitySimulator,
    })),
  { loading: () => <MarketingSectionSkeleton className="min-h-[280px]" /> },
);

const RiskCalculator = dynamic(
  () =>
    import('@/components/marketing/home/RiskCalculator').then((mod) => ({
      default: mod.RiskCalculator,
    })),
  { loading: () => <MarketingSectionSkeleton className="min-h-[280px]" /> },
);

const ComplianceQuiz = dynamic(
  () =>
    import('@/components/marketing/home/ComplianceQuiz').then((mod) => ({
      default: mod.ComplianceQuiz,
    })),
  { loading: () => <MarketingSectionSkeleton className="min-h-[280px]" /> },
);

const LiveTicker = dynamic(() =>
  import('@/components/marketing/home/LiveTicker').then((mod) => ({
    default: mod.LiveTicker,
  })),
);

const CTABanner = dynamic(
  () =>
    import('@/components/marketing/home/CTABanner').then((mod) => ({
      default: mod.CTABanner,
    })),
  { loading: () => <MarketingSectionSkeleton className="min-h-[280px]" /> },
);

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const locale = localeFromParams(params);
  const { home } = getDictionary(locale);
  const base = 'https://accessshield.in';

  return {
    title: home.meta.title,
    description: home.meta.description,
    openGraph: {
      title: 'Enterprise Digital Accessibility | AccessibleNow',
      description: home.meta.description,
      type: 'website',
    },
    alternates: {
      canonical: localizedHref('/', locale) === '/' ? base : `${base}${localizedHref('/', locale)}`,
      languages: {
        en: base,
        hi: `${base}/hi`,
      },
    },
  };
}

export default function HomePage({ params }: { params: { locale: string } }) {
  const locale = localeFromParams(params) as Locale;

  return (
    <>
      <HeroSection />
      <RiskStatsBar locale={locale} />
      <StoryCarousel />
      <DisabilitySimulator />
      <RiskCalculator />
      <HowItWorksSection locale={locale} />
      <ComplianceQuiz />
      <FeaturesSection locale={locale} />
      <WhoWeBuildForSection locale={locale} />
      <LiveTicker />
      <StandardsSection locale={locale} />
      <TestimonialsSection locale={locale} />
      <Suspense fallback={<MarketingSectionSkeleton className="min-h-[320px]" />}>
        <BlogPreviewSection locale={locale} />
      </Suspense>
      <CTABanner />
    </>
  );
}
