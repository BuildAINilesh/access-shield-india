import { describe, expect, it } from 'vitest';
import { decryptCredentials, encryptCredentials } from './journey-crypto';

describe('journey-crypto', () => {
  it('round-trips credential bags', () => {
    process.env.AUTH_SECRET = 'test-auth-secret-for-journey-crypto-32b';
    const blob = encryptCredentials({ username: 'user@example.com', password: 's3cret' });
    expect(blob.ciphertext).toBeTruthy();
    const plain = decryptCredentials(blob);
    expect(plain.username).toBe('user@example.com');
    expect(plain.password).toBe('s3cret');
  });
});
