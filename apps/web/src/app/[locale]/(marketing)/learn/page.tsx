import type { Metadata } from 'next';
import { LearnCatalog } from '@/components/marketing/learn/LearnCatalog';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import type { Locale } from '@/lib/i18n/config';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const dict = getDictionary(locale);
  const title = 'AccessibleNow Learn';
  const description =
    'Short accessibility lessons for developers — alt text, keyboard focus, and form errors.';

  return {
    title,
    description,
    openGraph: {
      title: `${title} | ${dict.common.brand}`,
      description,
      type: 'website',
    },
    alternates: {
      canonical: 'https://accessiblenow.in/learn',
    },
  };
}

export default function LearnPage() {
  return (
    <main id="main-content" className="bg-bg-secondary">
      <header className="border-b border-gray-200 bg-gradient-to-b from-primary-50 via-white to-white px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary-700">AN-F006</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-text-primary sm:text-5xl">
            Learn
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-text-secondary">
            Bite-sized lessons tied to the same rules AccessibleNow detects in scans and IDEs.
            Progress tracking for signed-in orgs lands with the portal next.
          </p>
        </div>
      </header>
      <div className="px-4 py-12 sm:px-6 lg:px-8">
        <LearnCatalog />
      </div>
    </main>
  );
}
