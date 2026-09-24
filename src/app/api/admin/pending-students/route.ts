import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const students = await prisma.student.findMany({
      where: {
        registrationStatus: 'PENDING',
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        studentName: true,
        phone: true,
        schoolName: true,
        createdAt: true,
      }
    });

    const employees = await prisma.user.findMany({
      where: { role: 'EMPLOYEE' },
      select: { employeeId: true, name: true },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({ students, employees });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
