import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET all config values, grouped by type
export async function GET() {
  try {
    const configs = await prisma.configValue.findMany();
    
    return NextResponse.json({ configs }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST new config value (Admin only)
export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyToken(token) as { role: string } | null;
    
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = await req.json();
    const { type, value, parentId, strength, grade } = data;

    if (!type || !value) {
      return NextResponse.json({ error: 'Type and Value are required' }, { status: 400 });
    }

    const config = await prisma.configValue.create({
      data: {
        type,
        value,
        parentId: parentId || null,
        strength: strength ? parseInt(strength, 10) : 0,
        grade: grade || null,
      }
    });

    return NextResponse.json({ message: 'Config added', config }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
