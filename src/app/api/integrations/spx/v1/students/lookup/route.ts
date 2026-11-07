import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateSpxM2M, assertNoTenantMismatch, SpxAuthError } from '@/lib/integrations/spx/auth';
import { buildTenantStudentWhereClause } from '@/lib/integrations/spx/tenant';
import { checkRateLimit } from '@/lib/integrations/spx/rate-limiter';
import { recordAuditLog, getCorrelationId } from '@/lib/integrations/spx/audit-logger';
import { normalizePhoneNumber } from '@/lib/phone';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

/**
 * POST /api/integrations/spx/v1/students/lookup
 * Secure, tenant-isolated phone lookup returning minimal non-sensitive candidate details.
 */
export async function POST(req: Request) {
  const correlationId = getCorrelationId(req);
  const endpoint = '/api/integrations/spx/v1/students/lookup';

  try {
    // 1. M2M Authentication & Permissions
    const auth = await authenticateSpxM2M(req, ['students:lookup']);

    // 2. Parse & Validate Payload
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'INVALID_JSON', message: 'Malformed JSON in request body' },
        { status: 400 }
      );
    }

    // 3. Tenant Boundary Defense: Reject client-supplied collegeId spoofing
    assertNoTenantMismatch(auth, body.collegeId, endpoint);

    // 4. Rate Limiting per College Tenant (60 lookups/min)
    const rateLimit = await checkRateLimit(`lookup:${auth.collegeId}`, 60, 60, correlationId, auth.collegeId);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'RATE_LIMIT_EXCEEDED',
          message: 'Lookup rate limit exceeded. Please retry later.',
          retryAfterSeconds: rateLimit.retryAfterSeconds,
        },
        { status: 429 }
      );
    }

    // 5. Phone Normalization & Validation
    const rawPhone = body.phone;
    if (!rawPhone || typeof rawPhone !== 'string' || !rawPhone.trim()) {
      return NextResponse.json(
        { success: false, error: 'MISSING_PHONE', message: 'A valid phone number is required' },
        { status: 400 }
      );
    }

    const normalized = normalizePhoneNumber(rawPhone);
    if (!normalized || normalized.length < 10) {
      return NextResponse.json(
        { success: false, error: 'INVALID_PHONE', message: 'Phone number must contain at least 10 digits' },
        { status: 400 }
      );
    }

    // 6. Build Multi-Tenant Scoped Where Clause
    const phoneVariants = [normalized, `+91${normalized}`, `91${normalized}`, `0${normalized}`];
    const phoneFilter: Prisma.StudentWhereInput = {
      OR: [
        { phone: { in: phoneVariants } },
        { phone: { endsWith: normalized } },
        { whatsapp: { in: phoneVariants } },
        { whatsapp: { endsWith: normalized } },
      ],
    };

    const whereClause = buildTenantStudentWhereClause(auth.collegeId, phoneFilter);

    // 7. Query Students with Allowlisted Distinguishing Fields Only
    const students = await prisma.student.findMany({
      where: whereClause,
      select: {
        id: true,
        studentName: true,
        fatherName: true,
        schoolName: true,
        educationStage: true,
        group: true,
      },
      take: 10,
    });

    // 8. Audit Logging (Zero raw phone logging)
    recordAuditLog({
      correlationId,
      collegeId: auth.collegeId,
      credentialIdentity: auth.credentialId,
      endpoint,
      action: 'STUDENT_LOOKUP',
      status: 'SUCCESS',
      detail: `Matches count: ${students.length}`,
    });

    // 9. Structured Response
    if (students.length === 0) {
      return NextResponse.json(
        {
          success: true,
          status: 'NOT_FOUND',
          matchesCount: 0,
          candidates: [],
          message: 'No student found matching the provided phone number within the college.',
        },
        { status: 200 }
      );
    }

    if (students.length === 1) {
      return NextResponse.json(
        {
          success: true,
          status: 'FOUND',
          matchesCount: 1,
          candidates: students,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        status: 'MULTIPLE_MATCHES',
        matchesCount: students.length,
        candidates: students,
        message: 'Multiple students match this phone number. Disambiguate using student name or school.',
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

