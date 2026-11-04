/**
 * AES-256-GCM encryption for journey credentials (AN-F003).
 * Key: JOURNEY_CREDENTIALS_KEY (64 hex chars) or SHA-256(AUTH_SECRET).
 */

import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

function getKey(): Buffer {
  const raw = process.env.JOURNEY_CREDENTIALS_KEY?.trim();
  if (raw && /^[0-9a-fA-F]{64}$/.test(raw)) {
    return Buffer.from(raw, 'hex');
  }
  const fallback = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!fallback) {
    throw new Error('JOURNEY_CREDENTIALS_KEY or AUTH_SECRET required to encrypt journey credentials');
  }
  return createHash('sha256').update(fallback).digest();
}

export interface EncryptedBlob {
  ciphertext: string;
  iv: string;
  authTag: string;
}

export function encryptCredentials(payload: Record<string, string>): EncryptedBlob {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', getKey(), iv);
  const json = JSON.stringify(payload);
  const encrypted = Buffer.concat([cipher.update(json, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return {
    ciphertext: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
  };
}

export function decryptCredentials(blob: EncryptedBlob): Record<string, string> {
  const decipher = createDecipheriv('aes-256-gcm', getKey(), Buffer.from(blob.iv, 'base64'));
  decipher.setAuthTag(Buffer.from(blob.authTag, 'base64'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(blob.ciphertext, 'base64')),
    decipher.final(),
  ]);
  const parsed = JSON.parse(decrypted.toString('utf8')) as Record<string, string>;
  return parsed;
}
