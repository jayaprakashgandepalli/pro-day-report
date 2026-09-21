import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyToken(token) as { employeeId: string; role: string } | null;

    if (!payload || payload.role !== 'COLLEGE') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { applicationNumber } = await req.json();

    if (!applicationNumber || applicationNumber.trim() === '') {
      return NextResponse.json({ error: 'Application number is required.' }, { status: 400 });
    }

    const student = await prisma.student.findUnique({ where: { id } });
    if (!student) {
      return NextResponse.json({ error: 'Student not found.' }, { status: 404 });
    }
    
    if (student.joinedCollegeId) {
      return NextResponse.json({ error: 'Student is already admitted.' }, { status: 400 });
    }

    const updatedStudent = await prisma.student.update({
      where: { id },
      data: {
        leadStatus: 'Admitted',
        joinedCollegeId: payload.employeeId,
        applicationNumber: applicationNumber.trim(),
        admissionDate: new Date(),
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ message: 'Admission saved successfully', student: updatedStudent }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
