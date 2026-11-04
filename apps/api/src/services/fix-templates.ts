/**
 * Built-in AN Fix templates for common static violations (AN-F005).
 * High-confidence templates bypass Claude for speed.
 */

export type FixConfidence = 'high' | 'medium' | 'low';

export interface BuiltInFixTemplate {
  violationType: string;
  fixTemplate: string;
  explanation: string;
  confidence: FixConfidence;
}

export const BUILTIN_FIX_TEMPLATES: BuiltInFixTemplate[] = [
  {
    violationType: 'image-alt',
    fixTemplate:
      'Add a meaningful alt attribute describing the image purpose, e.g. alt="Company logo" (or alt="" if decorative).',
    explanation:
      'WCAG 1.1.1 requires a text alternative for non-text content. Decorative images should use empty alt="".',
    confidence: 'high',
  },
  {
    violationType: 'button-name',
    fixTemplate:
      'Add an accessible name: put visible text inside the button, or aria-label="Describe the action".',
    explanation:
      'WCAG 4.1.2 requires every button to expose an accessible name to assistive technology.',
    confidence: 'high',
  },
  {
    violationType: 'input-label',
    fixTemplate:
      'Associate a <label htmlFor="id"> or add aria-label / aria-labelledby on the control.',
    explanation:
      'WCAG 1.3.1 and 3.3.2 require form fields to have a visible, programmatically associated label.',
    confidence: 'high',
  },
  {
    violationType: 'link-name',
    fixTemplate: 'Add link text or aria-label that describes the destination (avoid “click here”).',
    explanation:
      'WCAG 2.4.4 requires link purpose to be clear from the link text alone when possible.',
    confidence: 'high',
  },
  {
    violationType: 'html-has-lang',
    fixTemplate:
      'Add lang="en" (or the correct BCP 47 code, e.g. lang="hi") on the <html> element.',
    explanation:
      'WCAG 3.1.1 requires the default language of the page to be programmatically determined.',
    confidence: 'high',
  },
  {
    violationType: 'autofocus',
    fixTemplate: 'Remove the autofocus attribute; move focus only in response to a user action.',
    explanation:
      'Autofocus can disrupt screen-reader users and keyboard navigation order (WCAG 2.4.3).',
    confidence: 'high',
  },
];

export function findBuiltinTemplate(ruleId: string): BuiltInFixTemplate | undefined {
  return BUILTIN_FIX_TEMPLATES.find((t) => t.violationType === ruleId);
}

/**
 * Apply a best-effort string transform for high-confidence template rules.
 */
export function applyTemplateFix(ruleId: string, codeSnippet: string): string | null {
  switch (ruleId) {
    case 'image-alt':
      if (/<img\b/i.test(codeSnippet) && !/\balt\s*=/i.test(codeSnippet)) {
        return codeSnippet.replace(/<img\b/i, '<img alt=""');
      }
      return null;
    case 'html-has-lang':
      if (/<html\b/i.test(codeSnippet) && !/\blang\s*=/i.test(codeSnippet)) {
        return codeSnippet.replace(/<html\b/i, '<html lang="en"');
      }
      return null;
    case 'autofocus':
      return codeSnippet.replace(/\s*\bautofocus\b(=\{?true\}?|=["'][^"']*["'])?/gi, '');
    case 'button-name':
      if (/<button\b/i.test(codeSnippet) && !/\baria-label\s*=/i.test(codeSnippet)) {
        return codeSnippet.replace(/<button\b/i, '<button aria-label="Action"');
      }
      return null;
    case 'link-name':
      if (/<a\b/i.test(codeSnippet) && !/\baria-label\s*=/i.test(codeSnippet)) {
        return codeSnippet.replace(/<a\b/i, '<a aria-label="Link destination"');
      }
      return null;
    case 'input-label':
      if (
        /<(input|select|textarea)\b/i.test(codeSnippet) &&
        !/\baria-label\s*=/i.test(codeSnippet)
      ) {
        return codeSnippet.replace(/<(input|select|textarea)\b/i, '<$1 aria-label="Field label"');
      }
      return null;
    default:
      return null;
  }
}
