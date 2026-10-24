import type { Metadata } from 'next';
import { LearnLessonView } from '@/components/marketing/learn/LearnLessonView';
import type { Locale } from '@/lib/i18n/config';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `${slug} | AccessibleNow Learn`,
    description: 'AccessibleNow accessibility lesson',
    alternates: {
      canonical: `https://accessiblenow.in/learn/${slug}`,
    },
  };
}

export default async function LearnLessonPage({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}) {
  const { slug } = await params;
  return (
    <main id="main-content" className="bg-white px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <LearnLessonView slug={slug} />
      </div>
    </main>
  );
}
