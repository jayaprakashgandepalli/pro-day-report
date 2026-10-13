import { NextResponse } from 'next/server';
import { verifyToken, getAuthToken } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const token = await getAuthToken(req, 'auth_token');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ user: payload }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
