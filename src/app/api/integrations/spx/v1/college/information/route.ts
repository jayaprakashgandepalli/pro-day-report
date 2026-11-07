import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateSpxM2M, SpxAuthError } from '@/lib/integrations/spx/auth';
import { checkRateLimit } from '@/lib/integrations/spx/rate-limiter';
import { recordAuditLog, getCorrelationId } from '@/lib/integrations/spx/audit-logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/integrations/spx/v1/college/information
 * Returns tenant-scoped college profile and active branches actually present in the database.
 * Never invents unverified fees, hostels, transport, or scholarships.
 */
export async function GET(req: Request) {
  const correlationId = getCorrelationId(req);
  const endpoint = '/api/integrations/spx/v1/college/information';

  try {
    // 1. M2M Authentication with 'college:read' scope
    const auth = await authenticateSpxM2M(req, ['college:read']);

    // 2. Rate Limiting per Tenant
    const rateLimit = await checkRateLimit(`college_info:${auth.collegeId}`, 120, 60, correlationId, auth.collegeId);
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

    // 3. Fetch Authenticated College Tenant
    const college = await prisma.college.findUnique({
      where: { id: auth.collegeId },
      select: {
        id: true,
        code: true,
        name: true,
        logo: true,
        phone: true,
        email: true,
        address: true,
        contactPerson: true,
        isActive: true,
      },
    });

    if (!college) {
      return NextResponse.json(
        { success: false, error: 'COLLEGE_NOT_FOUND', message: 'College record not found' },
        { status: 404 }
      );
    }

    // 4. Fetch Active Branches in the System
    const branches = await prisma.collegeBranch.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        code: true,
        location: true,
        phone: true,
      },
      orderBy: { name: 'asc' },
    });

    recordAuditLog({
      correlationId,
      collegeId: auth.collegeId,
      credentialIdentity: auth.credentialId,
      endpoint,
      action: 'COLLEGE_INFO_READ',
      status: 'SUCCESS',
      detail: `College ${college.code} retrieved with ${branches.length} active branches`,
    });

    return NextResponse.json(
      {
        success: true,
        college: {
          id: college.id,
          code: college.code,
          name: college.name,
          phone: college.phone,
          email: college.email,
          address: college.address,
          contactPerson: college.contactPerson,
          isActive: college.isActive,
        },
        branches,
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

