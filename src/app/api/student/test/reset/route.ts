import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getStudentSession } from '@/lib/session';

export async function POST() {
  try {
    const session = await getStudentSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Delete the final report
    await prisma.assessmentReport.deleteMany({
      where: { studentId: session.id }
    });

    // Delete all answers given by the student
    await prisma.studentTestResponse.deleteMany({
      where: { studentId: session.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reset Test Error:', error);
    return NextResponse.json({ error: 'Failed to reset test' }, { status: 500 });
  }
}
