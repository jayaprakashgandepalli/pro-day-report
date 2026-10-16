import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthToken, verifyToken } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const token = await getAuthToken(req, 'auth_token');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token) as { employeeId: string; role: string } | null;
    if (!payload || !payload.employeeId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Resolve collegeId
    let collegeId: string | null = null;
    if (payload.role === 'COLLEGE') {
      const u = await prisma.user.findUnique({
        where: { employeeId: payload.employeeId },
        select: { collegeId: true }
      });
      collegeId = u?.collegeId || null;
    } else {
      const u = await prisma.user.findUnique({
        where: { employeeId: payload.employeeId },
        select: { collegeId: true }
      });
      collegeId = u?.collegeId || null;
    }

    if (!collegeId) {
      return NextResponse.json({ error: 'No college associated with this account' }, { status: 400 });
    }

    // 1. Fetch all team members for this college
    const teamMembers = await prisma.user.findMany({
      where: { collegeId },
      select: {
        id: true,
        employeeId: true,
        name: true,
        role: true,
        assignedAgms: true,
        assignedSchools: true,
      },
      orderBy: { name: 'asc' }
    });

    const agmsList = teamMembers.filter(u => u.role === 'AGM').map(u => ({
      employeeId: u.employeeId,
      name: u.name,
      role: u.role,
    }));

    const staffList = teamMembers.filter(u => u.role === 'EMPLOYEE' || u.role === 'TELECALLER').map(u => ({
      employeeId: u.employeeId,
      name: u.name,
      role: u.role,
      assignedAgms: u.assignedAgms,
    }));

    // 2. Fetch all Catchment Schools configured for this college
    const [collegeSchools, mandalConfigs] = await Promise.all([
      prisma.configValue.findMany({
        where: { collegeId, type: 'SCHOOL' },
        select: {
          id: true,
          value: true,
          parentId: true,
          strength: true,
          headmasterName: true,
        },
        orderBy: { value: 'asc' }
      }),
      prisma.configValue.findMany({
        where: { type: 'MANDAL' },
        select: { id: true, value: true }
      })
    ]);

    const mandalMap = new Map<string, string>();
    mandalConfigs.forEach(m => mandalMap.set(m.id, m.value));

    // Also get distinct schoolNames and mandals from existing students in this college
    const collegeStaffIds = teamMembers.map(u => u.employeeId);
    const studentSchoolsAndMandals = await prisma.student.findMany({
      where: {
        OR: [
          { collegeId },
          { employeeId: { in: collegeStaffIds } }
        ]
      },
      select: { schoolName: true, mandal: true },
      distinct: ['schoolName', 'mandal']
    });

    // Merge schools
    const schoolNameSet = new Set<string>();
    collegeSchools.forEach(s => schoolNameSet.add(s.value));
    studentSchoolsAndMandals.forEach(s => {
      if (s.schoolName && s.schoolName.trim() !== '') {
        schoolNameSet.add(s.schoolName.trim());
      }
    });

    // Merge mandals
    const mandalNameSet = new Set<string>();
    collegeSchools.forEach(s => {
      if (s.parentId && mandalMap.has(s.parentId)) {
        mandalNameSet.add(mandalMap.get(s.parentId)!);
      }
    });
    studentSchoolsAndMandals.forEach(s => {
      if (s.mandal && s.mandal.trim() !== '') {
        mandalNameSet.add(s.mandal.trim());
      }
    });

    // 3. Compute High-Level Quick Stats for this college
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [totalStudents, admittedCount, doorstepCount, todayCount] = await Promise.all([
      prisma.student.count({
        where: {
          OR: [
            { collegeId },
            { employeeId: { in: collegeStaffIds } }
          ]
        }
      }),
      prisma.student.count({
        where: {
          OR: [
            { collegeId },
            { employeeId: { in: collegeStaffIds } }
          ],
          leadStatus: 'Admitted'
        }
      }),
      prisma.student.count({
        where: {
          OR: [
            { collegeId },
            { employeeId: { in: collegeStaffIds } }
          ],
          doorstepCompleted: true
        }
      }),
      prisma.student.count({
        where: {
          OR: [
            { collegeId },
            { employeeId: { in: collegeStaffIds } }
          ],
          createdAt: { gte: todayStart }
        }
      }),
    ]);

    return NextResponse.json({
      staffList,
      agmsList,
      schoolsList: Array.from(schoolNameSet).sort(),
      mandalsList: Array.from(mandalNameSet).sort(),
      stats: {
        totalStudents,
        admittedCount,
        doorstepCount,
        pendingDoorstepCount: Math.max(0, totalStudents - doorstepCount),
        todayCount,
        staffCount: staffList.length,
        agmsCount: agmsList.length,
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching college student filters:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
