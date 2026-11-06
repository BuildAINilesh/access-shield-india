'use client';

import { usePathname, useRouter } from 'next/navigation';
import { ChevronDown, Globe } from 'lucide-react';
import { DropdownMenu } from '@accessshield/ui';
import type { Locale } from '@/lib/i18n/config';
import { LOCALE_COOKIE } from '@/lib/i18n/config';
import { isLocaleAgnosticPath, localizedHref, pathnameHasHiPrefix } from '@/lib/i18n/paths';
import { useDictionary, useLocale } from '@/lib/i18n/locale-context';
import { cn } from '@/lib/utils';

/** Pathname without /hi prefix — usePathname() returns internal path after rewrite */
function logicalPath(pathname: string, locale: string): string {
  if (locale === 'hi' && !pathnameHasHiPrefix(pathname)) {
    return pathname;
  }
  if (pathnameHasHiPrefix(pathname)) {
    return pathname === '/hi' ? '/' : pathname.slice(3) || '/';
  }
  return pathname;
}

function setLocaleCookie(locale: Locale): void {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
}

const LOCALES: Locale[] = ['en', 'hi'];

export function LanguageSwitcher({ className }: { className?: string }) {
  const locale = useLocale();
  const { common } = useDictionary();
  const pathname = usePathname();
  const router = useRouter();
  const path = logicalPath(pathname, locale);
  const cookieOnly = isLocaleAgnosticPath(path);

  const labels: Record<Locale, string> = {
    en: common.language.en,
    hi: common.language.hi,
  };

  const shortLabels: Record<Locale, string> = {
    en: 'EN',
    hi: 'हिं',
  };

  function switchLocale(target: Locale) {
    if (target === locale) return;
    setLocaleCookie(target);
    if (cookieOnly) {
      router.refresh();
      return;
    }
    router.push(localizedHref(path, target));
  }

  return (
    <div className={cn(className)}>
      <DropdownMenu
        align="end"
        ariaLabel={common.language.label}
        trigger={
          <button
            type="button"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
            aria-label={`${common.language.label}: ${labels[locale]}`}
          >
            <Globe className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{shortLabels[locale]}</span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden="true" />
          </button>
        }
        items={LOCALES.map((code) => ({
          id: code,
          label: labels[code],
          onSelect: () => switchLocale(code),
          shortcut: code === locale ? '✓' : undefined,
        }))}
      />
    </div>
  );
}
