import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-fallback-key-for-local-dev';

export function signToken(payload: object) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export async function getAuthToken(req?: Request, cookieName: string = 'auth_token'): Promise<string | null> {
  // 1. Check Authorization header: Bearer <token>
  if (req) {
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
      return authHeader.substring(7).trim();
    }

    // 2. Check query param: ?token=... or ?auth_token=...
    try {
      const url = new URL(req.url);
      const queryToken = url.searchParams.get('token') || url.searchParams.get('auth_token');
      if (queryToken) return queryToken.trim();
    } catch (_) {}
  }

  // 3. Fallback to cookies for Next.js web application
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(cookieName)?.value;
    if (token) return token;
  } catch (_) {}

  return null;
}

