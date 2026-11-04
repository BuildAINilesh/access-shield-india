'use client';

import { useEffect, useState } from 'react';
import { LocaleLink } from '@/components/common/LocaleLink';

interface Lesson {
  slug: string;
  title: string;
  summary: string;
  bodyMarkdown: string;
  durationMinutes: number;
}

const apiBase = () => process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

/** Minimal markdown → HTML for lesson bodies (headings, lists, code, paragraphs). */
function renderSimpleMarkdown(md: string): string {
  const lines = md.split('\n');
  const html: string[] = [];
  let inList = false;

  const flushList = () => {
    if (inList) {
      html.push('</ul>');
      inList = false;
    }
  };

  const inline = (s: string) =>
    s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/`([^`]+)`/g, '<code class="rounded bg-bg-tertiary px-1 text-sm" >$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  for (const line of lines) {
    if (line.startsWith('# ')) {
      flushList();
      html.push(`<h1 class="text-3xl font-bold text-text-primary">${inline(line.slice(2))}</h1>`);
    } else if (line.startsWith('## ')) {
      flushList();
      html.push(
        `<h2 class="mt-8 text-xl font-semibold text-text-primary">${inline(line.slice(3))}</h2>`,
      );
    } else if (line.startsWith('- ')) {
      if (!inList) {
        html.push('<ul class="mt-3 list-disc space-y-1 pl-5 text-text-secondary">');
        inList = true;
      }
      html.push(`<li>${inline(line.slice(2))}</li>`);
    } else if (/^\d+\.\s/.test(line)) {
      if (!inList) {
        html.push('<ul class="mt-3 list-decimal space-y-1 pl-5 text-text-secondary">');
        inList = true;
      }
      html.push(`<li>${inline(line.replace(/^\d+\.\s/, ''))}</li>`);
    } else if (line.trim() === '') {
      flushList();
    } else {
      flushList();
      html.push(`<p class="mt-3 text-base leading-relaxed text-text-secondary">${inline(line)}</p>`);
    }
  }
  flushList();
  return html.join('\n');
}

export function LearnLessonView({ slug }: { slug: string }) {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void fetch(`${apiBase()}/api/v1/learn/lessons/${encodeURIComponent(slug)}`)
      .then(async (res) => {
        if (res.status === 404) throw new Error('Lesson not found');
        if (!res.ok) throw new Error('Failed to load lesson');
        const json = (await res.json()) as { data: Lesson };
        if (!cancelled) setLesson(json.data);
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
  }, [slug]);

  if (loading) {
    return (
      <p role="status" aria-busy="true" className="text-text-secondary">
        Loading lesson…
      </p>
    );
  }

  if (error || !lesson) {
    return (
      <div role="alert" className="space-y-4">
        <p className="text-error-700">{error ?? 'Not found'}</p>
        <LocaleLink
          href="/learn"
          className="inline-flex min-h-11 items-center font-semibold text-primary-600 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
        >
          ← Back to Learn
        </LocaleLink>
      </div>
    );
  }

  return (
    <article>
      <LocaleLink
        href="/learn"
        className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-600 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
      >
        ← Back to Learn
      </LocaleLink>
      <p className="mt-4 text-sm text-text-tertiary">{lesson.durationMinutes} min read</p>
      <div
        className="prose-an mt-2 space-y-1"
        // A11Y: body is curated markdown from our DB seed, not end-user HTML
        dangerouslySetInnerHTML={{ __html: renderSimpleMarkdown(lesson.bodyMarkdown) }}
      />
    </article>
  );
}
