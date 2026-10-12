import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token) as { employeeId: string; role: string } | null;
    
    let whereClause: any = { studentId: id };
    
    if (payload && payload.role === 'COLLEGE') {
      whereClause.addedById = payload.employeeId;
    }

    const visits = await prisma.visit.findMany({
      where: whereClause,
      orderBy: { visitDate: 'desc' }
    });

    return NextResponse.json({ visits }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyToken(token) as { employeeId: string; role: string } | null;

    if (!payload) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = await req.json();

    const remarks = (data.remarks || '').trim();


    const student = await prisma.student.findUnique({ where: { id } });
    if (!student) {
      return NextResponse.json({ error: 'Student not found.' }, { status: 404 });
    }

    const visitDate = data.visitDate ? new Date(data.visitDate) : new Date();
    
    let nextFollowUpDate = null;
    let nextFollowUpType = data.nextFollowUpType || null;

    if (nextFollowUpType === 'Date' && data.nextFollowUpDate) {
      nextFollowUpDate = new Date(data.nextFollowUpDate);
    }

    // Check if an existing visit already exists for this date/visitId
    const startOfDay = new Date(visitDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(visitDate);
    endOfDay.setHours(23, 59, 59, 999);

    let existingVisit = null;
    if (data.visitId) {
      existingVisit = await prisma.visit.findUnique({
        where: { id: data.visitId }
      });
    }

    if (!existingVisit) {
      const existingWhere: any = {
        studentId: id,
        visitDate: {
          gte: startOfDay,
          lte: endOfDay
        }
      };
      if (payload.role === 'COLLEGE') {
        existingWhere.addedById = payload.employeeId;
      }
      existingVisit = await prisma.visit.findFirst({
        where: existingWhere,
        orderBy: { visitDate: 'desc' }
      });
    }

    const isUpdate = !!existingVisit;

    // Determine the next visit number only if this is a brand new visit
    let currentVisitNo = parseInt(student.visitNumber || '0');
    if (isNaN(currentVisitNo)) currentVisitNo = 0;
    const nextVisitNo = isUpdate ? (student.visitNumber || '1') : (currentVisitNo + 1).toString();

    let updateStudentPromise = null;
    if (payload.role !== 'COLLEGE') {
      const updateData: any = {
        visitNumber: nextVisitNo,
        remarks: remarks || student.remarks || null,
        nextFollowUpDate,
        nextFollowUpType,
        doorstepCompleted: true, // Automatically check doorstep completed when a visit is recorded
        updatedAt: new Date() // Force updatedAt change
      };
      if (data.leadStatus) {
        updateData.leadStatus = data.leadStatus;
        
        if (data.leadStatus === 'Admitted' && data.joinedCollegeId) {
          updateData.joinedCollegeId = data.joinedCollegeId;
          updateData.applicationNumber = data.applicationNumber || null;
          updateData.admissionDate = new Date();
        }
      }
      if (payload.role === 'TELECALLER') {
        updateData.telecallerUpdateAt = new Date();
        updateData.telecallerUpdateDetails = remarks || (isUpdate ? 'Updated visit record' : 'Added a visit record');
      }

      updateStudentPromise = prisma.student.update({
        where: { id },
        data: updateData
      });
    }

    const transactionTasks: any[] = [];
    
    // For colleges, clear previous follow-up dates so that only the latest visit holds the follow-up info
    if (payload.role === 'COLLEGE') {
      transactionTasks.push(
        prisma.visit.updateMany({
          where: { studentId: id, addedById: payload.employeeId },
          data: { nextFollowUpDate: null, nextFollowUpType: null }
        })
      );
    }

    if (isUpdate && existingVisit) {
      transactionTasks.push(
        prisma.visit.update({
          where: { id: existingVisit.id },
          data: {
            remarks: remarks,
            nextFollowUpDate,
            nextFollowUpType
          }
        })
      );
    } else {
      transactionTasks.push(
        prisma.visit.create({
          data: {
            studentId: id,
            addedById: payload.employeeId,
            visitDate,
            remarks: remarks,
            nextFollowUpDate,
            nextFollowUpType
          }
        })
      );
    }

    if (updateStudentPromise) {
      transactionTasks.push(updateStudentPromise);
    }

    // Use a transaction to ensure both records are updated together
    const results = await prisma.$transaction(transactionTasks);
    
    // If college, the first task was updateMany, so the visit is index 1. Otherwise index 0.
    const savedVisit = payload.role === 'COLLEGE' ? results[1] : results[0];
    const updatedStudent = updateStudentPromise ? results[results.length - 1] : student;

    return NextResponse.json({ 
      message: isUpdate ? 'Visit updated successfully' : 'Visit added successfully', 
      visit: savedVisit, 
      student: updatedStudent,
      updated: isUpdate
    }, { status: isUpdate ? 200 : 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
