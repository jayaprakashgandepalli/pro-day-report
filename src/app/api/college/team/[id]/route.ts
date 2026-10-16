import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // Fetch the staff member
    const member = await prisma.user.findFirst({
      where: {
        id,
        collegeId: currentUser.collegeId,
      },
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
        _count: {
          select: {
            students: true,
            visitsCreated: true,
          },
        },
      },
    });

    if (!member) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    // Fetch AGMs in this college
    const agmsList = await prisma.user.findMany({
      where: {
        collegeId: currentUser.collegeId,
        role: 'AGM',
        isActive: true,
      },
      select: {
        id: true,
        employeeId: true,
        name: true,
      },
      orderBy: { name: 'asc' },
    });

    // Fetch Districts, Mandals, Villages, and Schools
    const [districtsRaw, mandalsRaw, villagesRaw, schoolsRaw] = await Promise.all([
      prisma.configValue.findMany({
        where: { type: 'DISTRICT' },
        select: { id: true, value: true },
        orderBy: { value: 'asc' },
      }),
      prisma.configValue.findMany({
        where: { type: 'MANDAL' },
        select: { id: true, value: true, parentId: true },
        orderBy: { value: 'asc' },
      }),
      prisma.configValue.findMany({
        where: { type: 'VILLAGE' },
        select: { id: true, value: true, parentId: true },
      }),
      prisma.configValue.findMany({
        where: { type: 'SCHOOL', collegeId: currentUser.collegeId },
        select: { id: true, value: true, parentId: true, strength: true, grade: true },
        orderBy: { value: 'asc' },
      }),
    ]);

    const districts = districtsRaw.map(d => ({
      id: d.id,
      name: d.value,
    }));

    const mandalMap = new Map<string, { id: string; name: string; districtId: string | null }>();
    mandalsRaw.forEach(m => mandalMap.set(m.id, { id: m.id, name: m.value, districtId: m.parentId }));

    const villageMap = new Map<string, { id: string; name: string; mandalId: string | null }>();
    villagesRaw.forEach(v => {
      villageMap.set(v.id, {
        id: v.id,
        name: v.value,
        mandalId: v.parentId,
      });
    });

    const schools = schoolsRaw.map(s => {
      let mandalId: string | null = null;
      let villageName = '';

      if (s.parentId) {
        const v = villageMap.get(s.parentId);
        if (v) {
          villageName = v.name;
          mandalId = v.mandalId;
        } else if (mandalMap.has(s.parentId)) {
          mandalId = s.parentId;
        }
      }

      const mandal = mandalId ? mandalMap.get(mandalId) : null;

      return {
        id: s.id,
        name: s.value,
        mandalId: mandalId,
        mandalName: mandal ? mandal.name : 'Other / General',
        districtId: mandal ? mandal.districtId : null,
        villageName,
        strength: s.strength || 0,
        grade: s.grade || '',
      };
    });

    const mandals = mandalsRaw.map(m => ({
      id: m.id,
      name: m.value,
      districtId: m.parentId,
    }));

    // Build current school assignment map for this college
    const fieldEmployees = await prisma.user.findMany({
      where: {
        collegeId: currentUser.collegeId,
        role: 'EMPLOYEE',
      },
      select: {
        id: true,
        name: true,
        employeeId: true,
        isActive: true,
        assignedMandals: true,
        assignedSchools: true,
      },
    });

    const schoolAssignments: Record<string, { employeeId: string; employeeName: string; isActive: boolean }> = {};
    fieldEmployees.forEach(emp => {
      emp.assignedSchools.forEach(schId => {
        schoolAssignments[schId] = {
          employeeId: emp.id,
          employeeName: emp.name,
          isActive: emp.isActive,
        };
      });
    });

    const validCollegeSchoolSet = new Set(schools.map(s => s.id));
    const sanitizedMember = {
      ...member,
      assignedSchools: (member.assignedSchools || []).filter(sId => validCollegeSchoolSet.has(sId)),
    };

    return NextResponse.json({
      member: sanitizedMember,
      agms: agmsList,
      districts,
      mandals,
      schools,
      schoolAssignments,
    });
  } catch (error) {
    console.error('Error fetching member details:', error);
    return NextResponse.json({ error: 'Failed to fetch member details' }, { status: 500 });
  }
}
