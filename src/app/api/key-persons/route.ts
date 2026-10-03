import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyToken(token) as { employeeId: string; role: string } | null;

    if (!payload) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const district = searchParams.get('district') || '';
    const mandal = searchParams.get('mandal') || '';
    const village = searchParams.get('village') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {};
    if (payload.role !== 'ADMIN') {
      where.employeeId = payload.employeeId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } }
      ];
    }
    if (district) where.district = district;
    if (mandal) where.mandal = mandal;
    if (village) where.village = village;

    const [keyPersons, total] = await Promise.all([
      prisma.keyPerson.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          employee: {
            select: { name: true }
          }
        }
      }),
      prisma.keyPerson.count({ where })
    ]);

    return NextResponse.json({ keyPersons, total }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyToken(token) as { employeeId: string; role: string } | null;

    if (!payload) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const data = await req.json();

    if (!data.name || !data.phone) {
      return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 });
    }

    const newKeyPerson = await prisma.keyPerson.create({
      data: {
        name: data.name,
        phone: data.phone,
        designation: data.designation,
        district: data.district,
        mandal: data.mandal,
        village: data.village,
        address: data.address,
        employeeId: payload.employeeId
      }
    });

    return NextResponse.json({ keyPerson: newKeyPerson }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
