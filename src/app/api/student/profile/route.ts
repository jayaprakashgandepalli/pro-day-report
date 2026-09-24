import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getStudentSession } from '@/lib/session';

export async function GET() {
  try {
    const session = await getStudentSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const student = await prisma.student.findUnique({
      where: { id: session.id },
      select: {
        studentName: true,
        fatherName: true,
        phone: true,
        whatsapp: true,
        gender: true,
        occupation: true,
        group: true,
        district: true,
        mandal: true,
        village: true,
        address: true,
        schoolName: true,
        marks: true,
        studyInterestedAt: true,
        educationStage: true,
        ableToBearFee: true,
      }
    });

    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

    return NextResponse.json({ student });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getStudentSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const data = await req.json();

    const updatedStudent = await prisma.student.update({
      where: { id: session.id },
      data: {
        studentName: data.studentName,
        fatherName: data.fatherName,
        gender: data.gender,
        occupation: data.occupation,
        whatsapp: data.whatsapp,
        group: data.group,
        district: data.district,
        mandal: data.mandal,
        village: data.village,
        address: data.address,
        schoolName: data.schoolName,
        marks: data.marks,
        studyInterestedAt: data.studyInterestedAt,
        educationStage: data.educationStage,
        ableToBearFee: data.ableToBearFee,
      }
    });

    return NextResponse.json({ success: true, student: updatedStudent });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
