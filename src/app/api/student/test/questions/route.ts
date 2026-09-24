import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getStudentSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getStudentSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Check if student profile is complete (e.g., district and schoolName must be filled)
    const student = await prisma.student.findUnique({
      where: { id: session.id },
      select: { district: true, schoolName: true }
    });

    if (!student || !student.district || !student.schoolName) {
      return NextResponse.json({ profileIncomplete: true });
    }

    // Check if they already took the test
    const report = await prisma.assessmentReport.findUnique({
      where: { studentId: session.id }
    });

    if (report) {
      return NextResponse.json({ alreadyTaken: true });
    }

    // Fetch questions and options
    const questions = await prisma.question.findMany({
      where: { isActive: true },
      orderBy: [
        { module: 'asc' },
        { order: 'asc' }
      ],
      select: {
        id: true,
        text: true,
        module: true,
        options: {
          select: { id: true, text: true }
        }
      }
    });

    return NextResponse.json({ questions });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
  }
}
