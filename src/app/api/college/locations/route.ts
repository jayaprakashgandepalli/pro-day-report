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

    // 1. Fetch Mandals, Villages, and Schools from ConfigValue
    const [mandalsRaw, villagesRaw, schoolsRaw] = await Promise.all([
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
        where: { type: 'SCHOOL', collegeId: collegeId },
        select: { id: true, value: true, parentId: true, strength: true, grade: true },
        orderBy: { value: 'asc' },
      }),
    ]);

    const mandalMap = new Map<string, { id: string; name: string }>();
    mandalsRaw.forEach(m => mandalMap.set(m.id, { id: m.id, name: m.value }));

    const villageMap = new Map<string, { id: string; name: string; mandalId: string | null }>();
    villagesRaw.forEach(v => {
      villageMap.set(v.id, {
        id: v.id,
        name: v.value,
        mandalId: v.parentId,
      });
    });

    // 2. Build enriched schools list with mapped Mandal and Village
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
        villageName,
        strength: s.strength || 0,
        grade: s.grade || '',
      };
    });

    const mandals = mandalsRaw.map(m => ({
      id: m.id,
      name: m.value,
    }));

    // 3. Fetch all Field Employees in this College to build the School Assignment Map
    const fieldEmployees = await prisma.user.findMany({
      where: {
        collegeId: collegeId,
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

    // schoolAssignments: { [schoolId]: { employeeId, employeeName, isActive } }
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

    return NextResponse.json({
      mandals,
      schools,
      schoolAssignments,
    });
  } catch (error) {
    console.error('Error fetching college locations and assignments:', error);
    return NextResponse.json({ error: 'Failed to load locations' }, { status: 500 });
  }
}
