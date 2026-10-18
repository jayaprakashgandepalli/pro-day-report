import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, getAuthToken } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const token = await getAuthToken(req, 'auth_token');

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyToken(token) as { employeeId: string; role: string } | null;

    if (!payload) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const district = searchParams.get('district') || '';
    const mandal = searchParams.get('mandal') || '';
    const village = searchParams.get('village') || '';
    const schoolName = searchParams.get('schoolName') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const userRole = (payload.role || '').toUpperCase();
    const where: any = {};
    if (userRole === 'ADMIN') {
      const empFilter = searchParams.get('employeeId');
      if (empFilter) where.employeeId = empFilter;
    } else if (userRole === 'TELECALLER') {
      const user = await prisma.user.findUnique({
        where: { employeeId: payload.employeeId },
        select: { assignedEmployees: true }
      });
      if (user && user.assignedEmployees && user.assignedEmployees.length > 0) {
        where.employeeId = { in: user.assignedEmployees };
      }
    } else {
      // Non-admin field employee: STRICT ISOLATION
      where.employeeId = payload.employeeId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { designation: { contains: search, mode: 'insensitive' } },
        { schoolName: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (schoolName) where.schoolName = schoolName;
    if (district) where.district = district;
    if (mandal) where.mandal = mandal;
    if (village) where.village = village;

    const [keyPersons, total, currentUser] = await Promise.all([
      prisma.keyPerson.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          employee: {
            select: { name: true, employeeId: true }
          }
        }
      }),
      prisma.keyPerson.count({ where }),
      prisma.user.findUnique({
        where: { employeeId: payload.employeeId },
        select: { name: true, employeeId: true }
      })
    ]);

    return NextResponse.json({ keyPersons, total, currentUser }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const token = await getAuthToken(req, 'auth_token');

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyToken(token) as { employeeId: string; role: string } | null;

    if (!payload) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const data = await req.json();

    if (!data.name || !data.phone) {
      return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 });
    }

    const newKeyPerson = await prisma.keyPerson.create({
      data: {
        name: data.name.trim(),
        phone: data.phone.trim(),
        designation: data.designation?.trim() || null,
        schoolName: data.schoolName?.trim() || null,
        schoolId: data.schoolId?.trim() || null,
        district: data.district || null,
        mandal: data.mandal || null,
        village: data.village || null,
        address: data.address?.trim() || null,
        employeeId: payload.employeeId
      }
    });

    return NextResponse.json({ keyPerson: newKeyPerson }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
