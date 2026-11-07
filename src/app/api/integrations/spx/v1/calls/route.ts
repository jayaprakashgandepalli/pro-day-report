import { NextResponse } from 'next/server';
import { authenticateSpxM2M, SpxAuthError } from '@/lib/integrations/spx/auth';
import { checkRateLimit } from '@/lib/integrations/spx/rate-limiter';
import { recordAuditLog, getCorrelationId } from '@/lib/integrations/spx/audit-logger';
import { listCallRecords } from '@/lib/integrations/spx/call-store';

export const dynamic = 'force-dynamic';

/**
 * GET /api/integrations/spx/v1/calls
 * Retrieves tenant-scoped AI call history for staff visibility.
 * Does not include AI calls in human telecaller metrics or doorstep visit counts.
 */
export async function GET(req: Request) {
  const correlationId = getCorrelationId(req);
  const endpoint = '/api/integrations/spx/v1/calls';

  try {
    const auth = await authenticateSpxM2M(req, ['calls:read']);

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId') || undefined;
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const rateLimit = await checkRateLimit(`calls_read:${auth.collegeId}`, 120, 60, correlationId, auth.collegeId);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'RATE_LIMIT_EXCEEDED', message: 'Rate limit exceeded. Please retry later.' },
        { status: 429 }
      );
    }

    const { count, calls } = await listCallRecords(auth.collegeId, {
      studentId,
      limit,
      offset,
    });

    recordAuditLog({
      correlationId,
      collegeId: auth.collegeId,
      credentialIdentity: auth.credentialId,
      endpoint,
      action: 'CALL_HISTORY_READ',
      status: 'SUCCESS',
      detail: `Returned ${calls.length} calls (total: ${count})`,
    });

    return NextResponse.json(
      {
        success: true,
        count,
        limit,
        offset,
        calls: calls.map((c) => ({
          id: c.id,
          spxCallId: c.spxCallId,
          studentId: c.studentId,
          direction: c.direction,
          status: c.status,
          outcome: c.outcome,
          startedAt: c.startedAt,
          endedAt: c.endedAt,
          durationSeconds: c.durationSeconds,
          summary: c.summary,
          studentInterest: c.studentInterest,
          followUpRequired: c.followUpRequired,
          followUpDate: c.followUpDate,
          followUpType: c.followUpType,
          recordingUrl: c.recordingUrl,
          createdAt: c.createdAt,
        })),
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

    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

