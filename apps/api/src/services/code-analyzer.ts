/**
 * Lightweight static accessibility analysis for IDE / snippet scans (AN-F001).
 * Heuristic line-based rules — complements axe-core browser scans, does not replace them.
 */

export type CodeFiletype = 'html' | 'jsx' | 'tsx' | 'vue' | 'unknown';

export type CodeSeverity = 'error' | 'warning' | 'info';

export interface CodeViolation {
  ruleId: string;
  message: string;
  severity: CodeSeverity;
  line: number;
  column: number;
  endLine: number;
  endColumn: number;
  wcagCriteria: string[];
  learnPath?: string;
  snippet: string;
}

export interface AnalyzeCodeResult {
  filetype: CodeFiletype;
  violations: CodeViolation[];
}

interface RuleDef {
  ruleId: string;
  message: string;
  severity: CodeSeverity;
  wcagCriteria: string[];
  learnPath: string;
  /** Return match ranges within a single line (1-based columns) */
  matchLine: (line: string, filetype: CodeFiletype) => Array<{ start: number; end: number }> | null;
}

function isHtmlLike(filetype: CodeFiletype): boolean {
  return filetype === 'html' || filetype === 'jsx' || filetype === 'tsx' || filetype === 'vue';
}

const RULES: RuleDef[] = [
  {
    ruleId: 'image-alt',
    message: 'Image is missing an alt attribute',
    severity: 'error',
    wcagCriteria: ['1.1.1'],
    learnPath: '/learn',
    matchLine: (line, filetype) => {
      if (!isHtmlLike(filetype)) return null;
      if (!/<img\b/i.test(line)) return null;
      if (/\balt\s*=/i.test(line)) return null;
      const idx = line.toLowerCase().indexOf('<img');
      return [{ start: idx + 1, end: idx + 5 }];
    },
  },
  {
    ruleId: 'button-name',
    message: 'Button has no accessible name (text, aria-label, or aria-labelledby)',
    severity: 'error',
    wcagCriteria: ['4.1.2'],
    learnPath: '/learn',
    matchLine: (line, filetype) => {
      if (!isHtmlLike(filetype)) return null;
      const selfClosing = /<button\b[^>]*\/\s*>/i.test(line);
      const empty =
        /<button\b[^>]*>\s*<\/button>/i.test(line) ||
        /<button\b[^>]*>\s*\{?\s*\}?\s*<\/button>/i.test(line);
      const iconOnly =
        /<button\b[^>]*>\s*<(\w+)[^>]*\/?\s*>\s*<\/button>/i.test(line) &&
        !/\baria-label\s*=/i.test(line) &&
        !/\baria-labelledby\s*=/i.test(line);
      if (!selfClosing && !empty && !iconOnly) return null;
      if (/\baria-label\s*=/i.test(line) || /\baria-labelledby\s*=/i.test(line)) return null;
      const idx = line.toLowerCase().indexOf('<button');
      if (idx < 0) return null;
      return [{ start: idx + 1, end: idx + 8 }];
    },
  },
  {
    ruleId: 'input-label',
    message: 'Form control is missing an associated label or accessible name',
    severity: 'error',
    wcagCriteria: ['1.3.1', '3.3.2'],
    learnPath: '/learn',
    matchLine: (line, filetype) => {
      if (!isHtmlLike(filetype)) return null;
      if (!/<(input|select|textarea)\b/i.test(line)) return null;
      if (/type\s*=\s*["']hidden["']/i.test(line)) return null;
      if (
        /\baria-label\s*=/i.test(line) ||
        /\baria-labelledby\s*=/i.test(line) ||
        /\btitle\s*=/i.test(line) ||
        /\bid\s*=/i.test(line)
      ) {
        // id alone is not enough without a matching label — still flag bare inputs without aria
        if (/\baria-label\s*=/i.test(line) || /\baria-labelledby\s*=/i.test(line)) return null;
        if (/\btitle\s*=/i.test(line)) return null;
      }
      // Heuristic: inputs/selects/textareas without aria-label/labelledby/title
      if (
        /\baria-label\s*=/i.test(line) ||
        /\baria-labelledby\s*=/i.test(line) ||
        /\btitle\s*=/i.test(line)
      ) {
        return null;
      }
      const m = line.match(/<(input|select|textarea)\b/i);
      if (!m || m.index == null) return null;
      return [{ start: m.index + 1, end: m.index + m[0].length }];
    },
  },
  {
    ruleId: 'link-name',
    message: 'Link has no discernible text',
    severity: 'error',
    wcagCriteria: ['2.4.4', '4.1.2'],
    learnPath: '/learn',
    matchLine: (line, filetype) => {
      if (!isHtmlLike(filetype)) return null;
      const empty =
        /<a\b[^>]*>\s*<\/a>/i.test(line) ||
        /<a\b[^>]*\/\s*>/i.test(line) ||
        (/<a\b[^>]*>\s*<(\w+)[^>]*\/?\s*>\s*<\/a>/i.test(line) && !/\baria-label\s*=/i.test(line));
      if (!empty) return null;
      if (/\baria-label\s*=/i.test(line) || /\baria-labelledby\s*=/i.test(line)) return null;
      const idx = line.toLowerCase().indexOf('<a');
      if (idx < 0) return null;
      return [{ start: idx + 1, end: idx + 3 }];
    },
  },
  {
    ruleId: 'html-has-lang',
    message: 'Root html element is missing a lang attribute',
    severity: 'error',
    wcagCriteria: ['3.1.1'],
    learnPath: '/learn',
    matchLine: (line, filetype) => {
      if (filetype !== 'html') return null;
      if (!/<html\b/i.test(line)) return null;
      if (/\blang\s*=/i.test(line)) return null;
      const idx = line.toLowerCase().indexOf('<html');
      return [{ start: idx + 1, end: idx + 6 }];
    },
  },
  {
    ruleId: 'autofocus',
    message: 'Avoid autofocus — it can disorient keyboard and screen-reader users',
    severity: 'warning',
    wcagCriteria: ['2.4.3'],
    learnPath: '/learn',
    matchLine: (line, filetype) => {
      if (!isHtmlLike(filetype)) return null;
      if (!/\bautofocus\b/i.test(line)) return null;
      const idx = line.toLowerCase().indexOf('autofocus');
      return [{ start: idx + 1, end: idx + 10 }];
    },
  },
];

export function detectFiletype(filenameOrType: string): CodeFiletype {
  const lower = filenameOrType.toLowerCase();
  if (lower.endsWith('.tsx') || lower === 'tsx') return 'tsx';
  if (lower.endsWith('.jsx') || lower === 'jsx') return 'jsx';
  if (lower.endsWith('.vue') || lower === 'vue') return 'vue';
  if (lower.endsWith('.html') || lower.endsWith('.htm') || lower === 'html') return 'html';
  return 'unknown';
}

/**
 * Analyze source text and return accessibility violations with line/column ranges.
 */
export function analyzeCode(code: string, filetypeInput: string): AnalyzeCodeResult {
  const filetype = detectFiletype(filetypeInput);
  const lines = code.split(/\r?\n/);
  const violations: CodeViolation[] = [];

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    for (const rule of RULES) {
      const matches = rule.matchLine(line, filetype);
      if (!matches) continue;
      for (const range of matches) {
        violations.push({
          ruleId: rule.ruleId,
          message: rule.message,
          severity: rule.severity,
          line: lineNumber,
          column: range.start,
          endLine: lineNumber,
          endColumn: range.end,
          wcagCriteria: rule.wcagCriteria,
          learnPath: rule.learnPath,
          snippet: line.trim().slice(0, 200),
        });
      }
    }
  });

  return { filetype, violations };
}
