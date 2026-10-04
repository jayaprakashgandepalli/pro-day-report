import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyToken(token) as { employeeId: string; role: string } | null;

    if (!payload || (payload.role !== 'EMPLOYEE' && payload.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify ownership
    const existing = await prisma.relativeContact.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    if (payload.role !== 'ADMIN' && existing.employeeId !== payload.employeeId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { name, phone, occupation, village, mandal, district, relation } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    if (!phone || !phone.trim()) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }
    if (!village || !village.trim()) {
      return NextResponse.json({ error: 'Village is required' }, { status: 400 });
    }

    const updated = await prisma.relativeContact.update({
      where: { id },
      data: {
        name: name.trim(),
        phone: phone.trim(),
        occupation: occupation !== undefined ? (occupation?.trim() || null) : existing.occupation,
        village: village.trim(),
        mandal: mandal !== undefined ? (mandal?.trim() || null) : existing.mandal,
        district: district !== undefined ? (district?.trim() || null) : existing.district,
        relation: relation !== undefined ? (relation?.trim() || null) : existing.relation,
      }
    });

    return NextResponse.json({ 
      message: 'Relative contact updated successfully', 
      relative: updated 
    }, { status: 200 });

  } catch (error) {
    console.error('Error updating relative:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyToken(token) as { employeeId: string; role: string } | null;

    if (!payload || (payload.role !== 'EMPLOYEE' && payload.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify ownership
    const existing = await prisma.relativeContact.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    if (payload.role !== 'ADMIN' && existing.employeeId !== payload.employeeId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.relativeContact.delete({
      where: { id }
    });

    return NextResponse.json({ 
      message: 'Relative contact deleted successfully' 
    }, { status: 200 });

  } catch (error) {
    console.error('Error deleting relative:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
