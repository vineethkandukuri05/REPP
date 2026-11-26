import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { config } from '../config.js';
import { serializeProfile } from '../utils/profileSerializer.js';
import { verifyGoogleIdToken, GoogleAuthError } from '../utils/googleAuth.js';

const prisma = new PrismaClient();

const registerSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().optional()
});

const loginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(1, 'Password is required')
});

/** What the client is allowed to see about the account. */
function publicUser(user: { id: string; email: string; passwordHash: string | null; googleId: string | null; avatarUrl: string | null }, name?: string | null) {
  return {
    id: user.id,
    email: user.email,
    name: name || null,
    avatarUrl: user.avatarUrl,
    hasPassword: Boolean(user.passwordHash),
    googleLinked: Boolean(user.googleId),
    isDemo: Boolean(config.demoEmail) && user.email === config.demoEmail
  };
}

function createToken(userId: string, email: string, visitorId?: string): string {
  return jwt.sign({ userId, email, ...(visitorId ? { visitorId } : {}) }, config.jwtSecret, { expiresIn: '7d' });
}

function setAuthCookie(res: Response, token: string): void {
  res.cookie('repp_token', token, {
    httpOnly: true,
    // In production the site and API are on different domains, so the cookie must be cross-site.
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
}

export async function register(req: Request, res: Response): Promise<void> {
  const parsed = registerSchema.parse(req.body);
  const email = parsed.email.toLowerCase();
  const { password, name } = parsed;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(400).json({
      error: existing.passwordHash
        ? 'An account with this email already exists'
        : 'This email is already registered with Google. Use "Continue with Google" to sign in.'
    });
    return;
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      profile: {
        create: {
          name: name || email.split('@')[0],
          isOnboarded: false
        }
      }
    },
    include: { profile: true }
  });

  const token = createToken(user.id, user.email);
  setAuthCookie(res, token);

  res.status(201).json({
    user: publicUser(user, user.profile?.name),
    profile: serializeProfile(user.profile),
    token
  });
}

export async function login(req: Request, res: Response): Promise<void> {
  const parsed = loginSchema.parse(req.body);
  const email = parsed.email.toLowerCase();
  const { password } = parsed;

  const user = await prisma.user.findUnique({
    where: { email },
    include: { profile: true }
  });

  if (!user) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  if (!user.passwordHash) {
    res.status(401).json({ error: 'This account uses Google sign-in. Click "Continue with Google" below.' });
    return;
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  const token = createToken(user.id, user.email);
  setAuthCookie(res, token);

  res.json({
    user: publicUser(user, user.profile?.name),
    profile: serializeProfile(user.profile),
    token
  });
}

/** "Try the demo": sign straight into the shared demo account, no password needed. */
export async function demoLogin(_req: Request, res: Response): Promise<void> {
  const user = config.demoEmail
    ? await prisma.user.findUnique({ where: { email: config.demoEmail }, include: { profile: true } })
    : null;
  if (!user) {
    res.status(404).json({ error: 'The demo account is not available right now.' });
    return;
  }

  // A fresh visitor id per click keeps each visitor's Ask REPP chat private.
  const token = createToken(user.id, user.email, crypto.randomUUID());
  setAuthCookie(res, token);

  res.json({
    user: publicUser(user, user.profile?.name),
    profile: serializeProfile(user.profile),
    token
  });
}

export async function logout(_req: Request, res: Response): Promise<void> {
  res.clearCookie('repp_token');
  res.json({ message: 'Logged out successfully' });
}

export async function getCurrentUser(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    include: { profile: true }
  });

  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  res.json({
    user: publicUser(user, user.profile?.name),
    profile: serializeProfile(user.profile)
  });
}

/** Public auth settings for the login page (the Google client ID is not a secret). */
export async function getAuthConfig(_req: Request, res: Response): Promise<void> {
  res.json({ googleEnabled: Boolean(config.googleClientId), googleClientId: config.googleClientId || null });
}

const googleSchema = z.object({ credential: z.string().min(20, 'Missing Google credential') });

/**
 * Sign in or sign up with a Google ID token from Google Identity Services.
 * - Existing Google-linked user  -> signed in.
 * - Existing email/password user -> Google is linked to that same account (no duplicate).
 * - New email                    -> account + profile created, then onboarding.
 */
export async function googleLogin(req: Request, res: Response): Promise<void> {
  const { credential } = googleSchema.parse(req.body);

  let google;
  try {
    google = await verifyGoogleIdToken(credential, config.googleClientId);
  } catch (err: any) {
    if (err instanceof GoogleAuthError) {
      res.status(config.googleClientId ? 401 : 503).json({ error: err.message });
      return;
    }
    console.error('Google sign-in verification failed:', err.message);
    res.status(502).json({ error: 'Could not reach Google to verify your sign-in. Please try again.' });
    return;
  }

  if (!google.emailVerified) {
    res.status(401).json({ error: 'Your Google email address is not verified. Verify it with Google and try again.' });
    return;
  }

  let user = await prisma.user.findUnique({ where: { googleId: google.googleId }, include: { profile: true } });
  let isNewUser = false;

  if (!user) {
    const byEmail = await prisma.user.findUnique({ where: { email: google.email }, include: { profile: true } });
    if (byEmail) {
      if (byEmail.googleId && byEmail.googleId !== google.googleId) {
        res.status(409).json({ error: 'This email is linked to a different Google account.' });
        return;
      }
      // Same verified email: link Google to the existing account instead of creating a duplicate.
      user = await prisma.user.update({
        where: { id: byEmail.id },
        data: { googleId: google.googleId, avatarUrl: byEmail.avatarUrl ?? google.picture },
        include: { profile: true }
      });
    } else {
      user = await prisma.user.create({
        data: {
          email: google.email,
          passwordHash: null,
          googleId: google.googleId,
          avatarUrl: google.picture,
          profile: { create: { name: google.name || google.email.split('@')[0], isOnboarded: false } }
        },
        include: { profile: true }
      });
      isNewUser = true;
    }
  } else if (google.picture && user.avatarUrl !== google.picture) {
    // Keep the profile picture current.
    user = await prisma.user.update({ where: { id: user.id }, data: { avatarUrl: google.picture }, include: { profile: true } });
  }

  const token = createToken(user.id, user.email);
  setAuthCookie(res, token);

  res.status(isNewUser ? 201 : 200).json({
    user: publicUser(user, user.profile?.name),
    profile: serializeProfile(user.profile),
    isNewUser
  });
}
