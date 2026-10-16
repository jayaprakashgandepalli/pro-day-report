import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import bcrypt from 'bcryptjs';

// GET all colleges
export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const colleges = await prisma.college.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            users: true,
            students: true,
          },
        },
        users: {
          select: {
            id: true,
            employeeId: true,
            name: true,
            role: true,
            isActive: true,
          },
        },
      },
    });

    return NextResponse.json(colleges);
  } catch (error) {
    console.error('Error fetching colleges:', error);
    return NextResponse.json({ error: 'Failed to fetch colleges' }, { status: 500 });
  }
}

// POST create a new college with subscription & role quotas
export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      code,
      contactPerson,
      phone,
      email,
      address,
      maxStudents,
      maxAgms,
      maxTelecallers,
      maxEmployees,
      subscriptionPlan,
      subscriptionPrice,
      subscriptionEnd,
      isActive,
      adminUsername,
      adminPassword,
    } = body;

    if (!name || !code || !adminUsername || !adminPassword) {
      return NextResponse.json(
        { error: 'College Name, Code, Admin Username and Password are required.' },
        { status: 400 }
      );
    }

    const cleanCode = code.trim().toUpperCase().replace(/\s+/g, '_');
    const cleanUsername = adminUsername.trim().toLowerCase();

    // Check unique code
    const existingCode = await prisma.college.findUnique({
      where: { code: cleanCode },
    });
    if (existingCode) {
      return NextResponse.json(
        { error: `College Code "${cleanCode}" is already in use.` },
        { status: 400 }
      );
    }

    // Check unique admin username
    const existingUser = await prisma.user.findUnique({
      where: { employeeId: cleanUsername },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: `User ID "${cleanUsername}" is already taken.` },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const result = await prisma.$transaction(async (tx) => {
      const college = await tx.college.create({
        data: {
          name: name.trim(),
          code: cleanCode,
          contactPerson: contactPerson?.trim() || null,
          phone: phone?.trim() || null,
          email: email?.trim() || null,
          address: address?.trim() || null,
          maxStudents: maxStudents ? parseInt(maxStudents) : 5000,
          maxAgms: maxAgms ? parseInt(maxAgms) : 2,
          maxTelecallers: maxTelecallers ? parseInt(maxTelecallers) : 5,
          maxEmployees: maxEmployees ? parseInt(maxEmployees) : 10,
          subscriptionPlan: subscriptionPlan || 'YEARLY',
          subscriptionPrice: subscriptionPrice ? parseFloat(subscriptionPrice) : 0,
          subscriptionEnd: subscriptionEnd ? new Date(subscriptionEnd) : null,
          isActive: isActive !== undefined ? Boolean(isActive) : true,
        },
      });

      const adminUser = await tx.user.create({
        data: {
          employeeId: cleanUsername,
          name: `${name.trim()} Admin`,
          password: hashedPassword,
          role: 'COLLEGE',
          collegeId: college.id,
          isActive: true,
        },
      });

      return { college, adminUser };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error creating college:', error);
    return NextResponse.json({ error: 'Failed to create college' }, { status: 500 });
  }
}

// PUT update college details, quotas, subscription or status
export async function PUT(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      id,
      name,
      contactPerson,
      phone,
      email,
      address,
      maxStudents,
      maxAgms,
      maxTelecallers,
      maxEmployees,
      subscriptionPlan,
      subscriptionPrice,
      subscriptionEnd,
      isActive,
      newPassword,
      adminUserId,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'College ID is required' }, { status: 400 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (contactPerson !== undefined) updateData.contactPerson = contactPerson?.trim() || null;
    if (phone !== undefined) updateData.phone = phone?.trim() || null;
    if (email !== undefined) updateData.email = email?.trim() || null;
    if (address !== undefined) updateData.address = address?.trim() || null;
    if (maxStudents !== undefined) updateData.maxStudents = parseInt(maxStudents);
    if (maxAgms !== undefined) updateData.maxAgms = parseInt(maxAgms);
    if (maxTelecallers !== undefined) updateData.maxTelecallers = parseInt(maxTelecallers);
    if (maxEmployees !== undefined) updateData.maxEmployees = parseInt(maxEmployees);
    if (subscriptionPlan !== undefined) updateData.subscriptionPlan = subscriptionPlan;
    if (subscriptionPrice !== undefined) updateData.subscriptionPrice = parseFloat(subscriptionPrice);
    if (subscriptionEnd !== undefined) updateData.subscriptionEnd = subscriptionEnd ? new Date(subscriptionEnd) : null;
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    const updatedCollege = await prisma.college.update({
      where: { id },
      data: updateData,
    });

    // Reset password if requested
    if (newPassword && adminUserId) {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { id: adminUserId },
        data: { password: hashedPassword },
      });
    }

    return NextResponse.json(updatedCollege);
  } catch (error) {
    console.error('Error updating college:', error);
    return NextResponse.json({ error: 'Failed to update college' }, { status: 500 });
  }
}
