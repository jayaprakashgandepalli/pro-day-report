import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || (session.role !== 'AGM' && session.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized. AGM access only.' }, { status: 401 });
    }

    // 1. Fetch current AGM profile
    const agmUser = await prisma.user.findUnique({
      where: { employeeId: session.employeeId },
      include: { college: true },
    });

    if (!agmUser) {
      return NextResponse.json({ error: 'AGM user profile not found.' }, { status: 404 });
    }

    // 2. Fetch all staff members assigned under this AGM (Field Staff and Telecallers)
    const staffMembers = await prisma.user.findMany({
      where: {
        assignedAgms: { has: agmUser.employeeId },
      },
      select: {
        id: true,
        employeeId: true,
        name: true,
        role: true,
        isActive: true,
        assignedMandals: true,
        assignedSchools: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const staffIds = staffMembers.map(s => s.employeeId);

    // If AGM itself created students, include them as well
    const allRelevantStaffIds = [...staffIds, agmUser.employeeId];

    // 3. Fetch all students under this team
    const teamStudents = await prisma.student.findMany({
      where: {
        employeeId: { in: allRelevantStaffIds },
      },
      select: {
        id: true,
        employeeId: true,
        studentName: true,
        phone: true,
        schoolName: true,
        mandal: true,
        village: true,
        marks: true,
        leadStatus: true,
        doorstepCompleted: true,
        studyInterestedAt: true,
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
    });

    // 4. Fetch Config values for school & mandal name mapping
    const configs = await prisma.configValue.findMany({
      where: {
        type: { in: ['SCHOOL', 'MANDAL', 'DISTRICT'] },
      },
      select: {
        id: true,
        type: true,
        value: true,
        strength: true,
        headmasterName: true,
        headmasterPhone: true,
      },
    });

    const configMap: Record<string, string> = {};
    const schoolStrengthMap: Record<string, number> = {};
    const schoolDetailsMap: Record<string, any> = {};

    for (const c of configs) {
      configMap[c.id] = c.value;
      if (c.type === 'SCHOOL') {
        schoolStrengthMap[c.id] = c.strength || 0;
        schoolStrengthMap[c.value] = c.strength || 0;
        schoolDetailsMap[c.id] = c;
      }
    }

    // 5. Aggregate KPIs per Staff Member
    const staffStats = staffMembers.map(staff => {
      const myStudents = teamStudents.filter(s => s.employeeId === staff.employeeId);
      const totalLeads = myStudents.length;
      const doorstepDone = myStudents.filter(s => s.doorstepCompleted).length;
      const doorstepPending = totalLeads - doorstepDone;
      const admitted = myStudents.filter(s => (s.leadStatus || '').toLowerCase() === 'admitted').length;
      const starLeads = myStudents.filter(s => {
        const isStarStatus = (s.leadStatus || '').toLowerCase().includes('star') || (s.leadStatus || '').toLowerCase().includes('prime');
        const hasGoodMarks = s.marks && (s.marks.includes('4') || s.marks.includes('5') || s.marks.includes('A'));
        return isStarStatus || hasGoodMarks;
      }).length;

      const schoolNames = (staff.assignedSchools || []).map(sId => configMap[sId] || sId);
      const mandalNames = (staff.assignedMandals || []).map(mId => configMap[mId] || mId);

      return {
        id: staff.id,
        employeeId: staff.employeeId,
        name: staff.name,
        role: staff.role,
        isActive: staff.isActive,
        assignedSchools: staff.assignedSchools || [],
        assignedSchoolNames: schoolNames,
        assignedMandalNames: mandalNames,
        totalLeads,
        doorstepDone,
        doorstepPending,
        admitted,
        starLeads,
      };
    });

    // 6. Overall Team Totals
    const totalLeads = teamStudents.length;
    const totalDoorstepDone = teamStudents.filter(s => s.doorstepCompleted).length;
    const totalDoorstepPending = totalLeads - totalDoorstepDone;
    const totalAdmissions = teamStudents.filter(s => (s.leadStatus || '').toLowerCase() === 'admitted').length;
    const totalStarLeads = teamStudents.filter(s => {
      const isStarStatus = (s.leadStatus || '').toLowerCase().includes('star') || (s.leadStatus || '').toLowerCase().includes('prime');
      const hasGoodMarks = s.marks && (s.marks.includes('4') || s.marks.includes('5') || s.marks.includes('A'));
      return isStarStatus || hasGoodMarks;
    }).length;

    // 7. Recent Doorstep Visits
    const recentVisits: any[] = [];
    for (const s of teamStudents as any[]) {
      if (s.visits && s.visits.length > 0) {
        const v = s.visits[0];
        const staff = staffMembers.find(st => st.employeeId === s.employeeId);
        recentVisits.push({
          studentName: s.studentName,
          phone: s.phone,
          schoolName: (s.schoolName ? configMap[s.schoolName] : null) || s.schoolName || '-',
          village: (s.village ? configMap[s.village] : null) || s.village || '-',
          visitDate: v.visitDate,
          remarks: v.remarks,
          visitNumber: s.visitNumber || null,
          doorstepCompleted: s.doorstepCompleted,
          staffName: staff?.name || s.employeeId,
          staffRole: staff?.role || 'FIELD',
        });
      }
    }
    recentVisits.sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime());

    // 8. Assigned Catchment Schools Summary
    const assignedSchoolIds = Array.from(new Set(staffMembers.flatMap(s => s.assignedSchools || [])));
    const catchmentSchools = assignedSchoolIds.map(schoolId => {
      const schoolName = configMap[schoolId] || schoolId;
      const details = schoolDetailsMap[schoolId];
      const strength = details?.strength || 0;
      const staffAssigned = staffMembers
        .filter(s => (s.assignedSchools || []).includes(schoolId))
        .map(s => s.name);

      const collectedCount = teamStudents.filter(st => {
        const sName = st.schoolName;
        return sName === schoolId || sName === schoolName;
      }).length;

      return {
        id: schoolId,
        name: schoolName,
        strength,
        headmasterName: details?.headmasterName || '-',
        headmasterPhone: details?.headmasterPhone || '-',
        staffAssigned,
        collectedCount,
        remainingCount: Math.max(0, strength - collectedCount),
      };
    });

    return NextResponse.json({
      agm: {
        id: agmUser.id,
        name: agmUser.name,
        employeeId: agmUser.employeeId,
        role: agmUser.role,
        collegeName: agmUser.college?.name || 'Navanidhi Group',
      },
      kpis: {
        teamCount: staffMembers.length,
        fieldStaffCount: staffMembers.filter(s => s.role === 'EMPLOYEE').length,
        telecallerCount: staffMembers.filter(s => s.role === 'TELECALLER').length,
        totalLeads,
        totalDoorstepDone,
        totalDoorstepPending,
        totalAdmissions,
        totalStarLeads,
        catchmentSchoolsCount: assignedSchoolIds.length,
      },
      staffStats,
      recentVisits: recentVisits.slice(0, 15),
      catchmentSchools,
    });
  } catch (error) {
    console.error('Error fetching AGM dashboard stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
