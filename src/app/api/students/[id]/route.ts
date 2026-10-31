import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, getAuthToken } from '@/lib/auth';
import { normalizePhoneNumber } from '@/lib/phone';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const token = await getAuthToken(req, 'auth_token');

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyToken(token) as { employeeId: string; role: string } | null;

    // Allow TELECALLER, ADMIN, or the EMPLOYEE who owns it (for simplicity, we'll just check if logged in for now, ideally restrict based on role)
    if (!payload) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = await req.json();

    const currentStudent = await prisma.student.findUnique({ where: { id } });
    if (!currentStudent) {
      return NextResponse.json({ error: 'Student not found.' }, { status: 404 });
    }

    const userRole = (payload.role || '').toUpperCase();
    if (userRole !== 'ADMIN' && userRole !== 'TELECALLER' && userRole !== 'COLLEGE') {
      if (currentStudent.employeeId !== payload.employeeId) {
        return NextResponse.json({ error: 'Forbidden: You can only edit your own students.' }, { status: 403 });
      }
    }

    const cleanPhone = data.phone !== undefined ? normalizePhoneNumber(data.phone) : undefined;
    const cleanWhatsapp = data.whatsapp !== undefined ? (data.whatsapp ? normalizePhoneNumber(data.whatsapp) : null) : undefined;

    if (cleanPhone && currentStudent && cleanPhone !== normalizePhoneNumber(currentStudent.phone)) {
      const existingStudent = await prisma.student.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [
                { phone: cleanPhone },
                { phone: `+91 ${cleanPhone}` },
                { phone: `+91${cleanPhone}` },
                { phone: { contains: cleanPhone } }
              ]
            }
          ]
        }
      });
      if (existingStudent) {
        return NextResponse.json({ error: 'Student with this phone number already exists.' }, { status: 400 });
      }
    }

    const nextFollowUpDate = data.nextFollowUpType === 'Date' && data.nextFollowUpDate ? new Date(data.nextFollowUpDate) : (data.nextFollowUpType && data.nextFollowUpType !== 'Date' ? null : undefined);

    const updateData: any = {
      studentName: data.studentName !== undefined ? data.studentName : undefined,
      gender: data.gender !== undefined ? data.gender : undefined,
      fatherName: data.fatherName !== undefined ? data.fatherName : undefined,
      occupation: data.occupation !== undefined ? data.occupation : undefined,
      address: data.address !== undefined ? data.address : undefined,
      phone: cleanPhone !== undefined ? cleanPhone : undefined,
      whatsapp: cleanWhatsapp !== undefined ? cleanWhatsapp : undefined,
      group: data.group !== undefined ? data.group : undefined,
      visitNumber: data.visitNumber !== undefined ? data.visitNumber : undefined,
      schoolName: data.schoolName !== undefined ? data.schoolName : undefined,
      schoolArea: data.schoolArea !== undefined ? data.schoolArea : undefined,
      marks: data.marks !== undefined ? data.marks : undefined,
      district: data.district !== undefined ? data.district : undefined,
      mandal: data.mandal !== undefined ? data.mandal : undefined,
      village: data.village !== undefined ? data.village : undefined,
      studyInterestedAt: data.studyInterestedAt !== undefined ? data.studyInterestedAt : undefined,
      educationStage: data.educationStage !== undefined ? data.educationStage : undefined,
      doorstepCompleted: (data.doorstepCompleted === true || currentStudent.doorstepCompleted === true)
        ? true
        : (data.doorstepCompleted !== undefined ? data.doorstepCompleted : undefined),
      joinedCollegeId: data.joinedCollegeId !== undefined ? data.joinedCollegeId : undefined,
      collegeBranchId: data.collegeBranchId !== undefined ? data.collegeBranchId : (data.joinedCollegeId !== undefined ? data.joinedCollegeId : undefined),
      applicationNumber: data.applicationNumber !== undefined ? data.applicationNumber : undefined,
      admissionDate: data.admissionDate !== undefined ? (data.admissionDate ? new Date(data.admissionDate) : null) : (data.leadStatus === 'Admitted' ? new Date() : undefined),
      studentPhoto: data.studentPhoto !== undefined ? data.studentPhoto : undefined,
      applicationPhoto: data.applicationPhoto !== undefined ? data.applicationPhoto : undefined,
      leadStatus: data.leadStatus !== undefined ? data.leadStatus : undefined,
      remarks: data.remarks !== undefined ? data.remarks : undefined,
      nextFollowUpType: data.nextFollowUpType !== undefined ? data.nextFollowUpType : undefined,
      nextFollowUpDate,
    };

    if (payload.role === 'TELECALLER') {
      updateData.telecallerUpdateAt = new Date();
      
      let details = 'Updated details';
      if (data.remarks) {
        details = data.remarks;
      } else if (data.nextFollowUpDate || data.nextFollowUpType) {
        const dateStr = data.nextFollowUpDate ? new Date(data.nextFollowUpDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
        details = `Follow-up set${dateStr ? `: ${dateStr}` : ''} (${data.nextFollowUpType || 'Date'})`;
      } else if (data.leadStatus) {
        details = `Status changed to ${data.leadStatus}`;
      }
      
      updateData.telecallerUpdateDetails = details;
    }

    if (userRole === 'ADMIN' && data.employeeId && data.employeeId !== currentStudent.employeeId) {
      const targetUser = await prisma.user.findUnique({
        where: { employeeId: data.employeeId }
      });
      if (!targetUser) {
        return NextResponse.json({ error: 'Selected employee does not exist.' }, { status: 400 });
      }
      updateData.employeeId = data.employeeId;
    }

    const transactionTasks = [];
    
    // Add student update task
    transactionTasks.push(
      prisma.student.update({
        where: { id },
        data: updateData,
        include: {
          employee: {
            select: { employeeId: true, name: true }
          },
          visits: {
            orderBy: { visitDate: 'desc' }
          },
          assessmentReport: true,
          collegeBranch: {
            select: { id: true, name: true, code: true, location: true }
          },
          joinedCollege: {
            select: { id: true, name: true }
          }
        }
      })
    );

    // We no longer automatically create a visit record when remarks change.
    // Visits must be explicitly added via the "Record Visit" popup.

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
    const token = await getAuthToken(req, 'auth_token');

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        employee: {
          select: { employeeId: true, name: true }
        },
        visits: {
          orderBy: { visitDate: 'desc' }
        },
        assessmentReport: true,
        collegeBranch: {
          select: { id: true, name: true, code: true, location: true }
        },
        joinedCollege: {
          select: { id: true, name: true }
        }
      }
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

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const token = await getAuthToken(req, 'auth_token');

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyToken(token) as { employeeId: string; role: string } | null;

    if (!payload || !payload.employeeId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentStudent = await prisma.student.findUnique({ where: { id } });
    if (!currentStudent) {
      return NextResponse.json({ error: 'Student not found.' }, { status: 404 });
    }

    const userRole = (payload.role || '').toUpperCase();
    if (userRole !== 'ADMIN' && userRole !== 'TELECALLER') {
      if (currentStudent.employeeId !== payload.employeeId) {
        return NextResponse.json({ error: 'Forbidden: You can only delete your own students.' }, { status: 403 });
      }
    }

    await prisma.student.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Student deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

