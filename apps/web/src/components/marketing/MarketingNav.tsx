'use client';

import { LocaleLink } from '@/components/common/LocaleLink';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { ButtonLink } from '@/components/marketing/ButtonLink';
import { MobileMenuToggle } from './MobileMenuToggle';
import { useDictionary } from '@/lib/i18n/locale-context';

const navLinkClass =
  'text-sm font-medium text-zinc-300 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#07070c] rounded-sm';

export function MarketingNav() {
  const { common } = useDictionary();
  const { nav } = common;

  const links = [
    { href: '/', label: nav.home },
    { href: '/services', label: nav.services },
    { href: '/widget', label: nav.widget },
    { href: '/blog', label: nav.blog },
    { href: '/contact', label: nav.contact },
  ] as const;

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#07070c]/80 backdrop-blur-md">
      <nav
        className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8"
        aria-label={nav.mainAria}
      >
        <LocaleLink
          href="/"
          className="shrink-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#07070c]"
          aria-label={common.brand}
        >
          <BrandLogo variant="full" height={40} priority decorative onDark />
        </LocaleLink>

        <ul className="hidden items-center gap-7 lg:flex" role="list">
          {links.map(({ href, label }) => (
            <li key={href}>
              <LocaleLink href={href} className={navLinkClass}>
                {label}
              </LocaleLink>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-4 lg:flex">
          <LanguageSwitcher />
          <LocaleLink href="/login" className={navLinkClass}>
            {nav.signIn}
          </LocaleLink>
          <ButtonLink href="/scan" size="md" variant="primary">
            {nav.scan}
          </ButtonLink>
        </div>

        <div className="flex items-center lg:hidden">
          <MobileMenuToggle />
        </div>
      </nav>
    </header>
  );
}
