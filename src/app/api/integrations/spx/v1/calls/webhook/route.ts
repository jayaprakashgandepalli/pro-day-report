import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateSpxM2M, extractM2MBearerToken, SpxAuthError } from '@/lib/integrations/spx/auth';
import { recordAuditLog, getCorrelationId } from '@/lib/integrations/spx/audit-logger';
import { ingestCallRecord } from '@/lib/integrations/spx/call-store';
import { normalizeSpxWebhookPayload } from '@/lib/integrations/spx/webhook-normalizer';

export const dynamic = 'force-dynamic';

/**
 * POST /api/integrations/spx/v1/calls/webhook
 * Ingests SPX Voice post-call webhook payloads.
 * Supports SPX's native post-call payload structure and maps it to SpxCallRecord.
 * Enforces strict database-level idempotency to prevent duplicate call records.
 */
export async function POST(req: Request) {
  const correlationId = getCorrelationId(req);
  const endpoint = '/api/integrations/spx/v1/calls/webhook';

  try {
    // 1. Security Verification: Webhook Secret or M2M Bearer Token
    const configuredSecret = process.env.SPX_WEBHOOK_SECRET;
    const incomingSecret = req.headers.get('x-spx-webhook-secret') || req.headers.get('X-SPX-Webhook-Secret');
    const bearerToken = extractM2MBearerToken(req);

    let authenticatedCollegeId: string | undefined = undefined;

    if (configuredSecret && configuredSecret.trim()) {
      if (incomingSecret !== configuredSecret.trim()) {
        recordAuditLog({
          correlationId,
          collegeId: null,
          credentialIdentity: null,
          endpoint,
          action: 'WEBHOOK_AUTH_FAILED',
          status: 'BLOCKED',
          detail: 'Invalid or missing X-SPX-Webhook-Secret header',
        });
        return NextResponse.json(
          { success: false, error: 'UNAUTHORIZED', message: 'Invalid webhook secret' },
          { status: 401 }
        );
      }
    } else if (bearerToken) {
      // Authenticate via M2M JWT
      const auth = await authenticateSpxM2M(req, ['calls:write']);
      authenticatedCollegeId = auth.collegeId;
    } else {
      // Neither configured secret nor token provided
      recordAuditLog({
        correlationId,
        collegeId: null,
        credentialIdentity: null,
        endpoint,
        action: 'WEBHOOK_UNCONFIGURED',
        status: 'BLOCKED',
        detail: 'No valid webhook secret or Authorization Bearer header provided',
      });
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: 'Authentication required for webhook delivery' },
        { status: 401 }
      );
    }

    // 2. Parse Raw Payload
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'INVALID_JSON', message: 'Malformed JSON payload' },
        { status: 400 }
      );
    }

    // 3. Normalize SPX Raw Payload into PRO Schema
    const { callSummaryInput, matchedStudentId, resolvedCollegeId } = await normalizeSpxWebhookPayload(
      body,
      authenticatedCollegeId
    );

    if (!resolvedCollegeId) {
      return NextResponse.json(
        { success: false, error: 'UNRESOLVED_TENANT', message: 'Unable to resolve college tenant for call summary' },
        { status: 400 }
      );
    }

    // 4. Ingest Call Record Atomically with Idempotency
    const { record, isDuplicate } = await ingestCallRecord(callSummaryInput);

    // 5. Update Student Follow-Up if scheduled and not a duplicate delivery
    if (!isDuplicate && matchedStudentId && callSummaryInput.followUpDate && callSummaryInput.followUpType) {
      await prisma.student.update({
        where: { id: matchedStudentId },
        data: {
          nextFollowUpDate: callSummaryInput.followUpDate,
          nextFollowUpType: callSummaryInput.followUpType,
        },
      });
    }

    recordAuditLog({
      correlationId,
      collegeId: resolvedCollegeId,
      credentialIdentity: incomingSecret ? 'spx-webhook-secret' : 'spx-m2m-jwt',
      endpoint,
      action: 'WEBHOOK_CALL_INGESTED',
      status: 'SUCCESS',
      detail: `Call ${record.spxCallId} ingested via webhook (isDuplicate: ${isDuplicate}, studentId: ${matchedStudentId || 'none'})`,
    });

    return NextResponse.json(
      {
        success: true,
        callId: record.spxCallId,
        id: record.id,
        isDuplicate,
        status: record.status,
        followUpScheduled: Boolean(callSummaryInput.followUpDate),
        message: isDuplicate ? 'Call summary already processed (idempotent response)' : 'Call summary successfully ingested',
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
      action: 'WEBHOOK_INTERNAL_ERROR',
      status: 'FAILURE',
      detail: err.message,
    });

    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: 'An unexpected error occurred processing the webhook' },
      { status: 500 }
    );
  }
}

