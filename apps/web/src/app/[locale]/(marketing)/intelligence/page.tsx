import type { Metadata } from 'next';
import { IntelligenceBrowser } from '@/components/marketing/intelligence/IntelligenceBrowser';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import type { Locale } from '@/lib/i18n/config';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const dict = getDictionary(locale);
  const title = 'AccessibleNow Intelligence';
  const description =
    'Search curated accessibility issues in popular npm packages — keyboard, focus, names, and AT coverage.';

  return {
    title,
    description,
    openGraph: {
      title: `${title} | ${dict.common.brand}`,
      description,
      type: 'website',
    },
    alternates: {
      canonical: 'https://accessiblenow.in/intelligence',
    },
  };
}

export default function IntelligencePage() {
  return (
    <main id="main-content" className="bg-bg-secondary">
      <header className="border-b border-gray-200 bg-gradient-to-b from-primary-50 via-white to-white px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary-700">AN-F004</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-text-primary sm:text-5xl">
            Intelligence
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-text-secondary">
            Browse known accessibility risks in open-source packages. Same database powers the{' '}
            <code className="rounded bg-bg-tertiary px-1 text-sm">@accessiblenow/scan</code> CLI and
            PR Gate.
          </p>
        </div>
      </header>

      <div className="px-4 py-12 sm:px-6 lg:px-8">
        <IntelligenceBrowser />
      </div>
    </main>
  );
}
