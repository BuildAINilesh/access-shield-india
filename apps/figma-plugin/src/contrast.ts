/** WCAG 2.2 relative luminance + contrast helpers (sRGB). */

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

/** Figma RGB channels are 0–1. */
export function figmaRgbToSrgb(c: { r: number; g: number; b: number }): Rgb {
  return {
    r: Math.round(c.r * 255),
    g: Math.round(c.g * 255),
    b: Math.round(c.b * 255),
  };
}

export function hexFromRgb(c: Rgb): string {
  const h = (n: number) => n.toString(16).padStart(2, '0');
  return `#${h(c.r)}${h(c.g)}${h(c.b)}`.toUpperCase();
}

function channelL(c: number): number {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

export function relativeLuminance(c: Rgb): number {
  return 0.2126 * channelL(c.r) + 0.7152 * channelL(c.g) + 0.0722 * channelL(c.b);
}

export function contrastRatio(a: Rgb, b: Rgb): number {
  const l1 = relativeLuminance(a);
  const l2 = relativeLuminance(b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export interface ContrastResult {
  ratio: number;
  aaNormal: boolean;
  aaLarge: boolean;
  aaaNormal: boolean;
  foreground: Rgb;
  background: Rgb;
  foregroundHex: string;
  backgroundHex: string;
  suggestedForegroundHex: string;
}

/** Darken or lighten foreground toward AA 4.5:1 against background. */
export function suggestAccessibleForeground(fg: Rgb, bg: Rgb): Rgb {
  if (contrastRatio(fg, bg) >= 4.5) return fg;
  const bgLum = relativeLuminance(bg);
  const targetDarker = bgLum > 0.5;
  let best = { ...fg };
  let bestRatio = contrastRatio(fg, bg);
  for (let step = 0; step <= 255; step += 1) {
    const candidate = targetDarker
      ? {
          r: Math.max(0, fg.r - step),
          g: Math.max(0, fg.g - step),
          b: Math.max(0, fg.b - step),
        }
      : {
          r: Math.min(255, fg.r + step),
          g: Math.min(255, fg.g + step),
          b: Math.min(255, fg.b + step),
        };
    const ratio = contrastRatio(candidate, bg);
    if (ratio > bestRatio) {
      bestRatio = ratio;
      best = candidate;
    }
    if (ratio >= 4.5) return candidate;
  }
  return best;
}

export function evaluateContrast(fg: Rgb, bg: Rgb): ContrastResult {
  const ratio = contrastRatio(fg, bg);
  const suggested = suggestAccessibleForeground(fg, bg);
  return {
    ratio,
    aaNormal: ratio >= 4.5,
    aaLarge: ratio >= 3,
    aaaNormal: ratio >= 7,
    foreground: fg,
    background: bg,
    foregroundHex: hexFromRgb(fg),
    backgroundHex: hexFromRgb(bg),
    suggestedForegroundHex: hexFromRgb(suggested),
  };
}
