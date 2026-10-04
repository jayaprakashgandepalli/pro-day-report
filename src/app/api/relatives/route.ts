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
    const payload = verifyToken(token) as { employeeId: string; role: string } | null;

    if (!payload || (payload.role !== 'EMPLOYEE' && payload.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const mandal = searchParams.get('mandal');
    const village = searchParams.get('village');
    const search = searchParams.get('search')?.trim();

    const where: any = {};

    // Employees only see their own relatives
    if (payload.role === 'EMPLOYEE') {
      where.employeeId = payload.employeeId;
    }

    // Filter by mandal
    if (mandal && mandal !== 'ALL') {
      where.mandal = mandal;
    }

    // Filter by village
    if (village && village !== 'ALL') {
      where.village = village;
    }

    // Search by name, phone, or occupation
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { occupation: { contains: search, mode: 'insensitive' } },
        { relation: { contains: search, mode: 'insensitive' } },
      ];
    }

    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit');

    const total = await prisma.relativeContact.count({ where });

    let relatives;
    let pagination = null;

    if (pageParam || limitParam) {
      const page = Math.max(1, parseInt(pageParam || '1', 10));
      const limit = Math.max(1, Math.min(100, parseInt(limitParam || '10', 10)));
      const skip = (page - 1) * limit;

      relatives = await prisma.relativeContact.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          employee: {
            select: { name: true, employeeId: true }
          }
        }
      });

      pagination = {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        hasMore: page * limit < total
      };
    } else {
      relatives = await prisma.relativeContact.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          employee: {
            select: { name: true, employeeId: true }
          }
        }
      });
    }

    return NextResponse.json({ 
      relatives, 
      total,
      pagination 
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching relatives:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyToken(token) as { employeeId: string; role: string } | null;

    if (!payload || (payload.role !== 'EMPLOYEE' && payload.role !== 'ADMIN')) {
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

    // Auto-detect mandal and district from hierarchy if not provided
    let finalMandal = mandal?.trim() || null;
    let finalDistrict = district?.trim() || null;

    if (!finalMandal || !finalDistrict) {
      const vConfig = await prisma.configValue.findFirst({
        where: { OR: [{ id: village.trim() }, { value: village.trim(), type: 'VILLAGE' }] },
        include: { parent: { include: { parent: true } } }
      });
      if (vConfig?.parent) {
        if (!finalMandal) finalMandal = vConfig.parent.id;
        if (!finalDistrict && vConfig.parent.parent) finalDistrict = vConfig.parent.parent.id;
      }
    }

    const relative = await prisma.relativeContact.create({
      data: {
        name: name.trim(),
        phone: phone.trim(),
        occupation: occupation?.trim() || null,
        village: village.trim(),
        mandal: finalMandal,
        district: finalDistrict,
        relation: relation?.trim() || null,
        employeeId: payload.employeeId
      }
    });

    return NextResponse.json({ 
      message: 'Relative contact added successfully', 
      relative 
    }, { status: 201 });

  } catch (error) {
    console.error('Error adding relative:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
