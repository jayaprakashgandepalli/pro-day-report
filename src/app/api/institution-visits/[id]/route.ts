import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthToken, verifyToken } from '@/lib/auth';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const token = await getAuthToken(req, 'auth_token');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const payload = verifyToken(token) as { employeeId: string; role: string } | null;
    if (!payload) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const roleUpper = (payload.role || '').toUpperCase();
    const isAdmin = roleUpper === 'ADMIN' || roleUpper === 'SUPERADMIN';

    const existing = await prisma.institutionVisit.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Visit not found' }, { status: 404 });

    if (!isAdmin && existing.employeeId !== payload.employeeId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const {
      type,
      name,
      contactPerson,
      phone,
      village,
      mandal,
      district,
      address,
      studentsMetCount,
      visitDate,
      remarks,
    } = body;

    const updateData: any = {};
    if (type !== undefined) updateData.type = type.toUpperCase();
    if (name !== undefined) updateData.name = name.trim();
    if (contactPerson !== undefined) updateData.contactPerson = contactPerson?.trim() || null;
    if (phone !== undefined) updateData.phone = phone?.trim() || null;
    if (village !== undefined) updateData.village = village?.trim() || null;
    if (mandal !== undefined) updateData.mandal = mandal?.trim() || null;
    if (district !== undefined) updateData.district = district?.trim() || null;
    if (address !== undefined) updateData.address = address?.trim() || null;
    if (studentsMetCount !== undefined) {
      updateData.studentsMetCount = typeof studentsMetCount === 'number' ? studentsMetCount : parseInt(studentsMetCount || '0', 10) || 0;
    }
    if (visitDate !== undefined) updateData.visitDate = new Date(visitDate);
    if (remarks !== undefined) updateData.remarks = remarks?.trim() || null;

    const updated = await prisma.institutionVisit.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, visit: updated });
  } catch (error: any) {
    console.error('Error updating institution visit:', error);
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const token = await getAuthToken(req, 'auth_token');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const payload = verifyToken(token) as { employeeId: string; role: string } | null;
    if (!payload) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const roleUpper = (payload.role || '').toUpperCase();
    const isAdmin = roleUpper === 'ADMIN' || roleUpper === 'SUPERADMIN';

    const existing = await prisma.institutionVisit.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Visit not found' }, { status: 404 });

    if (!isAdmin && existing.employeeId !== payload.employeeId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.institutionVisit.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Visit deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting institution visit:', error);
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}
