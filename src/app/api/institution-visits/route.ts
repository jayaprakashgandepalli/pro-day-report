import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthToken, verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const token = await getAuthToken(req, 'auth_token');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const payload = verifyToken(token) as { employeeId: string; role: string } | null;
    if (!payload) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const roleUpper = (payload.role || '').toUpperCase();
    const isAdmin = roleUpper === 'ADMIN' || roleUpper === 'SUPERADMIN';

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const date = searchParams.get('date');
    const type = searchParams.get('type'); // 'SCHOOL', 'TUITION', etc.
    const search = searchParams.get('search')?.trim();
    const empIdParam = searchParams.get('employeeId');

    const where: any = {};

    if (!isAdmin) {
      where.employeeId = payload.employeeId;
    } else if (empIdParam) {
      where.employeeId = empIdParam;
    }

    if (type && type !== 'ALL') {
      where.type = type.toUpperCase();
    }

    if (startDate && endDate) {
      const s = new Date(startDate);
      s.setHours(0, 0, 0, 0);
      const e = new Date(endDate);
      e.setHours(23, 59, 59, 999);
      where.visitDate = { gte: s, lte: e };
    } else if (date) {
      const s = new Date(date);
      s.setHours(0, 0, 0, 0);
      const e = new Date(date);
      e.setHours(23, 59, 59, 999);
      where.visitDate = { gte: s, lte: e };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { contactPerson: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { village: { contains: search, mode: 'insensitive' } },
        { remarks: { contains: search, mode: 'insensitive' } },
      ];
    }

    const visits = await prisma.institutionVisit.findMany({
      where,
      orderBy: { visitDate: 'desc' },
    });

    return NextResponse.json({
      success: true,
      visits,
      total: visits.length,
    });
  } catch (error: any) {
    console.error('Error fetching institution visits:', error);
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const token = await getAuthToken(req, 'auth_token');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const payload = verifyToken(token) as { employeeId: string; role: string } | null;
    if (!payload) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

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

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Institution Name is required' }, { status: 400 });
    }

    const dateVal = visitDate ? new Date(visitDate) : new Date();

    const visit = await prisma.institutionVisit.create({
      data: {
        employeeId: payload.employeeId,
        type: (type || 'SCHOOL').toUpperCase(),
        name: name.trim(),
        contactPerson: contactPerson?.trim() || null,
        phone: phone?.trim() || null,
        village: village?.trim() || null,
        mandal: mandal?.trim() || null,
        district: district?.trim() || null,
        address: address?.trim() || null,
        studentsMetCount: typeof studentsMetCount === 'number' ? studentsMetCount : parseInt(studentsMetCount || '0', 10) || 0,
        visitDate: dateVal,
        remarks: remarks?.trim() || null,
      },
    });

    return NextResponse.json({ success: true, visit }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating institution visit:', error);
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}
