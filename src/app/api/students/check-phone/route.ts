import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { normalizePhoneNumber } from '@/lib/phone';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyToken(token);
    
    if (!payload) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const rawPhone = searchParams.get('phone');

    if (!rawPhone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    const cleanPhone = normalizePhoneNumber(rawPhone);
    if (!cleanPhone || cleanPhone.length < 10) {
      return NextResponse.json({ exists: false }, { status: 200 });
    }

    const student = await prisma.student.findFirst({
      where: {
        OR: [
          { phone: cleanPhone },
          { phone: `+91 ${cleanPhone}` },
          { phone: `+91${cleanPhone}` },
          { phone: { contains: cleanPhone } }
        ]
      }
    });

    return NextResponse.json({ exists: !!student }, { status: 200 });
  } catch (error) {
    console.error('Error checking phone:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
