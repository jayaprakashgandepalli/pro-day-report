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

    // Check for existing phone number
    const existingStudent = await prisma.student.findFirst({
      where: { phone: data.phone }
    });

    if (existingStudent) {
      return NextResponse.json({ error: 'Student with this phone number already exists.' }, { status: 400 });
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
        district: data.district || null,
        mandal: data.mandal || null,
        village: data.village || null,
        studyInterestedAt: data.studyInterestedAt || null,
        ableToBearFee: data.ableToBearFee || null,
        doorstepCompleted: data.doorstepCompleted ? true : false,
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

    if (!payload || !payload.employeeId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const search = searchParams.get('search');
    const interest = searchParams.get('interest');
    const fee = searchParams.get('fee');
    const location = searchParams.get('location');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    let whereClause: any = {};

    // If EMPLOYEE, only show their own students
    if (payload.role === 'EMPLOYEE') {
      whereClause.employeeId = payload.employeeId;
    }

    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (startDate && endDate) {
      const startOfDay = new Date(startDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      whereClause.createdAt = {
        gte: startOfDay,
        lte: endOfDay,
      };
    } else if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      whereClause.createdAt = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    if (search) {
      whereClause.OR = [
        { studentName: { contains: search } },
        { phone: { contains: search } }
      ];
    }

    if (interest) whereClause.studyInterestedAt = interest;
    if (fee) whereClause.ableToBearFee = fee;

    if (location) {
      whereClause.OR = [
        ...(whereClause.OR || []),
        { district: location },
        { mandal: location },
        { village: location }
      ];
    }

    const total = await prisma.student.count({ where: whereClause });

    const students = await prisma.student.findMany({
      where: whereClause,
      include: { employee: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json({ students, total, page, limit }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
