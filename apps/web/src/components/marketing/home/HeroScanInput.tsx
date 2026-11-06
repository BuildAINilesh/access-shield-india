'use client';

import { useEffect, useId, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useDictionary, useLocale } from '@/lib/i18n/locale-context';
import { localizedHref } from '@/lib/i18n/paths';

/** Normalises "example.in" to "https://example.in"; returns null when not a valid http(s) URL. */
export function normaliseScanUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(candidate);
    if (!parsed.hostname.includes('.')) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

/** Hero URL box — hands the visitor's site to the free scan page so value shows in one step. */
export function HeroScanInput() {
  const router = useRouter();
  const locale = useLocale();
  const { home } = useDictionary();
  const copy = home.heroScan;
  const inputId = useId();
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const scanHref = localizedHref('/scan', locale);

  useEffect(() => {
    router.prefetch(scanHref);
  }, [router, scanHref]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalised = normaliseScanUrl(url);
    if (!normalised) {
      setError(copy.invalidUrl);
      return;
    }
    setError('');
    router.push(`${localizedHref('/scan', locale)}?url=${encodeURIComponent(normalised)}`);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mx-auto mt-8 w-full max-w-xl lg:mx-0">
      <label htmlFor={inputId} className="block text-base font-semibold text-white">
        {copy.label}
      </label>
      <div className="mt-3 flex flex-col overflow-hidden rounded-lg border-2 border-white/20 bg-[#12121a] focus-within:border-violet-400 sm:flex-row">
        <input
          id={inputId}
          name="url"
          type="url"
          inputMode="url"
          autoComplete="url"
          placeholder={copy.placeholder}
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          aria-required="true"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${errorId} ${hintId}` : hintId}
          className="min-h-12 flex-1 border-0 bg-transparent px-4 text-base text-white placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-inset"
        />
        <button
          type="submit"
          className="min-h-12 shrink-0 bg-[#5b21b6] px-6 text-base font-semibold text-white hover:bg-[#6d28d9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#12121a]"
        >
          {copy.submit}
        </button>
      </div>
      {error && (
        <p id={errorId} role="alert" className="mt-2 text-sm font-medium text-red-300">
          {error}
        </p>
      )}
      <p id={hintId} className="mt-2 text-sm text-zinc-400">
        {copy.hint}
      </p>
    </form>
  );
}
