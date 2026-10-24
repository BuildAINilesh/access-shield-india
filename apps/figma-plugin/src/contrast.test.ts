import { describe, expect, it } from 'vitest';
import { contrastRatio, evaluateContrast, hexFromRgb } from './contrast';

describe('contrast', () => {
  it('rates black on white as AAA', () => {
    const r = evaluateContrast({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 });
    expect(r.ratio).toBeGreaterThan(20);
    expect(r.aaNormal).toBe(true);
    expect(r.aaaNormal).toBe(true);
  });

  it('flags light gray on white as fail', () => {
    const r = evaluateContrast({ r: 200, g: 200, b: 200 }, { r: 255, g: 255, b: 255 });
    expect(r.aaNormal).toBe(false);
    expect(contrastRatio(r.foreground, r.background)).toBeLessThan(4.5);
    expect(hexFromRgb(r.foreground)).toBe('#C8C8C8');
  });

  it('suggests a darker foreground when failing', () => {
    const r = evaluateContrast({ r: 180, g: 180, b: 180 }, { r: 255, g: 255, b: 255 });
    expect(r.aaNormal).toBe(false);
    const suggested = evaluateContrast(
      {
        r: parseInt(r.suggestedForegroundHex.slice(1, 3), 16),
        g: parseInt(r.suggestedForegroundHex.slice(3, 5), 16),
        b: parseInt(r.suggestedForegroundHex.slice(5, 7), 16),
      },
      { r: 255, g: 255, b: 255 },
    );
    expect(suggested.aaNormal).toBe(true);
  });
});
