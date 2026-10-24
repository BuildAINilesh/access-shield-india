import { describe, expect, it } from 'vitest';
import { signInstallState, verifyInstallState } from './github-apply';

describe('github install state', () => {
  it('round-trips org id with HMAC state', () => {
    const secret = 'test-auth-secret-at-least-32-chars!!';
    const state = signInstallState('11111111-1111-1111-1111-111111111111', secret);
    const verified = verifyInstallState(state, secret);
    expect(verified?.orgId).toBe('11111111-1111-1111-1111-111111111111');
  });

  it('rejects tampered state', () => {
    const secret = 'test-auth-secret-at-least-32-chars!!';
    const state = signInstallState('11111111-1111-1111-1111-111111111111', secret);
    expect(verifyInstallState(state + 'x', secret)).toBeNull();
    expect(verifyInstallState(state, 'other-secret-xxxxxxxxxxxxxxxxxxxx')).toBeNull();
  });
});
