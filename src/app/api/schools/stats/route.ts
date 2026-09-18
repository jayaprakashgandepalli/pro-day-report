import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const schoolName = searchParams.get('schoolName');

    if (!schoolName) {
      return NextResponse.json({ error: 'School name is required' }, { status: 400 });
    }

    const count = await prisma.student.count({
      where: {
        schoolName: schoolName
      }
    });

    return NextResponse.json({ collected: count }, { status: 200 });
  } catch (error) {
    console.error('Error fetching school stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
