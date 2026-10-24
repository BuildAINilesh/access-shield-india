import { describe, expect, it } from 'vitest';
import { analyzeCode } from './code-analyzer';
import { applyTemplateFix, findBuiltinTemplate } from './fix-templates';

describe('code-analyzer', () => {
  it('flags img without alt', () => {
    const result = analyzeCode('<div><img src="/logo.png" /></div>', 'html');
    expect(result.violations.some((v) => v.ruleId === 'image-alt')).toBe(true);
  });

  it('does not flag img with alt', () => {
    const result = analyzeCode('<img src="/logo.png" alt="Logo" />', 'html');
    expect(result.violations.some((v) => v.ruleId === 'image-alt')).toBe(false);
  });

  it('flags html without lang', () => {
    const result = analyzeCode('<html><body></body></html>', 'html');
    expect(result.violations.some((v) => v.ruleId === 'html-has-lang')).toBe(true);
  });

  it('flags empty button in jsx', () => {
    const result = analyzeCode('<button></button>', 'tsx');
    expect(result.violations.some((v) => v.ruleId === 'button-name')).toBe(true);
  });

  it('flags autofocus', () => {
    const result = analyzeCode('<input type="text" autofocus />', 'html');
    expect(result.violations.some((v) => v.ruleId === 'autofocus')).toBe(true);
  });
});

describe('fix-templates', () => {
  it('applies image-alt template', () => {
    const fixed = applyTemplateFix('image-alt', '<img src="x.png" />');
    expect(fixed).toContain('alt=""');
  });

  it('has builtin template for button-name', () => {
    expect(findBuiltinTemplate('button-name')?.confidence).toBe('high');
  });
});
