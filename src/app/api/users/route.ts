import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// GET all users (Admin only)
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyToken(token) as { role: string } | null;
    
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        employeeId: true,
        name: true,
        role: true,
        isActive: true,
        allowedGroups: true,
        allowedLocations: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json({ users }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH toggle active status (Admin only)
export async function PATCH(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyToken(token) as { role: string; employeeId: string } | null;
    if (!payload || payload.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { employeeId, isActive } = await req.json();
    if (!employeeId) return NextResponse.json({ error: 'employeeId required' }, { status: 400 });

    // Prevent deactivating own account
    if (employeeId === payload.employeeId) {
      return NextResponse.json({ error: 'You cannot deactivate your own account.' }, { status: 400 });
    }

    // Prevent deactivating any ADMIN account
    const targetUser = await prisma.user.findUnique({ where: { employeeId }, select: { role: true } });
    if (targetUser?.role === 'ADMIN') {
      return NextResponse.json({ error: 'Admin accounts cannot be deactivated.' }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { employeeId },
      data: { isActive },
      select: { id: true, employeeId: true, name: true, isActive: true }
    });

    return NextResponse.json({ message: 'Status updated', user: updated }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST new user (Admin only)
export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyToken(token) as { role: string } | null;
    
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { employeeId, name, password, role, allowedGroups, allowedLocations } = await req.json();

    if (!employeeId || !name || !password || !role) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { employeeId } });
    if (existing) {
      return NextResponse.json({ error: 'User ID already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        employeeId,
        name,
        password: hashedPassword,
        role,
        ...(role === 'COLLEGE' && {
          allowedGroups: allowedGroups || [],
          allowedLocations: allowedLocations || []
        })
      },
      select: { id: true, employeeId: true, name: true, role: true }
    });

    return NextResponse.json({ message: 'User created', user: newUser }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT update user (Admin only)
export async function PUT(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyToken(token) as { role: string } | null;

    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { employeeId, name, password, role, allowedGroups, allowedLocations } = await req.json();

    if (!employeeId) return NextResponse.json({ error: 'employeeId required' }, { status: 400 });

    const updateData: any = { name, role };
    if (role === 'COLLEGE') {
      updateData.allowedGroups = allowedGroups || [];
      updateData.allowedLocations = allowedLocations || [];
    } else {
      updateData.allowedGroups = [];
      updateData.allowedLocations = [];
    }
    if (password && password.trim() !== '') {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updated = await prisma.user.update({
      where: { employeeId },
      data: updateData,
      select: { id: true, employeeId: true, name: true, role: true }
    });

    return NextResponse.json({ message: 'User updated', user: updated }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE user (Admin only)
export async function DELETE(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyToken(token) as { role: string } | null;

    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { employeeId } = await req.json();
    if (!employeeId) return NextResponse.json({ error: 'employeeId required' }, { status: 400 });

    await prisma.user.delete({ where: { employeeId } });

    return NextResponse.json({ message: 'User deleted' }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
