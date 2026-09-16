import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token) as { employeeId: string } | null;

    if (!payload || !payload.employeeId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();

    if (!data.studentName || !data.phone || !data.group) {
      return NextResponse.json({ error: 'Student Name, Phone, and Group are required.' }, { status: 400 });
    }

    const newStudent = await prisma.student.create({
      data: {
        employeeId: payload.employeeId,
        studentName: data.studentName,
        fatherName: data.fatherName || null,
        occupation: data.occupation || null,
        address: data.address || null,
        phone: data.phone,
        whatsapp: data.whatsapp || null,
        group: data.group,
        visitNumber: data.visitNumber || null,
        schoolName: data.schoolName || null,
        schoolArea: data.schoolArea || null,
        remarks: data.remarks || null,
      },
    });

    return NextResponse.json({ message: 'Student added successfully', student: newStudent }, { status: 201 });
  } catch (error) {
    console.error('Add student error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token) as { employeeId: string; role: string } | null;

    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(req.url);
    const dateParam = url.searchParams.get('date');

    const whereClause: any = {};

    // Only employees see their own. Admins/Team Leaders can see all (or assigned).
    if (payload.role === 'EMPLOYEE') {
      whereClause.employeeId = payload.employeeId;
    }

    if (dateParam) {
      const startDate = new Date(dateParam);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(dateParam);
      endDate.setHours(23, 59, 59, 999);
      
      whereClause.createdAt = {
        gte: startDate,
        lte: endDate,
      };
    }

    const students = await prisma.student.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ students }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
