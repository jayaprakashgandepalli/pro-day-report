import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyToken(token) as { employeeId: string; role: string } | null;

    // Allow TELECALLER, ADMIN, or the EMPLOYEE who owns it (for simplicity, we'll just check if logged in for now, ideally restrict based on role)
    if (!payload) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = await req.json();

    const currentStudent = await prisma.student.findUnique({ where: { id } });

    if (data.phone && currentStudent && data.phone !== currentStudent.phone) {
      const existingStudent = await prisma.student.findFirst({
        where: { phone: data.phone }
      });
      if (existingStudent) {
        return NextResponse.json({ error: 'Student with this phone number already exists.' }, { status: 400 });
      }
    }

    const nextFollowUpDate = data.nextFollowUpType === 'Date' && data.nextFollowUpDate ? new Date(data.nextFollowUpDate) : (data.nextFollowUpType && data.nextFollowUpType !== 'Date' ? null : undefined);

    const updateData = {
      studentName: data.studentName !== undefined ? data.studentName : undefined,
      gender: data.gender !== undefined ? data.gender : undefined,
      fatherName: data.fatherName !== undefined ? data.fatherName : undefined,
      occupation: data.occupation !== undefined ? data.occupation : undefined,
      address: data.address !== undefined ? data.address : undefined,
      phone: data.phone !== undefined ? data.phone : undefined,
      whatsapp: data.whatsapp !== undefined ? data.whatsapp : undefined,
      group: data.group !== undefined ? data.group : undefined,
      visitNumber: data.visitNumber !== undefined ? data.visitNumber : undefined,
      schoolName: data.schoolName !== undefined ? data.schoolName : undefined,
      schoolArea: data.schoolArea !== undefined ? data.schoolArea : undefined,
      district: data.district !== undefined ? data.district : undefined,
      mandal: data.mandal !== undefined ? data.mandal : undefined,
      village: data.village !== undefined ? data.village : undefined,
      studyInterestedAt: data.studyInterestedAt !== undefined ? data.studyInterestedAt : undefined,
      educationStage: data.educationStage !== undefined ? data.educationStage : undefined,
      ableToBearFee: data.ableToBearFee !== undefined ? data.ableToBearFee : undefined,
      doorstepCompleted: data.doorstepCompleted !== undefined ? data.doorstepCompleted : undefined,
      leadStatus: data.leadStatus !== undefined ? data.leadStatus : undefined,
      remarks: data.remarks !== undefined ? data.remarks : undefined,
      nextFollowUpType: data.nextFollowUpType !== undefined ? data.nextFollowUpType : undefined,
      nextFollowUpDate,
    };

    const transactionTasks = [];
    
    // Add student update task
    transactionTasks.push(
      prisma.student.update({
        where: { id },
        data: updateData
      })
    );

    // If remarks changed, create a visit record to count it for the user
    if (data.remarks !== undefined && data.remarks !== currentStudent?.remarks) {
      transactionTasks.push(
        prisma.visit.create({
          data: {
            studentId: id,
            addedById: payload.employeeId,
            visitDate: new Date(),
            remarks: data.remarks,
            nextFollowUpDate: nextFollowUpDate !== undefined ? nextFollowUpDate : currentStudent?.nextFollowUpDate,
            nextFollowUpType: data.nextFollowUpType !== undefined ? data.nextFollowUpType : currentStudent?.nextFollowUpType,
          }
        })
      );
    }

    const results = await prisma.$transaction(transactionTasks);
    const student = results[0];

    return NextResponse.json({ message: 'Student updated', student }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const student = await prisma.student.findUnique({
      where: { id }
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    return NextResponse.json({ student }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
