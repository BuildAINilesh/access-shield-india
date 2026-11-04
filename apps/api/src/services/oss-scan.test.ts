import { describe, expect, it } from 'vitest';
import {
  coerceInstalledVersion,
  computeRiskScore,
  versionMatchesRange,
  type MatchedOssIssue,
} from './oss-scan';

describe('coerceInstalledVersion', () => {
  it('strips caret ranges', () => {
    expect(coerceInstalledVersion('^5.7.0')).toBe('5.7.0');
  });

  it('strips tilde ranges', () => {
    expect(coerceInstalledVersion('~4.2.1')).toBe('4.2.1');
  });

  it('returns null for wildcards and file: deps', () => {
    expect(coerceInstalledVersion('*')).toBeNull();
    expect(coerceInstalledVersion('file:../local')).toBeNull();
  });
});

describe('versionMatchesRange', () => {
  it('matches semver ranges', () => {
    expect(versionMatchesRange('^5.7.0', '>=4.0.0 <5.8.0')).toBe(true);
    expect(versionMatchesRange('5.8.0', '>=4.0.0 <5.8.0')).toBe(false);
    expect(versionMatchesRange('1.0.0', '*')).toBe(true);
  });
});

describe('computeRiskScore', () => {
  it('caps at 100', () => {
    const issues = Array.from({ length: 5 }, (_, i) => ({
      anId: `AN-${i}`,
      packageName: 'x',
      installedVersion: '1.0.0',
      title: 't',
      severity: 'critical',
      issueType: 'keyboard',
      atAffected: null,
      description: 'd',
      fixStatus: 'open',
      workaround: null,
      versionRange: '*',
      fixedInVersion: null,
    })) as MatchedOssIssue[];
    expect(computeRiskScore(issues)).toBe(100);
  });

  it('returns 0 for empty', () => {
    expect(computeRiskScore([])).toBe(0);
  });
});
