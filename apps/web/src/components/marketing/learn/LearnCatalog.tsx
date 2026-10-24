'use client';

import { useEffect, useState } from 'react';
import { LocaleLink } from '@/components/common/LocaleLink';

interface LessonSummary {
  id: string;
  slug: string;
  title: string;
  summary: string;
  durationMinutes: number;
}

const apiBase = () => process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export function LearnCatalog() {
  const [lessons, setLessons] = useState<LessonSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void fetch(`${apiBase()}/api/v1/learn/lessons`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to load lessons');
        const json = (await res.json()) as { data: { lessons: LessonSummary[] } };
        if (!cancelled) setLessons(json.data.lessons);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <p className="mx-auto max-w-3xl text-text-secondary" role="status" aria-busy="true">
        Loading lessons…
      </p>
    );
  }

  if (error) {
    return (
      <p className="mx-auto max-w-3xl text-error-700" role="alert">
        {error}
      </p>
    );
  }

  return (
    <ul className="mx-auto max-w-3xl space-y-4" aria-label="Lessons">
      {lessons.map((lesson) => (
        <li key={lesson.id}>
          <LocaleLink
            href={`/learn/${lesson.slug}`}
            className="block rounded-lg border border-border bg-white p-5 transition hover:border-primary-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-xl font-semibold text-text-primary">{lesson.title}</h2>
              <span className="text-sm text-text-tertiary">{lesson.durationMinutes} min</span>
            </div>
            <p className="mt-2 text-base text-text-secondary">{lesson.summary}</p>
          </LocaleLink>
        </li>
      ))}
    </ul>
  );
}
