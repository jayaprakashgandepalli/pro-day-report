import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

// GET all schools belonging to this college
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

    if (!currentUser || !currentUser.collegeId) {
      return NextResponse.json({ error: 'College not found' }, { status: 404 });
    }

    const collegeId = currentUser.collegeId;

    // 1. Fetch all Mandals and Villages (for selection dropdowns)
    const [mandalsRaw, villagesRaw] = await Promise.all([
      prisma.configValue.findMany({
        where: { type: 'MANDAL' },
        select: { id: true, value: true, parentId: true },
        orderBy: { value: 'asc' },
      }),
      prisma.configValue.findMany({
        where: { type: 'VILLAGE' },
        select: { id: true, value: true, parentId: true },
        orderBy: { value: 'asc' },
      }),
    ]);

    const mandalMap = new Map<string, { id: string; name: string }>();
    mandalsRaw.forEach(m => mandalMap.set(m.id, { id: m.id, name: m.value }));

    const villageMap = new Map<string, { id: string; name: string; mandalId: string | null }>();
    villagesRaw.forEach(v => villageMap.set(v.id, { id: v.id, name: v.value, mandalId: v.parentId }));

    // 2. Fetch schools belonging STRICTLY to this college
    const collegeSchoolsRaw = await prisma.configValue.findMany({
      where: {
        type: 'SCHOOL',
        collegeId: collegeId,
      },
      orderBy: { createdAt: 'desc' },
    });

    // 3. Fetch Field Staff in this college to map who is assigned to which school
    const fieldStaff = await prisma.user.findMany({
      where: {
        collegeId: collegeId,
        role: 'EMPLOYEE',
      },
      select: {
        id: true,
        name: true,
        employeeId: true,
        assignedSchools: true,
      },
    });

    const assignmentMap: Record<string, { employeeId: string; employeeName: string }> = {};
    fieldStaff.forEach(staff => {
      staff.assignedSchools.forEach(schId => {
        assignmentMap[schId] = {
          employeeId: staff.id,
          employeeName: staff.name,
        };
      });
    });

    // 4. Enrich schools with Mandal & Village names, plus Assigned Staff
    const schools = collegeSchoolsRaw.map(s => {
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
      const assigned = assignmentMap[s.id] || null;

      return {
        id: s.id,
        name: s.value,
        parentId: s.parentId,
        mandalId: mandalId,
        mandalName: mandal ? mandal.name : 'Other / General',
        villageName,
        strength: s.strength || 0,
        grade: s.grade || '',
        headmasterName: s.headmasterName || '',
        headmasterPhone: s.headmasterPhone || '',
        keyPersonName: s.keyPersonName || '',
        keyPersonPhone: s.keyPersonPhone || '',
        assignedStaff: assigned,
        createdAt: s.createdAt,
      };
    });

    const mandals = mandalsRaw.map(m => ({ id: m.id, name: m.value }));
    const villages = villagesRaw.map(v => ({ id: v.id, name: v.value, mandalId: v.parentId }));

    return NextResponse.json({
      schools,
      mandals,
      villages,
      totalCount: schools.length,
      assignedCount: schools.filter(s => s.assignedStaff).length,
      unassignedCount: schools.filter(s => !s.assignedStaff).length,
    });
  } catch (error) {
    console.error('Error fetching college schools:', error);
    return NextResponse.json({ error: 'Failed to fetch schools' }, { status: 500 });
  }
}

