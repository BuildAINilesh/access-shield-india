import { describe, expect, it } from 'vitest';
import { signPayload } from './webhooks';

describe('webhooks', () => {
  it('signs payloads with HMAC-SHA256', () => {
    const sig = signPayload('test-secret', '{"event":"scan.completed"}');
    expect(sig).toMatch(/^[a-f0-9]{64}$/);
    expect(signPayload('test-secret', '{"event":"scan.completed"}')).toBe(sig);
    expect(signPayload('other', '{"event":"scan.completed"}')).not.toBe(sig);
  });
});
