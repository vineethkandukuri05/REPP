import { describe, it, expect, beforeEach } from 'vitest';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { verifyGoogleIdToken, clearGoogleKeyCache, type KeyFetcher } from './googleAuth.js';

const CLIENT_ID = 'test-client.apps.googleusercontent.com';
const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const other = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const KID = 'test-key-1';

const fetcher: KeyFetcher = async () => ({
  keys: [{ ...(publicKey.export({ format: 'jwk' }) as crypto.JsonWebKey), kid: KID, alg: 'RS256', use: 'sig' } as any],
  maxAgeSeconds: 3600
});

function sign(payload: Record<string, unknown>, opts: { key?: crypto.KeyObject; kid?: string; expiresIn?: number } = {}) {
  return jwt.sign(
    { iss: 'https://accounts.google.com', aud: CLIENT_ID, sub: '1234567890', email: 'Person@Example.com', email_verified: true, name: 'Test Person', picture: 'https://example.com/p.png', ...payload },
    opts.key ?? privateKey,
    { algorithm: 'RS256', keyid: opts.kid ?? KID, expiresIn: opts.expiresIn ?? 600 }
  );
}

describe('verifyGoogleIdToken', () => {
  beforeEach(() => clearGoogleKeyCache());

  it('accepts a valid token and returns the profile', async () => {
    const p = await verifyGoogleIdToken(sign({}), CLIENT_ID, fetcher);
    expect(p).toEqual({ googleId: '1234567890', email: 'person@example.com', emailVerified: true, name: 'Test Person', picture: 'https://example.com/p.png' });
  });

  it('rejects a token for a different client ID (audience)', async () => {
    await expect(verifyGoogleIdToken(sign({ aud: 'someone-else' }), CLIENT_ID, fetcher)).rejects.toThrow(/could not be verified/);
  });

  it('rejects a token from another issuer', async () => {
    await expect(verifyGoogleIdToken(sign({ iss: 'https://evil.example.com' }), CLIENT_ID, fetcher)).rejects.toThrow(/could not be verified/);
  });

  it('rejects a token signed with a different key', async () => {
    await expect(verifyGoogleIdToken(sign({}, { key: other.privateKey }), CLIENT_ID, fetcher)).rejects.toThrow(/could not be verified/);
  });

  it('rejects an expired token', async () => {
    await expect(verifyGoogleIdToken(sign({}, { expiresIn: -120 }), CLIENT_ID, fetcher)).rejects.toThrow(/expired/);
  });

  it('rejects an unknown key id', async () => {
    await expect(verifyGoogleIdToken(sign({}, { kid: 'unknown' }), CLIENT_ID, fetcher)).rejects.toThrow(/unknown key/);
  });

  it('rejects garbage and missing configuration', async () => {
    await expect(verifyGoogleIdToken('not-a-token', CLIENT_ID, fetcher)).rejects.toThrow(/Invalid/);
    await expect(verifyGoogleIdToken(sign({}), '', fetcher)).rejects.toThrow(/not configured/);
  });
});
