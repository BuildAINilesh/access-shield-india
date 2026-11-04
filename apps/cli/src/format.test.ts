import { describe, expect, it } from 'vitest';
import { exitCodeForScan } from './format.js';
import type { OssScanResult } from './api.js';

const base: OssScanResult = {
  issues: [],
  riskScore: 0,
  scannedPackageCount: 1,
  matchedPackageCount: 0,
};

describe('exitCodeForScan', () => {
  it('returns 0 when fail-on unset', () => {
    expect(
      exitCodeForScan(
        {
          ...base,
          issues: [
            {
              anId: 'AN-1',
              packageName: 'x',
              installedVersion: '1',
              title: 't',
              severity: 'critical',
              issueType: 'keyboard',
              atAffected: null,
              description: 'd',
              fixStatus: 'open',
              workaround: null,
              versionRange: '*',
              fixedInVersion: null,
            },
          ],
        },
        undefined,
      ),
    ).toBe(0);
  });

  it('fails on high when critical present', () => {
    expect(
      exitCodeForScan(
        {
          ...base,
          issues: [
            {
              anId: 'AN-1',
              packageName: 'x',
              installedVersion: '1',
              title: 't',
              severity: 'critical',
              issueType: 'keyboard',
              atAffected: null,
              description: 'd',
              fixStatus: 'open',
              workaround: null,
              versionRange: '*',
              fixedInVersion: null,
            },
          ],
        },
        'high',
      ),
    ).toBe(1);
  });

  it('passes when only low and fail-on=high', () => {
    expect(
      exitCodeForScan(
        {
          ...base,
          issues: [
            {
              anId: 'AN-1',
              packageName: 'x',
              installedVersion: '1',
              title: 't',
              severity: 'low',
              issueType: 'name',
              atAffected: null,
              description: 'd',
              fixStatus: 'open',
              workaround: null,
              versionRange: '*',
              fixedInVersion: null,
            },
          ],
        },
        'high',
      ),
    ).toBe(0);
  });
});
