import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || (session.role !== 'AGM' && session.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim() || '';
    const staffId = searchParams.get('staffId') || '';
    const doorstep = searchParams.get('doorstep') || '';
    const status = searchParams.get('status') || '';
    const school = searchParams.get('school') || '';

    // 1. Find all staff members under this AGM
    const staffMembers = await prisma.user.findMany({
      where: {
        assignedAgms: { has: session.employeeId },
      },
      select: { employeeId: true, name: true, role: true },
    });

    const staffIds = staffMembers.map(s => s.employeeId);
    const allAllowedStaffIds = [...staffIds, session.employeeId];

    // Build Where Clause
    const whereClause: any = {
      employeeId: staffId ? staffId : { in: allAllowedStaffIds },
    };

    if (doorstep === 'completed') {
      whereClause.doorstepCompleted = true;
    } else if (doorstep === 'pending') {
      whereClause.doorstepCompleted = false;
    }

    if (status && status !== 'ALL') {
      whereClause.leadStatus = status;
    }

    if (school && school !== 'ALL') {
      whereClause.schoolName = school;
    }

    if (search) {
      whereClause.OR = [
        { studentName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { fatherName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const students = await prisma.student.findMany({
      where: whereClause,
      select: {
        id: true,
        employeeId: true,
        studentName: true,
        gender: true,
        phone: true,
        whatsapp: true,
        fatherName: true,
        occupation: true,
        group: true,
        schoolName: true,
        mandal: true,
        village: true,
        address: true,
        marks: true,
        leadStatus: true,
        doorstepCompleted: true,
        studyInterestedAt: true,
        ableToBearFee: true,
        visitNumber: true,
        createdAt: true,
        visits: {
          take: 1,
          orderBy: { visitDate: 'desc' },
          select: {
            visitDate: true,
            remarks: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });

    const staffMap: Record<string, string> = {};
    for (const s of staffMembers) {
      staffMap[s.employeeId] = s.name;
    }
    staffMap[session.employeeId] = session.name;

    const formattedStudents = students.map((st: any) => ({
      ...st,
      staffName: staffMap[st.employeeId] || st.employeeId,
      latestVisit: st.visits?.[0] || null,
    }));

    return NextResponse.json({
      success: true,
      total: formattedStudents.length,
      students: formattedStudents,
      staffMembers,
    });
  } catch (error) {
    console.error('Error fetching AGM students:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
