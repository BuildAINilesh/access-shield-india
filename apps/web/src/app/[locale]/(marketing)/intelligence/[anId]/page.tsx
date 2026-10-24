import type { Metadata } from 'next';
import { IntelligenceIssueView } from '@/components/marketing/intelligence/IntelligenceIssueView';
import type { Locale } from '@/lib/i18n/config';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale; anId: string }>;
}): Promise<Metadata> {
  const { anId } = await params;
  return {
    title: `${anId} | AccessibleNow Intelligence`,
    description: `Accessibility intelligence issue ${anId}`,
    alternates: {
      canonical: `https://accessiblenow.in/intelligence/${anId}`,
    },
  };
}

export default async function IntelligenceIssuePage({
  params,
}: {
  params: Promise<{ locale: Locale; anId: string }>;
}) {
  const { anId } = await params;

  return (
    <main id="main-content" className="bg-white px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <IntelligenceIssueView anId={anId} />
      </div>
    </main>
  );
}
