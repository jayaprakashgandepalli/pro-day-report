import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import bcrypt from 'bcryptjs';

// GET all team members, quotas, and list of AGMs
export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || session.role !== 'COLLEGE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current college admin user from DB
    const currentUser = await prisma.user.findUnique({
      where: { employeeId: session.employeeId },
      include: { college: true },
    });

    if (!currentUser || !currentUser.collegeId || !currentUser.college) {
      return NextResponse.json({ error: 'College profile not found' }, { status: 404 });
    }

    const college = currentUser.college;

    // Get all team members created under this college
    const team = await prisma.user.findMany({
      where: {
        collegeId: college.id,
        id: { not: currentUser.id }, // exclude primary college admin
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
      orderBy: { createdAt: 'desc' },
    });

    // Fetch valid school IDs created by this specific college
    const collegeSchools = await prisma.configValue.findMany({
      where: { type: 'SCHOOL', collegeId: college.id },
      select: { id: true },
    });
    const validCollegeSchoolSet = new Set(collegeSchools.map(s => s.id));

    // Sanitize team so assignedSchools strictly contains only this college's schools
    const sanitizedTeam = team.map(u => ({
      ...u,
      assignedSchools: (u.assignedSchools || []).filter(sId => validCollegeSchoolSet.has(sId)),
    }));

    const agmsList = sanitizedTeam
      .filter(u => u.role === 'AGM')
      .map(u => ({ id: u.id, employeeId: u.employeeId, name: u.name }));

    const agmsCount = agmsList.length;
    const telecallersCount = sanitizedTeam.filter(u => u.role === 'TELECALLER').length;
    const employeesCount = sanitizedTeam.filter(u => u.role === 'EMPLOYEE').length;

    return NextResponse.json({
      college: {
        id: college.id,
        name: college.name,
        code: college.code,
        subscriptionPlan: college.subscriptionPlan,
        subscriptionEnd: college.subscriptionEnd,
        isActive: college.isActive,
      },
      quotas: {
        agms: { used: agmsCount, max: college.maxAgms || 2 },
        telecallers: { used: telecallersCount, max: college.maxTelecallers || 5 },
        employees: { used: employeesCount, max: college.maxEmployees || 10 },
      },
      agms: agmsList,
      team: sanitizedTeam,
    });
  } catch (error) {
    console.error('Error fetching college team:', error);
    return NextResponse.json({ error: 'Failed to fetch team members' }, { status: 500 });
  }
}

