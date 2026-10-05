import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyToken(token) as { employeeId: string; role: string } | null;

    if (!payload || (payload.role !== 'EMPLOYEE' && payload.role !== 'ADMIN' && payload.role !== 'COLLEGE')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status') || 'ALL'; // ALL, PENDING, IN_PROGRESS, COMPLETED, OVERDUE
    const priorityFilter = searchParams.get('priority') || 'ALL';
    const categoryFilter = searchParams.get('category') || 'ALL';
    const search = searchParams.get('search')?.trim();
    const employeeIdParam = searchParams.get('employeeId');

    const where: any = {};

    // Scope by employee unless Admin or College viewing a specific employee
    if (payload.role === 'EMPLOYEE') {
      where.employeeId = payload.employeeId;
    } else if (employeeIdParam) {
      where.employeeId = employeeIdParam;
    }

    if (priorityFilter && priorityFilter !== 'ALL') {
      where.priority = priorityFilter;
    }

    if (categoryFilter && categoryFilter !== 'ALL') {
      where.category = categoryFilter;
    }

    const now = new Date();

    if (statusFilter === 'OVERDUE') {
      where.status = { not: 'COMPLETED' };
      where.endDate = { lt: now };
    } else if (statusFilter === 'PENDING') {
      where.status = 'PENDING';
    } else if (statusFilter === 'IN_PROGRESS') {
      where.status = 'IN_PROGRESS';
    } else if (statusFilter === 'COMPLETED') {
      where.status = 'COMPLETED';
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { assignedBy: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ];
    }

    const tasks = await prisma.employeeTask.findMany({
      where,
      orderBy: [
        { status: 'asc' }, // Pending / In progress first
        { endDate: 'asc' },  // Closest deadlines first
      ],
      include: {
        employee: {
          select: { name: true, employeeId: true }
        }
      }
    });

    // Compute stats for the current employee (or current filter scope)
    const baseScope: any = {};
    if (payload.role === 'EMPLOYEE') {
      baseScope.employeeId = payload.employeeId;
    } else if (employeeIdParam) {
      baseScope.employeeId = employeeIdParam;
    }

    const [totalCount, pendingCount, inProgressCount, completedCount, overdueCount] = await Promise.all([
      prisma.employeeTask.count({ where: baseScope }),
      prisma.employeeTask.count({ where: { ...baseScope, status: 'PENDING' } }),
      prisma.employeeTask.count({ where: { ...baseScope, status: 'IN_PROGRESS' } }),
      prisma.employeeTask.count({ where: { ...baseScope, status: 'COMPLETED' } }),
      prisma.employeeTask.count({
        where: {
          ...baseScope,
          status: { not: 'COMPLETED' },
          endDate: { lt: now }
        }
      })
    ]);

    return NextResponse.json({
      tasks,
      stats: {
        total: totalCount,
        pending: pendingCount,
        inProgress: inProgressCount,
        completed: completedCount,
        overdue: overdueCount,
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching employee tasks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyToken(token) as { employeeId: string; role: string } | null;

    if (!payload || (payload.role !== 'EMPLOYEE' && payload.role !== 'ADMIN' && payload.role !== 'COLLEGE')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const {
      title,
      description,
      category,
      assignedBy,
      startDate,
      endDate,
      priority,
      targetEmployeeId, // For Admin or College to assign to a specific employee
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Work title is required' }, { status: 400 });
    }

    if (!endDate) {
      return NextResponse.json({ error: 'End date (deadline) is required' }, { status: 400 });
    }

    const effectiveEmployeeId = (payload.role === 'ADMIN' || payload.role === 'COLLEGE') && targetEmployeeId
      ? targetEmployeeId
      : payload.employeeId;

    const task = await prisma.employeeTask.create({
      data: {
        employeeId: effectiveEmployeeId,
        title: title.trim(),
        description: description?.trim() || null,
        category: category?.trim() || 'COLLEGE_DUTY',
        assignedBy: assignedBy?.trim() || 'College Management',
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: new Date(endDate),
        priority: priority || 'MEDIUM',
        status: 'PENDING',
      },
      include: {
        employee: {
          select: { name: true, employeeId: true }
        }
      }
    });

    return NextResponse.json({
      message: 'Task added successfully',
      task,
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
