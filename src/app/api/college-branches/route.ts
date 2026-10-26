import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const branches = await prisma.collegeBranch.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { students: true }
        }
      }
    });

    return NextResponse.json({ success: true, branches }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching college branches:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, code, location, phone } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ success: false, error: 'Branch name is required' }, { status: 400 });
    }

    const branch = await prisma.collegeBranch.create({
      data: {
        name: name.trim(),
        code: code && typeof code === 'string' && code.trim() ? code.trim() : null,
        location: location && typeof location === 'string' && location.trim() ? location.trim() : null,
        phone: phone && typeof phone === 'string' && phone.trim() ? phone.trim() : null,
      }
    });

    return NextResponse.json({ success: true, branch }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating college branch:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ success: false, error: 'A branch with this code already exists' }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}
