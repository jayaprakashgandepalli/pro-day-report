import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, getAuthToken } from '@/lib/auth';
import { triggerOutboundStudentCall } from '@/lib/integrations/spx/spx-outbound-client';
import { getCorrelationId } from '@/lib/integrations/spx/audit-logger';

export const dynamic = 'force-dynamic';

/**
 * POST /api/students/[id]/ai-call
 * Initiates an outbound AI call via SPX Voice for an authorized student.
 * Protected by human session authentication (PRO auth_token).
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const correlationId = getCorrelationId(req);

  try {
    const { id: studentId } = await params;

    // 1. Authenticate human session
    const token = await getAuthToken(req, 'auth_token');
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: 'Authentication required' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token) as { employeeId: string; role: string } | null;
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'FORBIDDEN', message: 'Invalid or expired session token' },
        { status: 403 }
      );
    }

    const userRole = (payload.role || '').toUpperCase();
    const allowedRoles = ['TELECALLER', 'EMPLOYEE', 'COLLEGE', 'ADMIN', 'AGM', 'PRO', 'SUPERADMIN'];
    if (!allowedRoles.includes(userRole)) {
      return NextResponse.json(
        { success: false, error: 'FORBIDDEN', message: 'You do not have permission to trigger AI calls' },
        { status: 403 }
      );
    }

    // 2. Fetch student
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        college: true,
        joinedCollege: true,
      },
    });

    if (!student) {
      return NextResponse.json(
        { success: false, error: 'STUDENT_NOT_FOUND', message: 'Student not found' },
        { status: 404 }
      );
    }

    // 3. Role-based access validation
    if (userRole === 'COLLEGE') {
      const studentCollegeId = student.collegeId || student.joinedCollegeId;
      if (studentCollegeId && studentCollegeId !== payload.employeeId) {
        return NextResponse.json(
          { success: false, error: 'FORBIDDEN', message: 'Cannot initiate AI calls for students from other colleges' },
          { status: 403 }
        );
      }
    }

    if (userRole === 'TELECALLER') {
      const user = await prisma.user.findUnique({
        where: { employeeId: payload.employeeId },
        select: { assignedEmployees: true },
      });
      const assigned = user?.assignedEmployees || [];
      if (assigned.length > 0 && student.employeeId && !assigned.includes(student.employeeId)) {
        return NextResponse.json(
          { success: false, error: 'FORBIDDEN', message: 'Student is not within your assigned scope' },
          { status: 403 }
        );
      }
    }

    // 4. Parse optional custom phone override
    let customPhoneNumber: string | undefined = undefined;
    try {
      const body = await req.json();
      if (body.phoneNumber && typeof body.phoneNumber === 'string') {
        customPhoneNumber = body.phoneNumber.trim();
      }
    } catch {
      // Body is optional
    }

    // 5. Trigger Outbound Call through server-side SPX client
    const result = await triggerOutboundStudentCall({
      studentId: student.id,
      customPhoneNumber,
      requestedByEmployeeId: payload.employeeId,
      requestedByRole: userRole,
      correlationId,
    });

    if (!result.success) {
      const statusCode = result.error === 'STUDENT_NOT_FOUND' ? 404 :
                         result.error?.startsWith('SPX_40') ? 400 : 502;
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          message: result.message,
        },
        { status: statusCode }
      );
    }

    return NextResponse.json(
      {
        success: true,
        workflowRunId: result.workflowRunId,
        workflowRunName: result.workflowRunName,
        status: result.status,
        message: result.message,
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: err.message || 'An unexpected error occurred while initiating the AI call',
      },
      { status: 500 }
    );
  }
}

