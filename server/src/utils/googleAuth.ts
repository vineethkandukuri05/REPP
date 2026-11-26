/**
 * Verifies Google Identity Services ID tokens on the server.
 *
 * The browser receives a signed JWT ("credential") from Google. We check it here
 * against Google's published public keys, so a forged or tampered token is rejected.
 * No client secret is involved: ID-token verification only needs the public keys
 * and our OAuth client ID (the expected audience).
 */
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const GOOGLE_CERTS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
const VALID_ISSUERS = ['accounts.google.com', 'https://accounts.google.com'];

export interface GoogleProfile {
  googleId: string;
  email: string;
  emailVerified: boolean;
  name: string | null;
  picture: string | null;
}

export class GoogleAuthError extends Error {
  status = 401;
}

type Jwk = crypto.JsonWebKey & { kid?: string };
export type KeyFetcher = () => Promise<{ keys: Jwk[]; maxAgeSeconds: number }>;

async function fetchGoogleKeys(): Promise<{ keys: Jwk[]; maxAgeSeconds: number }> {
  const res = await fetch(GOOGLE_CERTS_URL, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error(`Could not fetch Google signing keys (HTTP ${res.status})`);
  const body = (await res.json()) as { keys: Jwk[] };
  const maxAge = Number(/max-age=(\d+)/.exec(res.headers.get('cache-control') || '')?.[1] ?? 3600);
  return { keys: body.keys, maxAgeSeconds: maxAge };
}

let cache: { keys: Map<string, crypto.KeyObject>; expiresAt: number } | null = null;

async function getKey(kid: string, fetcher: KeyFetcher, forceRefresh = false): Promise<crypto.KeyObject | null> {
  if (forceRefresh || !cache || Date.now() > cache.expiresAt) {
    const { keys, maxAgeSeconds } = await fetcher();
    const map = new Map<string, crypto.KeyObject>();
    for (const k of keys) {
      if (k.kid) map.set(k.kid, crypto.createPublicKey({ key: k, format: 'jwk' }));
    }
    cache = { keys: map, expiresAt: Date.now() + Math.max(60, maxAgeSeconds) * 1000 };
  }
  return cache.keys.get(kid) ?? null;
}

/** Test hook: drop cached keys. */
export function clearGoogleKeyCache(): void {
  cache = null;
}

export async function verifyGoogleIdToken(
  idToken: string,
  clientId: string,
  fetcher: KeyFetcher = fetchGoogleKeys
): Promise<GoogleProfile> {
  if (!clientId) throw new GoogleAuthError('Google sign-in is not configured on this server.');
  if (typeof idToken !== 'string' || idToken.split('.').length !== 3) throw new GoogleAuthError('Invalid Google credential.');

  const decoded = jwt.decode(idToken, { complete: true });
  const kid = decoded && typeof decoded === 'object' ? decoded.header.kid : undefined;
  if (!kid || decoded?.header.alg !== 'RS256') throw new GoogleAuthError('Invalid Google credential.');

  // Google rotates keys; if the kid is unknown, refresh once before giving up.
  let key = await getKey(kid, fetcher);
  if (!key) key = await getKey(kid, fetcher, true);
  if (!key) throw new GoogleAuthError('Google credential was signed with an unknown key.');

  let payload: jwt.JwtPayload;
  try {
    payload = jwt.verify(idToken, key, {
      algorithms: ['RS256'],
      audience: clientId,
      issuer: VALID_ISSUERS as [string, ...string[]],
      clockTolerance: 30
    }) as jwt.JwtPayload;
  } catch (err: any) {
    const reason = err?.name === 'TokenExpiredError' ? 'Your Google sign-in expired. Please try again.' : 'Google credential could not be verified.';
    throw new GoogleAuthError(reason);
  }

  if (!payload.sub || typeof payload.email !== 'string') throw new GoogleAuthError('Google account did not provide an email address.');

  return {
    googleId: String(payload.sub),
    email: payload.email.toLowerCase(),
    emailVerified: payload.email_verified === true || payload.email_verified === 'true',
    name: typeof payload.name === 'string' ? payload.name : null,
    picture: typeof payload.picture === 'string' ? payload.picture : null
  };
}