// POST create a new team member (AGM, Telecaller, or Field Employee)
export async function POST(req: NextRequest) {
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

    const college = currentUser.college;

    if (!college.isActive) {
      return NextResponse.json(
        { error: 'Your college subscription is disabled. Please contact Support Team.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, employeeId, password, role, assignedAgms, assignedMandals, assignedSchools } = body;

    if (!name || !employeeId || !password || !role) {
      return NextResponse.json(
        { error: 'Name, User ID, Password, and Role are required.' },
        { status: 400 }
      );
    }

    const validRoles = ['AGM', 'TELECALLER', 'EMPLOYEE'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role specified.' }, { status: 400 });
    }

    // Check Quota Limits
    const currentCount = await prisma.user.count({
      where: {
        collegeId: college.id,
        role: role,
        id: { not: currentUser.id },
      },
    });

    if (role === 'AGM' && currentCount >= (college.maxAgms || 2)) {
      return NextResponse.json(
        { error: `AGM quota limit reached (${currentCount}/${college.maxAgms}). Please contact Support Team to upgrade your seats.` },
        { status: 400 }
      );
    }

    if (role === 'TELECALLER' && currentCount >= (college.maxTelecallers || 5)) {
      return NextResponse.json(
        { error: `Telecaller quota limit reached (${currentCount}/${college.maxTelecallers}). Please contact Support Team to upgrade your seats.` },
        { status: 400 }
      );
    }

    if (role === 'EMPLOYEE' && currentCount >= (college.maxEmployees || 10)) {
      return NextResponse.json(
        { error: `Employee quota limit reached (${currentCount}/${college.maxEmployees}). Please contact Support Team to upgrade your seats.` },
        { status: 400 }
      );
    }

    const cleanUsername = employeeId.trim().toLowerCase();

    // Check unique employeeId
    const existing = await prisma.user.findUnique({
      where: { employeeId: cleanUsername },
    });

    if (existing) {
      return NextResponse.json(
        { error: `User ID "${cleanUsername}" is already taken. Please choose another ID.` },
        { status: 400 }
      );
    }

    let initialSchools: string[] = [];
    let initialMandals: string[] = [];

    if (role === 'EMPLOYEE') {
      if (Array.isArray(assignedMandals)) {
        initialMandals = assignedMandals;
      }
      if (Array.isArray(assignedSchools) && assignedSchools.length > 0) {
        // Validate exclusive 1 school = 1 staff rule within this college
        const otherStaff = await prisma.user.findMany({
          where: {
            collegeId: college.id,
            role: 'EMPLOYEE',
          },
          select: { id: true, name: true, assignedSchools: true },
        });

        for (const staff of otherStaff) {
          const conflicting = assignedSchools.find((schId: string) => staff.assignedSchools.includes(schId));
          if (conflicting) {
            const schRec = await prisma.configValue.findUnique({ where: { id: conflicting } });
            return NextResponse.json(
              {
                error: `School "${schRec?.value || conflicting}" is already assigned to "${staff.name}". In this college, each school can only be assigned to 1 field employee.`,
              },
              { status: 400 }
            );
          }
        }
        initialSchools = assignedSchools;
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newMember = await prisma.user.create({
      data: {
        employeeId: cleanUsername,
        name: name.trim(),
        password: hashedPassword,
        role: role,
        collegeId: college.id,
        assignedAgms: (role === 'TELECALLER' || role === 'EMPLOYEE') && Array.isArray(assignedAgms) ? assignedAgms : [],
        assignedMandals: initialMandals,
        assignedSchools: initialSchools,
        isActive: true,
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
      },
    });

    return NextResponse.json(newMember, { status: 201 });
  } catch (error) {
    console.error('Error creating college team member:', error);
    return NextResponse.json({ error: 'Failed to create team member' }, { status: 500 });
  }
}

// PUT update team member, assigned AGMs, locations, or reset password
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
    const { id, name, isActive, newPassword, assignedAgms, assignedMandals, assignedSchools } = body;

    if (!id) {
      return NextResponse.json({ error: 'Member ID is required' }, { status: 400 });
    }

    // Verify member belongs to this college
    const member = await prisma.user.findFirst({
      where: { id, collegeId: currentUser.collegeId },
    });

    if (!member) {
      return NextResponse.json({ error: 'Member not found or not in your college' }, { status: 404 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);
    if (assignedAgms !== undefined) {
      updateData.assignedAgms = Array.isArray(assignedAgms) ? assignedAgms : [];
    }
    if (assignedMandals !== undefined) {
      updateData.assignedMandals = Array.isArray(assignedMandals) ? assignedMandals : [];
    }
    if (assignedSchools !== undefined) {
      const targetSchools: string[] = Array.isArray(assignedSchools) ? assignedSchools : [];

      // Check conflicts: strictly 1 school = 1 employee in this college!
      if (targetSchools.length > 0) {
        const otherStaff = await prisma.user.findMany({
          where: {
            collegeId: currentUser.collegeId,
            role: 'EMPLOYEE',
            id: { not: member.id },
          },
          select: {
            id: true,
            name: true,
            assignedSchools: true,
          },
        });

        for (const staff of otherStaff) {
          const conflicting = targetSchools.find(schId => staff.assignedSchools.includes(schId));
          if (conflicting) {
            const schRec = await prisma.configValue.findUnique({ where: { id: conflicting } });
            return NextResponse.json(
              {
                error: `School "${schRec?.value || conflicting}" is already assigned to "${staff.name}". In this college, each school can only be assigned to 1 field employee.`,
              },
              { status: 400 }
            );
          }
        }
      }

      updateData.assignedSchools = targetSchools;
    }

    if (newPassword && newPassword.trim()) {
      updateData.password = await bcrypt.hash(newPassword.trim(), 10);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        employeeId: true,
        name: true,
        role: true,
        isActive: true,
        assignedAgms: true,
        assignedMandals: true,
        assignedSchools: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating team member:', error);
    return NextResponse.json({ error: 'Failed to update team member' }, { status: 500 });
  }
}
