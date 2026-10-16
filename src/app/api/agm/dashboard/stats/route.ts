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
        fatherName: true,
        occupation: true,
        address: true,
        phone: true,
        whatsapp: true,
        schoolName: true,
        district: true,
        mandal: true,
        village: true,
        marks: true,
        group: true,
        remarks: true,
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

    // 4. Fetch all visits for activity tracking
    const studentIds = teamStudents.map(s => s.id);
    const studentMap = new Map(teamStudents.map(s => [s.id, s]));
    const teamVisits = await prisma.visit.findMany({
      where: {
        OR: [
          { addedById: { in: allRelevantStaffIds } },
          { studentId: { in: studentIds } },
        ],
      },
      select: {
        id: true,
        studentId: true,
        addedById: true,
        visitDate: true,
        remarks: true,
        createdAt: true,
      },
      orderBy: { visitDate: 'desc' },
    });

    // 5. Fetch Config values for school & mandal hierarchy mapping
    const configs = await prisma.configValue.findMany({
      where: {
        type: { in: ['SCHOOL', 'MANDAL', 'VILLAGE', 'DISTRICT'] },
      },
      select: {
        id: true,
        type: true,
        value: true,
        strength: true,
        parentId: true,
        headmasterName: true,
        headmasterPhone: true,
        grade: true,
      },
    });

    const configMap: Record<string, string> = {};
    const schoolStrengthMap: Record<string, number> = {};
    const schoolDetailsMap: Record<string, any> = {};
    const villageMap = new Map<string, any>();
    const mandalMap = new Map<string, string>();

    for (const c of configs) {
      configMap[c.id] = c.value;
      if (c.type === 'MANDAL') {
        mandalMap.set(c.id, c.value);
      } else if (c.type === 'VILLAGE') {
        villageMap.set(c.id, c);
      } else if (c.type === 'SCHOOL') {
        schoolStrengthMap[c.id] = c.strength || 0;
        schoolStrengthMap[c.value.trim().toLowerCase()] = c.strength || 0;
        schoolDetailsMap[c.id] = c;
      }
    }

    // Helper to resolve mandal name from school parent
    const resolveMandalName = (schoolConf: any) => {
      if (!schoolConf || !schoolConf.parentId) return 'General';
      const parentId = schoolConf.parentId;
      if (mandalMap.has(parentId)) return mandalMap.get(parentId)!;
      if (villageMap.has(parentId)) {
        const v = villageMap.get(parentId);
        if (v.parentId && mandalMap.has(v.parentId)) {
          return mandalMap.get(v.parentId)!;
        }
      }
      return configMap[parentId] || 'General';
    };

    // 6. Aggregate Comprehensive KPIs per Staff Member
    const staffStats = staffMembers.map(staff => {
      const myStudents = teamStudents.filter(s => s.employeeId === staff.employeeId);
      const totalLeads = myStudents.length;
      const doorstepDone = myStudents.filter(s => s.doorstepCompleted).length;
      const doorstepPending = Math.max(0, totalLeads - doorstepDone);
      const admitted = myStudents.filter(s => (s.leadStatus || '').toLowerCase() === 'admitted').length;

      // Star leads
      const starLeadsList = myStudents.filter(s => {
        const isStarStatus = (s.leadStatus || '').toLowerCase().includes('star') || (s.leadStatus || '').toLowerCase().includes('prime');
        const hasGoodMarks = s.marks && (s.marks.includes('4') || s.marks.includes('5') || s.marks.includes('9') || s.marks.includes('10') || s.marks.toUpperCase().includes('A'));
        return isStarStatus || hasGoodMarks || s.doorstepCompleted;
      }).map(st => ({
        id: st.id,
        studentName: st.studentName,
        phone: st.phone,
        schoolName: (st.schoolName ? configMap[st.schoolName] : null) || st.schoolName || 'N/A',
        group: st.group,
        marks: st.marks,
        doorstepCompleted: st.doorstepCompleted,
        leadStatus: st.leadStatus,
      }));

      // Assigned Schools Breakdown
      const assignedSchoolIds = staff.assignedSchools || [];
      const staffSchools = assignedSchoolIds.map(schoolId => {
        const schoolConf = schoolDetailsMap[schoolId];
        const schoolName = schoolConf?.value || configMap[schoolId] || schoolId;
        const mandalName = resolveMandalName(schoolConf);
        const strength = schoolConf?.strength || 0;

        // Count leads collected by this staff for this school
        const schoolNameLower = schoolName.trim().toLowerCase();
        const schoolStudents = myStudents.filter(st => {
          if (!st.schoolName) return false;
          const stSchoolLower = st.schoolName.trim().toLowerCase();
          return stSchoolLower === schoolNameLower || st.schoolName === schoolId;
        });

        const collected = schoolStudents.length;
        const remaining = Math.max(0, strength - collected);
        const coverageRate = strength > 0 ? Math.min(100, Math.round((collected / strength) * 100)) : 0;
        const schoolDoorstepsDone = schoolStudents.filter(st => st.doorstepCompleted).length;
        const schoolDoorstepsPending = Math.max(0, collected - schoolDoorstepsDone);

        return {
          id: schoolId,
          name: schoolName,
          mandalName,
          strength,
          grade: schoolConf?.grade || '',
          headmasterName: schoolConf?.headmasterName || '',
          headmasterPhone: schoolConf?.headmasterPhone || '',
          collected,
          remaining,
          coverageRate,
          doorstepsCompleted: schoolDoorstepsDone,
          doorstepsPending: schoolDoorstepsPending,
        };
      });

      const totalSchoolStrength = staffSchools.reduce((sum, s) => sum + s.strength, 0);
      const remainingToCollect = Math.max(0, totalSchoolStrength - totalLeads);
      const overallCoverageRate = totalSchoolStrength > 0
        ? Math.min(100, Math.round((totalLeads / totalSchoolStrength) * 100))
        : 0;

      // Staff visits for daily timeline
      const myStudentIds = new Set(myStudents.map(s => s.id));
      const staffVisits = teamVisits.filter(v =>
        v.addedById === staff.employeeId || myStudentIds.has(v.studentId)
      );

      // Build date-wise activity map
      const activityMap = new Map<string, {
        date: string;
        dayLabel: string;
        newLeads: number;
        doorsteps: number;
        admissions: number;
        notes: string[];
        visitsList: Array<{
          id: string;
          studentId?: string;
          studentName: string;
          phone?: string;
          whatsapp?: string;
          fatherName?: string;
          occupation?: string;
          address?: string;
          village?: string;
          mandal?: string;
          district?: string;
          schoolName?: string;
          group?: string;
          marks?: string;
          visitNumber?: string | number;
          remarks?: string;
          leadStatus?: string;
          doorstepCompleted?: boolean;
          type: 'VISIT' | 'ADMISSION' | 'NEW_LEAD';
          date?: string;
        }>;
      }>();

      // Populate from students created
      for (const st of myStudents) {
        const dStr = new Date(st.createdAt).toISOString().split('T')[0];
        if (!activityMap.has(dStr)) {
          const dObj = new Date(st.createdAt);
          activityMap.set(dStr, {
            date: dStr,
            dayLabel: dObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            newLeads: 0,
            doorsteps: 0,
            admissions: 0,
            notes: [],
            visitsList: [],
          });
        }
        const item = activityMap.get(dStr)!;
        item.newLeads += 1;
        if ((st.leadStatus || '').toLowerCase() === 'admitted') {
          item.admissions += 1;
          item.visitsList.push({
            id: `adm-${st.id}`,
            studentId: st.id,
            studentName: st.studentName,
            phone: st.phone || '',
            whatsapp: st.whatsapp || '',
            fatherName: st.fatherName || '',
            occupation: st.occupation || '',
            address: st.address || '',
            village: st.village || '',
            mandal: st.mandal || '',
            district: st.district || '',
            schoolName: st.schoolName || '',
            group: st.group || '',
            marks: st.marks || '',
            visitNumber: st.visitNumber || '1',
            remarks: st.remarks || 'Joined / Admitted',
            leadStatus: 'Admitted',
            doorstepCompleted: st.doorstepCompleted,
            type: 'ADMISSION',
            date: dStr,
          });
        }
      }

      // Populate from visits
      for (const v of staffVisits) {
        const vDate = v.visitDate || v.createdAt;
        const dStr = new Date(vDate).toISOString().split('T')[0];
        if (!activityMap.has(dStr)) {
          const dObj = new Date(vDate);
          activityMap.set(dStr, {
            date: dStr,
            dayLabel: dObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            newLeads: 0,
            doorsteps: 0,
            admissions: 0,
            notes: [],
            visitsList: [],
          });
        }
        const item = activityMap.get(dStr)!;
        item.doorsteps += 1;
        if (v.remarks && !item.notes.includes(v.remarks)) {
          item.notes.push(v.remarks);
        }

        const st = studentMap.get(v.studentId);
        item.visitsList.push({
          id: v.id,
          studentId: st?.id || v.studentId,
          studentName: st?.studentName || 'Student Visit',
          phone: st?.phone || '',
          whatsapp: st?.whatsapp || '',
          fatherName: st?.fatherName || '',
          occupation: st?.occupation || '',
          address: st?.address || '',
          village: st?.village || '',
          mandal: st?.mandal || '',
          district: st?.district || '',
          schoolName: st?.schoolName || '',
          group: st?.group || '',
          marks: st?.marks || '',
          visitNumber: st?.visitNumber || '1',
          remarks: v.remarks || st?.remarks || 'Village doorstep visit completed',
          leadStatus: st?.leadStatus || 'Visited',
          doorstepCompleted: st?.doorstepCompleted ?? true,
          type: 'VISIT',
          date: dStr,
        });
      }

      const dailyActivity = Array.from(activityMap.values()).sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      const schoolNames = staffSchools.map(s => s.name);
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
        schools: staffSchools,
        totalSchoolStrength,
        totalLeads,
        remainingToCollect,
        overallCoverageRate,
        doorstepDone,
        doorstepPending,
        admitted,
        starLeads: starLeadsList.length,
        starLeadsList,
        dailyActivity,
      };
    });

    // 7. Overall Team Totals
    const totalLeads = teamStudents.length;
    const totalDoorstepDone = teamStudents.filter(s => s.doorstepCompleted).length;
    const totalDoorstepPending = Math.max(0, totalLeads - totalDoorstepDone);
    const totalAdmissions = teamStudents.filter(s => (s.leadStatus || '').toLowerCase() === 'admitted').length;

    // 8. Catchment Schools Global Summary
    const assignedSchoolIds = Array.from(new Set(staffMembers.flatMap(s => s.assignedSchools || [])));
    let totalAssigned10thStrength = 0;

    const catchmentSchools = assignedSchoolIds.map(schoolId => {
      const schoolConf = schoolDetailsMap[schoolId];
      const schoolName = schoolConf?.value || configMap[schoolId] || schoolId;
      const mandalName = resolveMandalName(schoolConf);
      const strength = schoolConf?.strength || 0;
      totalAssigned10thStrength += strength;

      const staffAssigned = staffMembers
        .filter(s => (s.assignedSchools || []).includes(schoolId))
        .map(s => s.name);

      const schoolStudents = teamStudents.filter(st => {
        if (!st.schoolName) return false;
        const stLower = st.schoolName.trim().toLowerCase();
        return stLower === schoolName.trim().toLowerCase() || st.schoolName === schoolId;
      });

      const collectedCount = schoolStudents.length;
      const doorstepsCompleted = schoolStudents.filter(s => s.doorstepCompleted).length;
      const doorstepsPending = Math.max(0, collectedCount - doorstepsCompleted);
      const remainingCount = Math.max(0, strength - collectedCount);
      const coverageRate = strength > 0 ? Math.min(100, Math.round((collectedCount / strength) * 100)) : 0;

      return {
        id: schoolId,
        name: schoolName,
        mandal: mandalName,
        strength,
        headmasterName: schoolConf?.headmasterName || '-',
        headmasterPhone: schoolConf?.headmasterPhone || '-',
        staffAssigned,
        collectedCount,
        remainingCount,
        coverageRate,
        doorstepsCompleted,
        doorstepsPending,
      };
    });

    const remainingTotalToCollect = Math.max(0, totalAssigned10thStrength - totalLeads);
    const overallTeamCoverageRate = totalAssigned10thStrength > 0
      ? Math.min(100, Math.round((totalLeads / totalAssigned10thStrength) * 100))
      : 0;

    // 9. Recent Doorstep Visits
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
        catchmentSchoolsCount: assignedSchoolIds.length,
        total10thStrength: totalAssigned10thStrength,
        remainingToCollect: remainingTotalToCollect,
        overallCoverageRate: overallTeamCoverageRate,
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
