import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateSpxM2M, SpxAuthError } from '@/lib/integrations/spx/auth';
import { validateStudentTenantOwnership } from '@/lib/integrations/spx/tenant';
import { checkRateLimit } from '@/lib/integrations/spx/rate-limiter';
import { recordAuditLog, getCorrelationId } from '@/lib/integrations/spx/audit-logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/integrations/spx/v1/students/[id]
 * Retrieves an allowlisted, safe student profile for the voice agent.
 * Strictly excludes marks, assessments, internal staff details, passwords, and sensitive remarks.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const correlationId = getCorrelationId(req);
  const endpoint = '/api/integrations/spx/v1/students/[id]';

  try {
    // 1. M2M Authentication with 'students:read' scope
    const auth = await authenticateSpxM2M(req, ['students:read']);

    // 2. Resolve Route Parameter
    const { id } = await params;
    if (!id || typeof id !== 'string' || id.trim() === '' || id === 'lookup') {
      return NextResponse.json(
        { success: false, error: 'INVALID_ID', message: 'A valid student ID is required' },
        { status: 400 }
      );
    }
    const studentId = id.trim();

    // 3. Rate Limiting per Tenant (120 req/min)
    const rateLimit = await checkRateLimit(`read:${auth.collegeId}`, 120, 60, correlationId, auth.collegeId);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'RATE_LIMIT_EXCEEDED',
          message: 'Rate limit exceeded. Please retry later.',
          retryAfterSeconds: rateLimit.retryAfterSeconds,
        },
        { status: 429 }
      );
    }

    // 4. Strict Multi-Tenant Boundary Validation
    const validation = await validateStudentTenantOwnership(
      studentId,
      auth.collegeId,
      correlationId,
      endpoint
    );

    if (!validation.allowed) {
      if (validation.reason === 'STUDENT_NOT_FOUND') {
        return NextResponse.json(
          { success: false, error: 'STUDENT_NOT_FOUND', message: 'Student not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { success: false, error: 'FORBIDDEN', message: 'Access to this student record is prohibited' },
        { status: 403 }
      );
    }

    // 5. Query Allowlisted Fields Only
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        studentName: true,
        fatherName: true,
        gender: true,
        phone: true,
        whatsapp: true,
        address: true,
        district: true,
        mandal: true,
        village: true,
        schoolName: true,
        schoolArea: true,
        group: true,
        educationStage: true,
        studyInterestedAt: true,
        ableToBearFee: true,
        leadStatus: true,
        collegeBranchId: true,
        collegeBranch: {
          select: {
            id: true,
            name: true,
            code: true,
            location: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!student) {
      return NextResponse.json(
        { success: false, error: 'STUDENT_NOT_FOUND', message: 'Student record not found' },
        { status: 404 }
      );
    }

    recordAuditLog({
      correlationId,
      collegeId: auth.collegeId,
      credentialIdentity: auth.credentialId,
      endpoint,
      action: 'STUDENT_PROFILE_READ',
      status: 'SUCCESS',
      detail: `Student profile retrieved for ID: ${studentId}`,
    });

    return NextResponse.json(
      {
        success: true,
        student,
      },
      { status: 200 }
    );
  } catch (err: any) {
    if (err instanceof SpxAuthError) {
      return NextResponse.json(
        { success: false, error: err.errorCode, message: err.message },
        { status: err.statusCode }
      );
    }

    recordAuditLog({
      correlationId,
      collegeId: null,
      credentialIdentity: null,
      endpoint,
      action: 'INTERNAL_ERROR',
      status: 'FAILURE',
      detail: err.message,
    });

    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

