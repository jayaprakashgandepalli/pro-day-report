import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, action, employeeId } = await req.json();

    if (!id || !['APPROVE', 'REJECT'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    
    if (action === 'APPROVE' && !employeeId) {
      return NextResponse.json({ error: 'Employee assignment is required for approval' }, { status: 400 });
    }

    const dataToUpdate: any = {
      registrationStatus: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
    };

    if (action === 'APPROVE') {
      dataToUpdate.employeeId = employeeId;
    }

    const updatedStudent = await prisma.student.update({
      where: { id },
      data: dataToUpdate
    });

    return NextResponse.json({ success: true, student: updatedStudent });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process action' }, { status: 500 });
  }
}
