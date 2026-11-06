'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

export type BrandLogoVariant = 'full' | 'mark' | 'wordmark';

export interface BrandLogoProps {
  /** Visual treatment */
  variant?: BrandLogoVariant;
  /** Optional extra classes on the outer wrapper */
  className?: string;
  /** Image height in px (width auto). Defaults by variant. */
  height?: number;
  /** Prefer decorative (hide from AT) when adjacent text already names the brand */
  decorative?: boolean;
  /**
   * Light wordmark on dark canvases. Default true — the app chrome is dark.
   * Pass false only on a light surface.
   */
  onDark?: boolean;
  /** Eager load for above-the-fold chrome */
  priority?: boolean;
}

/** Horizontal lockup assets in /public/brand (excluded from locale rewrite). */
const SRC: Record<BrandLogoVariant, string> = {
  full: '/brand/logo.png',
  mark: '/brand/logo-mark.png',
  wordmark: '/brand/logo-wordmark.png',
};

const DEFAULT_HEIGHT: Record<BrandLogoVariant, number> = {
  full: 56,
  mark: 44,
  wordmark: 36,
};

/** Intrinsic aspect ratios after tight crop of Logo2 artwork. */
const ASPECT: Record<BrandLogoVariant, number> = {
  full: 4.13,
  mark: 1,
  wordmark: 2.86,
};

/**
 * AccessibleNow brand mark / lockup.
 * Dark canvases use the transparent mark plus HTML type — CSS invert of the
 * raster lockup turns anti-aliased black letters into a noisy halo.
 */
export function BrandLogo({
  variant = 'full',
  className,
  height,
  decorative = false,
  onDark = true,
  priority = false,
}: BrandLogoProps) {
  const h = height ?? DEFAULT_HEIGHT[variant];
  const alt = decorative ? '' : 'AccessibleNow — Access for everyone. Now.';

  if (!onDark) {
    const w = Math.round(h * ASPECT[variant]);
    return (
      <span className={cn('inline-flex items-center justify-center', className)}>
        <Image
          src={SRC[variant]}
          alt={alt}
          width={w}
          height={h}
          className="h-auto w-auto max-w-full object-contain"
          style={{ height: h, width: 'auto' }}
          priority={priority}
          unoptimized
        />
      </span>
    );
  }

  const markH = variant === 'wordmark' ? Math.round(h * 0.92) : h;
  const markW = markH;
  const titleSize = Math.max(14, Math.round(h * 0.42));
  const tagSize = Math.max(12, Math.round(h * 0.14));
  const showTagline = variant !== 'mark' && h >= 56;
  const showWord = variant !== 'mark';
  const showMark = variant !== 'wordmark';

  return (
    <span
      className={cn('inline-flex items-center', className)}
      style={{ gap: Math.max(8, Math.round(h * 0.16)) }}
      aria-hidden={decorative || undefined}
    >
      {showMark ? (
        <Image
          src={SRC.mark}
          alt={decorative || showWord ? '' : alt}
          width={markW}
          height={markH}
          className="shrink-0 object-contain"
          style={{ height: markH, width: markH }}
          priority={priority}
          unoptimized
        />
      ) : null}
      {showWord ? (
        <span className="flex min-w-0 flex-col justify-center text-left leading-none">
          <span
            className="font-sans font-bold tracking-tight"
            style={{ fontSize: titleSize, lineHeight: 1.05 }}
          >
            <span className="text-[#c4b5fd]">Accessible</span>
            <span className="text-[#f4f4f5]">Now</span>
          </span>
          {showTagline ? (
            <span
              className="mt-[0.2em] font-sans font-semibold uppercase text-[#a1a1aa]"
              style={{ fontSize: tagSize, letterSpacing: '0.14em' }}
            >
              Access for everyone. Now.
            </span>
          ) : null}
        </span>
      ) : null}
    </span>
  );
}

BrandLogo.displayName = 'BrandLogo';
