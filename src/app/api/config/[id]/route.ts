import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyToken(token) as { role: string } | null;
    
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete children first (if it's a district/mandal)
    await prisma.configValue.deleteMany({
      where: { parentId: id }
    });

    await prisma.configValue.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Config deleted' }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyToken(token) as { role: string } | null;
    
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = await req.json();
    const { value, strength, grade } = data;

    if (!value) {
      return NextResponse.json({ error: 'Value is required' }, { status: 400 });
    }

    const updated = await prisma.configValue.update({
      where: { id },
      data: {
        value,
        strength: strength !== undefined ? parseInt(strength, 10) : undefined,
        grade: grade !== undefined ? grade : undefined,
      }
    });

    return NextResponse.json({ message: 'Config updated', config: updated }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
