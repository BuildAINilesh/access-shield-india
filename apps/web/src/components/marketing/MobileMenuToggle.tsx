'use client';

import { useState } from 'react';
import { useFocusTrap } from '@accessshield/ui';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { ButtonLink } from '@/components/marketing/ButtonLink';
import { LocaleLink } from '@/components/common/LocaleLink';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { useDictionary } from '@/lib/i18n/locale-context';

export function MobileMenuToggle() {
  const [isOpen, setIsOpen] = useState(false);
  const trapRef = useFocusTrap<HTMLDivElement>({ active: isOpen });
  const { common } = useDictionary();
  const { nav } = common;

  const handleClose = () => setIsOpen(false);

  const linkClass =
    'block rounded-md px-3 py-3 text-base font-medium text-zinc-300 hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#12121a]';

  const links = [
    { href: '/', label: nav.home },
    { href: '/services', label: nav.services },
    { href: '/widget', label: nav.widget },
    { href: '/blog', label: nav.blog },
    { href: '/contact', label: nav.contact },
  ] as const;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls="mobile-menu"
        aria-label={nav.toggleMenu}
        className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md p-2 text-zinc-200 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#07070c]"
      >
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="2"
          stroke="currentColor"
          aria-hidden="true"
        >
          {isOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={handleClose}
            aria-hidden="true"
          />

          <div
            id="mobile-menu"
            ref={trapRef}
            role="dialog"
            aria-modal="true"
            aria-label={nav.mobileMenuAria}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-sm border-l border-white/10 bg-[#12121a] px-6 py-6 shadow-xl sm:max-w-sm"
          >
            <div className="flex items-center justify-between">
              <BrandLogo variant="full" height={40} decorative onDark />
              <button
                type="button"
                onClick={handleClose}
                aria-label={nav.closeMenu}
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md p-2 text-zinc-200 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#12121a]"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mt-6">
              <LanguageSwitcher />
            </div>

            <nav className="mt-8 flex flex-col gap-1">
              {links.map(({ href, label }) => (
                <LocaleLink key={href} href={href} onClick={handleClose} className={linkClass}>
                  {label}
                </LocaleLink>
              ))}

              <LocaleLink href="/login" onClick={handleClose} className={linkClass}>
                {nav.signIn}
              </LocaleLink>

              <div className="mt-4">
                <ButtonLink
                  href="/scan"
                  size="lg"
                  variant="primary"
                  className="w-full"
                  onClick={handleClose}
                >
                  {nav.scan}
                </ButtonLink>
              </div>
            </nav>
          </div>
        </>
      )}
    </>
  );
}
