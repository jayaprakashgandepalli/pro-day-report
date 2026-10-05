import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyToken(token) as { employeeId: string; role: string } | null;

    if (!payload || (payload.role !== 'EMPLOYEE' && payload.role !== 'ADMIN' && payload.role !== 'COLLEGE')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const existingTask = await prisma.employeeTask.findUnique({
      where: { id },
    });

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Verify ownership: only the assigned employee or Admin/College can modify it
    if (payload.role === 'EMPLOYEE' && existingTask.employeeId !== payload.employeeId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const updateData: any = {};

    if (body.title !== undefined) updateData.title = body.title.trim();
    if (body.description !== undefined) updateData.description = body.description ? body.description.trim() : null;
    if (body.category !== undefined) updateData.category = body.category ? body.category.trim() : 'COLLEGE_DUTY';
    if (body.assignedBy !== undefined) updateData.assignedBy = body.assignedBy ? body.assignedBy.trim() : null;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.endDate !== undefined) updateData.endDate = new Date(body.endDate);
    if (body.startDate !== undefined) updateData.startDate = new Date(body.startDate);

    // Handling Status change (e.g. COMPLETED)
    if (body.status !== undefined) {
      updateData.status = body.status;
      if (body.status === 'COMPLETED') {
        updateData.completedAt = body.completedAt ? new Date(body.completedAt) : new Date();
        if (body.completionNotes !== undefined) {
          updateData.completionNotes = body.completionNotes ? body.completionNotes.trim() : null;
        }
      } else {
        // Reset completion info if changed back from completed
        updateData.completedAt = null;
        if (body.completionNotes !== undefined) {
          updateData.completionNotes = body.completionNotes ? body.completionNotes.trim() : null;
        }
      }
    } else if (body.completionNotes !== undefined) {
      updateData.completionNotes = body.completionNotes ? body.completionNotes.trim() : null;
    }

    const updatedTask = await prisma.employeeTask.update({
      where: { id },
      data: updateData,
      include: {
        employee: {
          select: { name: true, employeeId: true }
        }
      }
    });

    return NextResponse.json({
      message: 'Task updated successfully',
      task: updatedTask,
    }, { status: 200 });

  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyToken(token) as { employeeId: string; role: string } | null;

    if (!payload || (payload.role !== 'EMPLOYEE' && payload.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const existingTask = await prisma.employeeTask.findUnique({
      where: { id },
    });

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    if (payload.role === 'EMPLOYEE' && existingTask.employeeId !== payload.employeeId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.employeeTask.delete({
      where: { id },
    });

    return NextResponse.json({
      message: 'Task deleted successfully',
    }, { status: 200 });

  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
