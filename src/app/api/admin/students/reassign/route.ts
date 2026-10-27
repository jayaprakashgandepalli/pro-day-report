import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function POST(req: Request) {
  try {
    const session = await getSession(req);
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required.' }, { status: 401 });
    }

    const body = await req.json();
    const { studentId, studentIds, newEmployeeId } = body;

    if (!newEmployeeId) {
      return NextResponse.json({ error: 'Please select a staff member to assign.' }, { status: 400 });
    }

    const targetEmployee = await prisma.user.findUnique({
      where: { employeeId: newEmployeeId },
      select: { employeeId: true, name: true, role: true }
    });

    if (!targetEmployee) {
      return NextResponse.json({ error: 'Target staff member was not found.' }, { status: 404 });
    }

    const ids: string[] = [];
    if (Array.isArray(studentIds) && studentIds.length > 0) {
      ids.push(...studentIds);
    } else if (studentId) {
      ids.push(studentId);
    }

    if (ids.length === 0) {
      return NextResponse.json({ error: 'No student(s) selected for reassignment.' }, { status: 400 });
    }

    const result = await prisma.student.updateMany({
      where: { id: { in: ids } },
      data: { employeeId: newEmployeeId }
    });

    return NextResponse.json({
      success: true,
      count: result.count,
      targetEmployee: {
        employeeId: targetEmployee.employeeId,
        name: targetEmployee.name
      },
      message: `Successfully reassigned ${result.count} student(s) to ${targetEmployee.name} (${targetEmployee.employeeId})`
    });
  } catch (error) {
    console.error('Error reassigning students:', error);
    return NextResponse.json({ error: 'Failed to reassign student(s).' }, { status: 500 });
  }
}