// POST create a new school for this college
export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || session.role !== 'COLLEGE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { employeeId: session.employeeId },
    });

    if (!currentUser || !currentUser.collegeId) {
      return NextResponse.json({ error: 'College not found' }, { status: 404 });
    }

    const body = await req.json();
    const {
      name,
      mandalId,
      villageId,
      strength,
      grade,
      headmasterName,
      headmasterPhone,
      keyPersonName,
      keyPersonPhone,
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'School name is required' }, { status: 400 });
    }

    if (!mandalId) {
      return NextResponse.json({ error: 'Please select a Mandal' }, { status: 400 });
    }

    // Determine parentId: if villageId provided, use villageId; otherwise use mandalId
    const targetParentId = villageId || mandalId;

    let parsedStrength = 0;
    if (strength !== undefined && strength !== null && strength !== '') {
      const num = parseInt(strength, 10);
      parsedStrength = isNaN(num) ? 0 : num;
    }

    const newSchool = await prisma.configValue.create({
      data: {
        type: 'SCHOOL',
        value: name.trim(),
        parentId: targetParentId,
        collegeId: currentUser.collegeId,
        strength: parsedStrength,
        grade: grade ? String(grade).trim() : null,
        headmasterName: headmasterName ? String(headmasterName).trim() : null,
        headmasterPhone: headmasterPhone ? String(headmasterPhone).trim() : null,
        keyPersonName: keyPersonName ? String(keyPersonName).trim() : null,
        keyPersonPhone: keyPersonPhone ? String(keyPersonPhone).trim() : null,
      },
    });

    return NextResponse.json(newSchool, { status: 201 });
  } catch (error) {
    console.error('Error creating college school:', error);
    return NextResponse.json({ error: 'Failed to create school' }, { status: 500 });
  }
}

// PUT update a school for this college
export async function PUT(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || session.role !== 'COLLEGE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { employeeId: session.employeeId },
    });

    if (!currentUser || !currentUser.collegeId) {
      return NextResponse.json({ error: 'College not found' }, { status: 404 });
    }

    const body = await req.json();
    const {
      id,
      name,
      mandalId,
      villageId,
      strength,
      grade,
      headmasterName,
      headmasterPhone,
      keyPersonName,
      keyPersonPhone,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'School ID is required' }, { status: 400 });
    }

    // Verify school belongs to this college
    const existing = await prisma.configValue.findFirst({
      where: {
        id,
        collegeId: currentUser.collegeId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'School not found in your college' }, { status: 404 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.value = name.trim();
    if (villageId !== undefined && villageId) {
      updateData.parentId = villageId;
    } else if (mandalId !== undefined && mandalId) {
      updateData.parentId = mandalId;
    }

    if (strength !== undefined) {
      const num = parseInt(strength, 10);
      updateData.strength = isNaN(num) ? 0 : num;
    }
    if (grade !== undefined) updateData.grade = grade ? String(grade).trim() : null;
    if (headmasterName !== undefined) updateData.headmasterName = headmasterName ? String(headmasterName).trim() : null;
    if (headmasterPhone !== undefined) updateData.headmasterPhone = headmasterPhone ? String(headmasterPhone).trim() : null;
    if (keyPersonName !== undefined) updateData.keyPersonName = keyPersonName ? String(keyPersonName).trim() : null;
    if (keyPersonPhone !== undefined) updateData.keyPersonPhone = keyPersonPhone ? String(keyPersonPhone).trim() : null;

    const updated = await prisma.configValue.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating college school:', error);
    return NextResponse.json({ error: 'Failed to update school' }, { status: 500 });
  }
}

// DELETE a school from this college
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || session.role !== 'COLLEGE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { employeeId: session.employeeId },
    });

    if (!currentUser || !currentUser.collegeId) {
      return NextResponse.json({ error: 'College not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'School ID is required' }, { status: 400 });
    }

    // Verify school belongs to this college
    const existing = await prisma.configValue.findFirst({
      where: {
        id,
        collegeId: currentUser.collegeId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'School not found in your college' }, { status: 404 });
    }

    // Delete the school
    await prisma.configValue.delete({
      where: { id },
    });

    // Also remove from any staff's assignedSchools in this college
    const staffWithSchool = await prisma.user.findMany({
      where: {
        collegeId: currentUser.collegeId,
        assignedSchools: { has: id },
      },
      select: { id: true, assignedSchools: true },
    });

    for (const staff of staffWithSchool) {
      await prisma.user.update({
        where: { id: staff.id },
        data: {
          assignedSchools: staff.assignedSchools.filter(s => s !== id),
        },
      });
    }

    return NextResponse.json({ success: true, message: 'School deleted successfully' });
  } catch (error) {
    console.error('Error deleting college school:', error);
    return NextResponse.json({ error: 'Failed to delete school' }, { status: 500 });
  }
}
