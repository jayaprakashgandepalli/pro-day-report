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

    if (!payload) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const existing = await prisma.keyPerson.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Key person not found' }, { status: 404 });
    }

    const userRole = (payload.role || '').toUpperCase();
    if (userRole !== 'ADMIN' && userRole !== 'TELECALLER' && existing.employeeId !== payload.employeeId) {
      return NextResponse.json({ error: 'Forbidden: You can only edit your own key persons.' }, { status: 403 });
    }

    const data = await req.json();

    const updateData: any = {
      name: data.name !== undefined ? data.name.trim() : undefined,
      phone: data.phone !== undefined ? data.phone.trim() : undefined,
      designation: data.designation !== undefined ? (data.designation?.trim() || null) : undefined,
      schoolName: data.schoolName !== undefined ? (data.schoolName?.trim() || null) : undefined,
      schoolId: data.schoolId !== undefined ? (data.schoolId?.trim() || null) : undefined,
      district: data.district !== undefined ? data.district : undefined,
      mandal: data.mandal !== undefined ? data.mandal : undefined,
      village: data.village !== undefined ? data.village : undefined,
      address: data.address !== undefined ? (data.address?.trim() || null) : undefined,
      remarks: data.remarks !== undefined ? data.remarks : undefined,
    };

    if (userRole === 'TELECALLER') {
      updateData.telecallerUpdateAt = new Date();
      if (Array.isArray(data.remarks) && data.remarks.length > 0) {
        const lastRemark = data.remarks[data.remarks.length - 1];
        updateData.telecallerUpdateDetails = lastRemark.text || 'Added remarks';
      } else {
        updateData.telecallerUpdateDetails = 'Updated key person details';
      }
    }

    const updated = await prisma.keyPerson.update({
      where: { id },
      data: updateData,
      include: {
        employee: { select: { name: true, employeeId: true } }
      }
    });

    return NextResponse.json({ keyPerson: updated }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyToken(token) as { employeeId: string; role: string } | null;

    if (!payload) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const keyPerson = await prisma.keyPerson.findUnique({
      where: { id },
      include: {
        employee: { select: { name: true, employeeId: true } }
      }
    });

    if (!keyPerson) {
      return NextResponse.json({ error: 'Key person not found' }, { status: 404 });
    }

    const userRole = (payload.role || '').toUpperCase();
    if (userRole !== 'ADMIN' && userRole !== 'TELECALLER' && keyPerson.employeeId !== payload.employeeId) {
      return NextResponse.json({ error: 'Forbidden: You can only view your own key persons.' }, { status: 403 });
    }

    return NextResponse.json({ keyPerson }, { status: 200 });
  } catch (error) {
    console.error(error);
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

    if (!payload) {
      return NextResponse.json({ error: 'Forbidden. Only authorized users can delete.' }, { status: 403 });
    }

    const existing = await prisma.keyPerson.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Key person not found' }, { status: 404 });
    }

    const userRole = (payload.role || '').toUpperCase();
    if (userRole !== 'ADMIN' && existing.employeeId !== payload.employeeId) {
      return NextResponse.json({ error: 'Forbidden: You can only delete your own key persons.' }, { status: 403 });
    }

    await prisma.keyPerson.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
