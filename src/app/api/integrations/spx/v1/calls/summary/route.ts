import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateSpxM2M, assertNoTenantMismatch, SpxAuthError } from '@/lib/integrations/spx/auth';
import { validateStudentTenantOwnership } from '@/lib/integrations/spx/tenant';
import { checkRateLimit } from '@/lib/integrations/spx/rate-limiter';
import { recordAuditLog, getCorrelationId } from '@/lib/integrations/spx/audit-logger';
import { ingestCallRecord } from '@/lib/integrations/spx/call-store';
import { interpretNaturalFollowUpDate, isValidFollowUpType } from '@/lib/integrations/spx/date-utils';

export const dynamic = 'force-dynamic';

/**
 * POST /api/integrations/spx/v1/calls/summary
 * Ingests SPX Voice AI call records with database-enforced idempotency.
 * Strictly isolated in SpxCallRecord; never pollutes human telecaller Visit stats.
 */
export async function POST(req: Request) {
  const correlationId = getCorrelationId(req);
  const endpoint = '/api/integrations/spx/v1/calls/summary';

  try {
    // 1. M2M Authentication with 'calls:write' scope
    const auth = await authenticateSpxM2M(req, ['calls:write']);

    // 2. Parse & Validate Payload
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'INVALID_JSON', message: 'Malformed JSON payload' },
        { status: 400 }
      );
    }

    // 3. Tenant Boundary Defense
    assertNoTenantMismatch(auth, body.collegeId, endpoint);

    // 4. Rate Limiting per College Tenant (120 call summaries/min)
    const rateLimit = await checkRateLimit(`calls_summary:${auth.collegeId}`, 120, 60, correlationId, auth.collegeId);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'RATE_LIMIT_EXCEEDED', message: 'Rate limit exceeded. Please retry later.' },
        { status: 429 }
      );
    }

    // 5. Validate Required Fields
    const spxCallId = body.spxCallId || body.callId || (body.workflow_run_id ? String(body.workflow_run_id) : null);
    if (!spxCallId || typeof spxCallId !== 'string' || !spxCallId.trim()) {
      return NextResponse.json(
        { success: false, error: 'MISSING_CALL_ID', message: 'spxCallId is required' },
        { status: 400 }
      );
    }

    const direction = (body.direction || 'OUTBOUND').toUpperCase();
    if (direction !== 'INBOUND' && direction !== 'OUTBOUND') {
      return NextResponse.json(
        { success: false, error: 'INVALID_DIRECTION', message: 'Direction must be INBOUND or OUTBOUND' },
        { status: 400 }
      );
    }

    // 6. Validate Student Ownership if Student ID is supplied
    const studentId = (body.studentId || body.student_id) && typeof (body.studentId || body.student_id) === 'string' && (body.studentId || body.student_id).trim() ? (body.studentId || body.student_id).trim() : null;

    if (studentId) {
      const studentValidation = await validateStudentTenantOwnership(
        studentId,
        auth.collegeId,
        correlationId,
        endpoint
      );

      if (!studentValidation.allowed) {
        if (studentValidation.reason === 'STUDENT_NOT_FOUND') {
          return NextResponse.json(
            { success: false, error: 'STUDENT_NOT_FOUND', message: 'Student ID not found' },
            { status: 404 }
          );
        }
        return NextResponse.json(
          { success: false, error: 'FORBIDDEN', message: 'Student belongs to a different college tenant' },
          { status: 403 }
        );
      }
    }

    // 7. Interpret Follow-Up if Required
    let validatedFollowUpDate: Date | null = null;
    let validatedFollowUpType: string | null = null;

    if (body.followUpRequired) {
      const rawDate = body.followUpDate || body.nextFollowUpDate;
      const rawType = body.followUpType || body.nextFollowUpType || 'Callback';

      if (rawType && !isValidFollowUpType(rawType)) {
        return NextResponse.json(
          { success: false, error: 'INVALID_FOLLOW_UP_TYPE', message: `Unsupported follow-up type '${rawType}'` },
          { status: 400 }
        );
      }
      validatedFollowUpType = rawType;

      if (rawDate) {
        const dateResult = interpretNaturalFollowUpDate(rawDate);
        if (!dateResult.success || !dateResult.date) {
          return NextResponse.json(
            { success: false, error: dateResult.error || 'INVALID_FOLLOW_UP_DATE', message: 'Invalid or ambiguous follow-up date' },
            { status: 400 }
          );
        }
        validatedFollowUpDate = dateResult.date;
      }
    }

    // 8. Ingest Call Record Atomically with Idempotency
    const { record, isDuplicate } = await ingestCallRecord({
      spxCallId: spxCallId.trim(),
      collegeId: auth.collegeId,
      studentId,
      direction: direction as 'INBOUND' | 'OUTBOUND',
      status: body.status || 'COMPLETED',
      outcome: body.outcome || null,
      startedAt: body.startedAt || null,
      endedAt: body.endedAt || null,
      durationSeconds: typeof body.durationSeconds === 'number' ? body.durationSeconds : (typeof body.duration === 'number' ? body.duration : 0),
      summary: body.summary || body.remarks || null,
      studentInterest: body.studentInterest || body.looking_for || null,
      collectedInfo: body.collectedInfo || null,
      followUpRequired: Boolean(body.followUpRequired),
      followUpDate: validatedFollowUpDate,
      followUpType: validatedFollowUpType,
      recordingUrl: body.recordingUrl || body.recording_url || null,
      idempotencyKey: body.idempotencyKey || null,
    });

    // 9. If Follow-Up confirmed and studentId present, atomically update Student follow-up
    if (!isDuplicate && studentId && validatedFollowUpDate && validatedFollowUpType) {
      await prisma.student.update({
        where: { id: studentId },
        data: {
          nextFollowUpDate: validatedFollowUpDate,
          nextFollowUpType: validatedFollowUpType,
        },
      });
    }

    recordAuditLog({
      correlationId,
      collegeId: auth.collegeId,
      credentialIdentity: auth.credentialId,
      endpoint,
      action: 'CALL_SUMMARY_INGESTED',
      status: 'SUCCESS',
      detail: `Call ${spxCallId} ingested (isDuplicate: ${isDuplicate}, studentId: ${studentId || 'none'})`,
    });

    return NextResponse.json(
      {
        success: true,
        callId: record.spxCallId,
        id: record.id,
        isDuplicate,
        status: record.status,
        followUpScheduled: Boolean(validatedFollowUpDate),
        message: isDuplicate ? 'Call summary already exists (idempotent response)' : 'Call summary successfully recorded',
      },
      { status: isDuplicate ? 200 : 201 }
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

