import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateSpxM2M, assertNoTenantMismatch, SpxAuthError } from '@/lib/integrations/spx/auth';
import { validateStudentTenantOwnership } from '@/lib/integrations/spx/tenant';
import { checkRateLimit } from '@/lib/integrations/spx/rate-limiter';
import { recordAuditLog, getCorrelationId } from '@/lib/integrations/spx/audit-logger';
import { interpretNaturalFollowUpDate, isValidFollowUpType, SUPPORTED_FOLLOW_UP_TYPES } from '@/lib/integrations/spx/date-utils';

export const dynamic = 'force-dynamic';

/**
 * GET /api/integrations/spx/v1/students/[id]/follow-up
 * Retrieves the currently stored follow-up date and type for a student.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const correlationId = getCorrelationId(req);
  const endpoint = '/api/integrations/spx/v1/students/[id]/follow-up';

  try {
    const auth = await authenticateSpxM2M(req, ['students:read']);
    const { id } = await params;

    if (!id || !id.trim()) {
      return NextResponse.json(
        { success: false, error: 'INVALID_ID', message: 'A valid student ID is required' },
        { status: 400 }
      );
    }
    const studentId = id.trim();

    const rateLimit = await checkRateLimit(`followup_read:${auth.collegeId}`, 120, 60, correlationId, auth.collegeId);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'RATE_LIMIT_EXCEEDED', message: 'Rate limit exceeded. Please retry later.' },
        { status: 429 }
      );
    }

    const validation = await validateStudentTenantOwnership(studentId, auth.collegeId, correlationId, endpoint);
    if (!validation.allowed) {
      if (validation.reason === 'STUDENT_NOT_FOUND') {
        return NextResponse.json({ success: false, error: 'STUDENT_NOT_FOUND', message: 'Student not found' }, { status: 404 });
      }
      return NextResponse.json({ success: false, error: 'FORBIDDEN', message: 'Access prohibited' }, { status: 403 });
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        studentName: true,
        nextFollowUpDate: true,
        nextFollowUpType: true,
      },
    });

    if (!student) {
      return NextResponse.json({ success: false, error: 'STUDENT_NOT_FOUND', message: 'Student record not found' }, { status: 404 });
    }

    recordAuditLog({
      correlationId,
      collegeId: auth.collegeId,
      credentialIdentity: auth.credentialId,
      endpoint,
      action: 'FOLLOW_UP_READ',
      status: 'SUCCESS',
      detail: `Student ${studentId} follow-up read`,
    });

    return NextResponse.json(
      {
        success: true,
        studentId: student.id,
        studentName: student.studentName,
        hasScheduledFollowUp: Boolean(student.nextFollowUpDate || student.nextFollowUpType),
        nextFollowUpDate: student.nextFollowUpDate,
        nextFollowUpType: student.nextFollowUpType,
      },
      { status: 200 }
    );
  } catch (err: any) {
    if (err instanceof SpxAuthError) {
      return NextResponse.json({ success: false, error: err.errorCode, message: err.message }, { status: err.statusCode });
    }
    return NextResponse.json({ success: false, error: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }, { status: 500 });
  }
}

/**
 * POST /api/integrations/spx/v1/students/[id]/follow-up
 * Schedules or updates a student's follow-up atomically.
 * Interprets natural language dates in Asia/Kolkata timezone.
 * Requires explicit caller confirmation before committing changes.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const correlationId = getCorrelationId(req);
  const endpoint = '/api/integrations/spx/v1/students/[id]/follow-up';

  try {
    const auth = await authenticateSpxM2M(req, ['students:update']);
    const { id } = await params;

    if (!id || !id.trim()) {
      return NextResponse.json(
        { success: false, error: 'INVALID_ID', message: 'A valid student ID is required' },
        { status: 400 }
      );
    }
    const studentId = id.trim();

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, error: 'INVALID_JSON', message: 'Malformed JSON payload' }, { status: 400 });
    }

    assertNoTenantMismatch(auth, body.collegeId, endpoint);

    const rateLimit = await checkRateLimit(`followup_update:${auth.collegeId}:${studentId}`, 30, 60, correlationId, auth.collegeId);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'RATE_LIMIT_EXCEEDED', message: 'Rate limit exceeded. Please retry later.' },
        { status: 429 }
      );
    }

    const validation = await validateStudentTenantOwnership(studentId, auth.collegeId, correlationId, endpoint);
    if (!validation.allowed) {
      if (validation.reason === 'STUDENT_NOT_FOUND') {
        return NextResponse.json({ success: false, error: 'STUDENT_NOT_FOUND', message: 'Student not found' }, { status: 404 });
      }
      return NextResponse.json({ success: false, error: 'FORBIDDEN', message: 'Access prohibited' }, { status: 403 });
    }

    // Check caller confirmation (Rule 1 & Rule 3: Explicit agreement & confirmation)
    const isConfirmed = Boolean(body.confirmed);
    if (!isConfirmed) {
      // If not yet confirmed by caller, parse candidate date and return for agent confirmation
      const candidateDateInput = body.followUpDate || body.dateText || body.nextFollowUpDate;
      const parsed = interpretNaturalFollowUpDate(candidateDateInput);

      if (!parsed.success || !parsed.date) {
        return NextResponse.json(
          {
            success: false,
            error: parsed.error || 'INVALID_DATE',
            message: 'Unable to resolve the spoken date. Please ask the caller to clarify.',
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          status: 'CONFIRMATION_REQUIRED',
          interpretedDate: parsed.isoString,
          humanFormattedKolkata: parsed.humanFormattedKolkata,
          suggestedConfirmationQuestion: `సరే, ${parsed.humanFormattedKolkata} తేదీన మళ్లీ కాల్ చేస్తాను. సరిపోతుందా?`,
          message: 'Please confirm this date with the caller before setting confirmed=true',
        },
        { status: 200 }
      );
    }

    // Follow-up Type Validation
    const followUpType = (body.followUpType || body.nextFollowUpType || 'Callback').trim();
    if (!isValidFollowUpType(followUpType)) {
      return NextResponse.json(
        {
          success: false,
          error: 'UNSUPPORTED_FOLLOW_UP_TYPE',
          message: `Supported types are: ${SUPPORTED_FOLLOW_UP_TYPES.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Follow-up Date Interpretation & Normalization
    const dateInput = body.followUpDate || body.dateText || body.nextFollowUpDate;
    const isEventTrigger = followUpType === 'After Exams' || followUpType === 'After Results';

    let finalDate: Date | null = null;
    let humanDateStr: string | null = null;

    if (dateInput) {
      const parsed = interpretNaturalFollowUpDate(dateInput);
      if (!parsed.success || !parsed.date) {
        return NextResponse.json(
          { success: false, error: parsed.error || 'INVALID_DATE', message: 'Invalid or ambiguous follow-up date' },
          { status: 400 }
        );
      }
      finalDate = parsed.date;
      humanDateStr = parsed.humanFormattedKolkata || null;
    } else if (!isEventTrigger) {
      return NextResponse.json(
        { success: false, error: 'DATE_REQUIRED', message: `Specific date is required for follow-up type '${followUpType}'` },
        { status: 400 }
      );
    }

    // Atomic update to Student
    const updatedStudent = await prisma.student.update({
      where: { id: studentId },
      data: {
        nextFollowUpDate: finalDate,
        nextFollowUpType: followUpType,
      },
      select: {
        id: true,
        studentName: true,
        nextFollowUpDate: true,
        nextFollowUpType: true,
      },
    });

    recordAuditLog({
      correlationId,
      collegeId: auth.collegeId,
      credentialIdentity: auth.credentialId,
      endpoint,
      action: 'FOLLOW_UP_SCHEDULED',
      status: 'SUCCESS',
      detail: `Student ${studentId} follow-up scheduled: ${followUpType} at ${finalDate ? finalDate.toISOString() : 'event trigger'}`,
    });

    return NextResponse.json(
      {
        success: true,
        studentId: updatedStudent.id,
        nextFollowUpDate: updatedStudent.nextFollowUpDate,
        nextFollowUpType: updatedStudent.nextFollowUpType,
        humanFormattedKolkata: humanDateStr,
        message: 'Follow-up successfully scheduled and saved.',
      },
      { status: 200 }
    );
  } catch (err: any) {
    if (err instanceof SpxAuthError) {
      return NextResponse.json({ success: false, error: err.errorCode, message: err.message }, { status: err.statusCode });
    }
    return NextResponse.json({ success: false, error: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }, { status: 500 });
  }
}

