import { describe, expect, it } from 'vitest';
import { fallbackMarketingChat, sanitizeNavigatePath } from './marketing-chat-knowledge';

describe('sanitizeNavigatePath', () => {
  it('allows known marketing paths and rejects open redirects', () => {
    expect(sanitizeNavigatePath('/scan')).toBe('/scan');
    expect(sanitizeNavigatePath('/contact?service=audit-web')).toBe('/contact?service=audit-web');
    expect(sanitizeNavigatePath('https://evil.example')).toBeUndefined();
    expect(sanitizeNavigatePath('//evil.example')).toBeUndefined();
    expect(sanitizeNavigatePath('/dashboard')).toBeUndefined();
  });
});

describe('fallbackMarketingChat', () => {
  it('explains WCAG and offers the WCAG page', () => {
    const result = fallbackMarketingChat('What is WCAG 2.2 AA?', 'en');
    expect(result.reply.toLowerCase()).toContain('wcag');
    expect(result.navigate).toBe('/wcag-2-2-aa');
  });

  it('navigates when asked to open the scan page', () => {
    const result = fallbackMarketingChat('Take me to the free scan', 'en');
    expect(result.navigate).toBe('/scan');
  });

  it('answers in Hindi for RPwD', () => {
    const result = fallbackMarketingChat('RPwD अधिनियम क्या है?', 'hi');
    expect(/[\u0900-\u097F]/.test(result.reply)).toBe(true);
    expect(result.navigate).toBe('/rpwd-act');
  });
});
