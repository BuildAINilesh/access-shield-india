import type { ReactNode } from 'react';
import Link from 'next/link';
import { BrandLogo } from '@/components/brand/BrandLogo';

export default function VerifyLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="border-b border-zinc-800 bg-[#12121a] px-4 py-4">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/"
            className="inline-block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
            aria-label="AccessibleNow"
          >
            <BrandLogo variant="full" height={56} priority decorative onDark />
          </Link>
        </div>
      </header>
      {children}
    </>
  );
}
