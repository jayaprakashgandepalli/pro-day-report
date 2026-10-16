import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || session.role !== 'COLLEGE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { employeeId: session.employeeId },
      include: { college: true },
    });

    if (!currentUser || !currentUser.collegeId || !currentUser.college) {
      return NextResponse.json({ error: 'College not found' }, { status: 404 });
    }

    const collegeId = currentUser.collegeId;
    const college = currentUser.college;

    // 1. Fetch all schools belonging to this college
    const schoolsRaw = await prisma.configValue.findMany({
      where: { type: 'SCHOOL', collegeId },
      orderBy: { value: 'asc' },
    });

    // Fetch Mandals & Villages for school location names
    const [mandalsRaw, villagesRaw] = await Promise.all([
      prisma.configValue.findMany({
        where: { type: 'MANDAL' },
        select: { id: true, value: true, parentId: true },
      }),
      prisma.configValue.findMany({
        where: { type: 'VILLAGE' },
        select: { id: true, value: true, parentId: true },
      }),
    ]);

    const mandalMap = new Map<string, string>();
    mandalsRaw.forEach(m => mandalMap.set(m.id, m.value));

    const villageMap = new Map<string, { name: string; mandalId: string | null }>();
    villagesRaw.forEach(v => villageMap.set(v.id, { name: v.value, mandalId: v.parentId }));

    // 2. Fetch all Team Members in this college
    const teamMembers = await prisma.user.findMany({
      where: { collegeId },
      select: {
        id: true,
        employeeId: true,
        name: true,
        role: true,
        isActive: true,
        assignedAgms: true,
        assignedMandals: true,
        assignedSchools: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' },
    });

    const fieldStaffList = teamMembers.filter(u => u.role === 'EMPLOYEE');
    const telecallersList = teamMembers.filter(u => u.role === 'TELECALLER');
    const agmsList = teamMembers.filter(u => u.role === 'AGM');

    // Build School -> Staff assignment map
    const schoolToStaffMap = new Map<string, { id: string; name: string }>();
    fieldStaffList.forEach(staff => {
      (staff.assignedSchools || []).forEach(schId => {
        schoolToStaffMap.set(schId, { id: staff.id, name: staff.name });
      });
    });

    // 3. Fetch all Students for this college
    // Students can be linked by collegeId, or created by a team member of this college
    const teamEmployeeIds = teamMembers.map(u => u.employeeId);
    const students = await prisma.student.findMany({
      where: {
        OR: [
          { collegeId },
          { employeeId: { in: teamEmployeeIds } },
        ],
      },
      select: {
        id: true,
        employeeId: true,
        studentName: true,
        schoolName: true,
        doorstepCompleted: true,
        leadStatus: true,
        admissionDate: true,
        marks: true,
        group: true,
        studyInterestedAt: true,
        ableToBearFee: true,
        phone: true,
        nextFollowUpDate: true,
        nextFollowUpType: true,
        telecallerUpdateAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch Visits for Doorstep tracking
    const studentIds = students.map(s => s.id);
    const visits = await prisma.visit.findMany({
      where: {
        studentId: { in: studentIds },
      },
      select: {
        id: true,
        studentId: true,
        addedById: true,
        visitDate: true,
        createdAt: true,
      },
      orderBy: { visitDate: 'asc' },
    });

    // 4. Calculate School Strength & Data Collection Metrics (User's special request)
    let totalSchoolStrength = 0;
    const schoolCollectedMap = new Map<string, number>();

    // Normalize student schoolName matches
    students.forEach(s => {
      if (s.schoolName) {
        const key = s.schoolName.trim().toLowerCase();
        schoolCollectedMap.set(key, (schoolCollectedMap.get(key) || 0) + 1);
      }
    });

    const schoolsData = schoolsRaw.map(s => {
      let mandalName = 'General';
      if (s.parentId) {
        const v = villageMap.get(s.parentId);
        if (v && v.mandalId && mandalMap.has(v.mandalId)) {
          mandalName = mandalMap.get(v.mandalId)!;
        } else if (mandalMap.has(s.parentId)) {
          mandalName = mandalMap.get(s.parentId)!;
        }
      }

      const strength = s.strength || 0;
      totalSchoolStrength += strength;

      // Match collected count by school name or ID
      const collectedByValue = schoolCollectedMap.get(s.value.trim().toLowerCase()) || 0;
      const collectedById = schoolCollectedMap.get(s.id.toLowerCase()) || 0;
      const collected = Math.max(collectedByValue, collectedById);
      const remaining = Math.max(0, strength - collected);
      const coverageRate = strength > 0 ? Math.min(100, Math.round((collected / strength) * 100)) : 0;

      const assignedStaff = schoolToStaffMap.get(s.id) || null;

      return {
        id: s.id,
        name: s.value,
        mandalName,
        strength,
        grade: s.grade || '',
        collected,
        remaining,
        coverageRate,
        assignedStaffName: assignedStaff ? assignedStaff.name : null,
      };
    });

    const totalCollectedData = students.length;
    const remainingToCollect = Math.max(0, totalSchoolStrength - totalCollectedData);
    const overallCollectionRate = totalSchoolStrength > 0
      ? Number(((totalCollectedData / totalSchoolStrength) * 100).toFixed(1))
      : 0;

    // 5. Operations KPI Metrics
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const doorstepsCompleted = students.filter(s => s.doorstepCompleted).length;
    const todayNewData = students.filter(s => new Date(s.createdAt) >= startOfToday).length;

    const admittedStudents = students.filter(s =>
      s.leadStatus === 'Admitted' || s.admissionDate !== null
    ).length;
    const pendingAdmissions = Math.max(0, students.length - admittedStudents);

    const todayFollowups = students.filter(s => {
      if (!s.nextFollowUpDate) return false;
      const fDate = new Date(s.nextFollowUpDate);
      return fDate >= startOfToday && fDate <= endOfToday;
    }).length;

    const upcomingFollowups = students.filter(s => {
      if (!s.nextFollowUpDate) return false;
      const fDate = new Date(s.nextFollowUpDate);
      return fDate > endOfToday;
    }).length;

    // 6. Day-by-Day Activity Trend (Last 14 Days)
    const dailyTrend: { date: string; dayLabel: string; newLeads: number; doorsteps: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const dEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      // Leads created on that day
      const dayLeads = students.filter(s => {
        const cDate = new Date(s.createdAt);
        return cDate >= dStart && cDate <= dEnd;
      }).length;

      // Doorstep visits completed on that day
      const dayVisits = visits.filter(v => {
        const vDate = new Date(v.visitDate || v.createdAt);
        return vDate >= dStart && vDate <= dEnd;
      }).length;

      dailyTrend.push({
        date: dateStr,
        dayLabel,
        newLeads: dayLeads,
        doorsteps: dayVisits,
      });
    }

    // 7. Lead Status Breakdown
    const statusCounts: Record<string, number> = {};
    students.forEach(s => {
      const st = s.leadStatus || 'New';
      statusCounts[st] = (statusCounts[st] || 0) + 1;
    });

    // 8. Role-by-Role Detailed Work Progress

    // Field Staff Progress
    const fieldStaffProgress = fieldStaffList.map(staff => {
      const staffStudents = students.filter(s => s.employeeId === staff.employeeId);
      const staffTodayLeads = staffStudents.filter(s => new Date(s.createdAt) >= startOfToday).length;
      const staffDoorsteps = staffStudents.filter(s => s.doorstepCompleted).length;
      const staffPendingDoorsteps = Math.max(0, staffStudents.length - staffDoorsteps);
      const staffAdmitted = staffStudents.filter(s => s.leadStatus === 'Admitted' || s.admissionDate !== null).length;

      // Calculate Star Leads (High-Potential / Prime Leads)
      const staffStarLeads = staffStudents.filter(s => {
        if (s.leadStatus === 'Admitted' || s.admissionDate !== null) return true;
        if (s.doorstepCompleted) return true;
        if (s.marks && (s.marks.includes('5') || s.marks.includes('9') || s.marks.includes('10') || s.marks.toUpperCase().includes('A'))) return true;
        if (s.group && (s.group.toUpperCase().includes('MPC') || s.group.toUpperCase().includes('BIPC'))) return true;
        return false;
      });
      const staffStarLeadsCount = staffStarLeads.length;

      // Find AGM name
      const agmId = (staff.assignedAgms && staff.assignedAgms[0]) || null;
      const agmUser = agmId ? agmsList.find(a => a.employeeId === agmId) : null;

      // Assigned Schools Breakdown for this staff
      const assignedSchoolIds = staff.assignedSchools || [];
      const staffSchools = schoolsRaw
        .filter(s => assignedSchoolIds.includes(s.id))
        .map(s => {
          let mandalName = 'General';
          if (s.parentId) {
            const v = villageMap.get(s.parentId);
            if (v && v.mandalId && mandalMap.has(v.mandalId)) {
              mandalName = mandalMap.get(v.mandalId)!;
            } else if (mandalMap.has(s.parentId)) {
              mandalName = mandalMap.get(s.parentId)!;
            }
          }

          // Count leads collected by this staff for this school
          const schoolNameLower = s.value.trim().toLowerCase();
          const collected = staffStudents.filter(st =>
            st.schoolName && st.schoolName.trim().toLowerCase() === schoolNameLower
          ).length;

          const strength = s.strength || 0;
          const remaining = Math.max(0, strength - collected);
          const coverageRate = strength > 0 ? Math.min(100, Math.round((collected / strength) * 100)) : 0;

          return {
            id: s.id,
            name: s.value,
            mandalName,
            strength,
            grade: s.grade || '',
            headmasterName: s.headmasterName || '',
            headmasterPhone: s.headmasterPhone || '',
            collected,
            remaining,
            coverageRate,
          };
        });

      const totalSchoolStrength = staffSchools.reduce((sum, s) => sum + s.strength, 0);
      const totalCollected = staffStudents.length;
      const uncollectedData = Math.max(0, totalSchoolStrength - totalCollected);
      const overallCoverage = totalSchoolStrength > 0
        ? Number(((totalCollected / totalSchoolStrength) * 100).toFixed(1))
        : 0;

      // Staff visits
      const staffStudentIds = new Set(staffStudents.map(s => s.id));
      const staffVisits = visits.filter(v =>
        v.addedById === staff.employeeId || staffStudentIds.has(v.studentId)
      );

      // Date-wise Daily Activity Map
      const activityMap = new Map<string, { date: string; dayLabel: string; newLeads: number; doorsteps: number; admissions: number }>();

      const getOrInitDay = (dateStr: string) => {
        if (!activityMap.has(dateStr)) {
          const parts = dateStr.split('-');
          const dObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
          const dayLabel = dObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          activityMap.set(dateStr, {
            date: dateStr,
            dayLabel,
            newLeads: 0,
            doorsteps: 0,
            admissions: 0,
          });
        }
        return activityMap.get(dateStr)!;
      };

      // Populate continuous last 30 days
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        getOrInitDay(dateStr);
      }

      // Map leads created by this staff
      staffStudents.forEach(s => {
        const dateStr = new Date(s.createdAt).toISOString().split('T')[0];
        getOrInitDay(dateStr).newLeads += 1;
      });

      // Map visits done by this staff
      staffVisits.forEach(v => {
        const dateStr = new Date(v.visitDate || v.createdAt).toISOString().split('T')[0];
        getOrInitDay(dateStr).doorsteps += 1;
      });

      // Map admissions under this staff
      staffStudents.forEach(s => {
        if (s.admissionDate) {
          const dateStr = new Date(s.admissionDate).toISOString().split('T')[0];
          getOrInitDay(dateStr).admissions += 1;
        }
      });

      // Sort descending (newest first)
      const dailyActivity = Array.from(activityMap.values()).sort((a, b) => b.date.localeCompare(a.date));

      return {
        id: staff.id,
        name: staff.name,
        employeeId: staff.employeeId,
        isActive: staff.isActive,
        assignedSchoolsCount: assignedSchoolIds.length,
        totalSchoolStrength,
        totalLeads: staffStudents.length,
        uncollectedData,
        overallCoverage,
        todayNewData: staffTodayLeads,
        doorstepsCompleted: staffDoorsteps,
        pendingDoorsteps: staffPendingDoorsteps,
        admittedCount: staffAdmitted,
        starLeads: staffStarLeadsCount,
        starLeadsList: staffStarLeads.map(s => ({
          id: s.id,
          studentName: s.studentName,
          phone: s.phone,
          schoolName: s.schoolName,
          leadStatus: s.leadStatus,
          doorstepCompleted: s.doorstepCompleted,
          marks: s.marks,
          group: s.group,
        })),
        agmName: agmUser ? agmUser.name : 'Direct',
        schools: staffSchools,
        dailyActivity,
      };
    });

    // Telecaller Progress
    const telecallerProgress = telecallersList.map(caller => {
      const agmNames = (caller.assignedAgms || [])
        .map(aId => agmsList.find(a => a.employeeId === aId)?.name)
        .filter(Boolean);

      // Follow-ups and calls
      const callerUpdatesCount = students.filter(s => s.telecallerUpdateAt !== null).length;

      return {
        id: caller.id,
        name: caller.name,
        employeeId: caller.employeeId,
        isActive: caller.isActive,
        agmNames: agmNames.length > 0 ? agmNames.join(', ') : 'Direct',
        totalUpdates: callerUpdatesCount,
        admittedFacilitated: admittedStudents,
      };
    });

    // AGM Overview
    const agmProgress = agmsList.map(agm => {
      // Find staff reporting to this AGM
      const reportingStaff = fieldStaffList.filter(s =>
        s.assignedAgms && s.assignedAgms.includes(agm.employeeId)
      );
      const reportingTelecallers = telecallersList.filter(t =>
        t.assignedAgms && t.assignedAgms.includes(agm.employeeId)
      );

      const staffEmployeeIds = reportingStaff.map(s => s.employeeId);
      const agmStudents = students.filter(s => staffEmployeeIds.includes(s.employeeId));
      const agmDoorsteps = agmStudents.filter(s => s.doorstepCompleted).length;
      const agmAdmitted = agmStudents.filter(s => s.leadStatus === 'Admitted' || s.admissionDate !== null).length;

      return {
        id: agm.id,
        name: agm.name,
        employeeId: agm.employeeId,
        isActive: agm.isActive,
        fieldStaffCount: reportingStaff.length,
        telecallersCount: reportingTelecallers.length,
        totalTeamMembers: reportingStaff.length + reportingTelecallers.length,
        totalLeads: agmStudents.length,
        doorstepsCompleted: agmDoorsteps,
        admittedCount: agmAdmitted,
      };
    });

    return NextResponse.json({
      collegeName: college.name,
      subscriptionPlan: college.subscriptionPlan,

      // School Potential & Collection Metrics
      schoolsStats: {
        totalSchools: schoolsRaw.length,
        totalSchoolStrength,
        totalCollectedData,
        remainingToCollect,
        overallCollectionRate,
        schoolsList: schoolsData,
      },

      // Core KPI Stats
      coreStats: {
        totalLeads: students.length,
        doorstepsCompleted,
        todayNewData,
        admittedStudents,
        pendingAdmissions,
        todayFollowups,
        upcomingFollowups,
        doorstepRate: students.length > 0
          ? Number(((doorstepsCompleted / students.length) * 100).toFixed(1))
          : 0,
        admissionRate: students.length > 0
          ? Number(((admittedStudents / students.length) * 100).toFixed(1))
          : 0,
      },

      // Day-by-Day Trends
      dailyTrend,

      // Lead Status Breakdown
      statusCounts,

      // Role Progress
      teamSummary: {
        agmsCount: agmsList.length,
        fieldStaffCount: fieldStaffList.length,
        telecallersCount: telecallersList.length,
        totalTeam: teamMembers.length,
      },
      fieldStaffProgress,
      telecallerProgress,
      agmProgress,
    });
  } catch (error) {
    console.error('Error fetching college dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to load dashboard statistics' },
      { status: 500 }
    );
  }
}
