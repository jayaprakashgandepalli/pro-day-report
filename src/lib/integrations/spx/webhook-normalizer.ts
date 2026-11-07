import { prisma } from '@/lib/prisma';
import { interpretNaturalFollowUpDate } from './date-utils';
import { IngestCallSummaryInput } from './call-store';

export interface SpxRawWebhookPayload {
  workflow_run_id?: number | string;
  call_id?: string;
  spxCallId?: string;
  callId?: string;
  customer_number?: string;
  phoneNumber?: string;
  rep_number?: string;
  called_at?: string;
  duration?: number;
  durationSeconds?: number;
  district?: string;
  town?: string;
  looking_for?: string;
  customer_name?: string;
  remarks?: string;
  summary?: string;
  recording_url?: string;
  recordingUrl?: string;
  student_id?: string;
  studentId?: string;
  college_id?: string;
  collegeId?: string;
  direction?: 'INBOUND' | 'OUTBOUND';
  status?: string;
  outcome?: string;
  followUpRequired?: boolean;
  followUpDate?: string;
  followUpType?: string;
  [key: string]: any;
}

export interface NormalizedWebhookResult {
  callSummaryInput: IngestCallSummaryInput;
  matchedStudentId: string | null;
  resolvedCollegeId: string;
}

/**
 * Normalizes incoming SPX post-call webhook payloads into PRO's native CallSummaryInput.
 * Handles phone normalization, student matching, follow-up extraction, and tenant resolution.
 */
export async function normalizeSpxWebhookPayload(
  payload: SpxRawWebhookPayload,
  fallbackCollegeId?: string
): Promise<NormalizedWebhookResult> {
  // 1. Resolve SPX Call ID (idempotency key)
  const rawId = payload.workflow_run_id || payload.call_id || payload.spxCallId || payload.callId;
  const spxCallId = rawId ? String(rawId).trim() : `spx_unknown_${Date.now()}`;

  // 2. Resolve Direction
  const direction: 'INBOUND' | 'OUTBOUND' = (payload.direction || 'OUTBOUND').toUpperCase() === 'INBOUND' ? 'INBOUND' : 'OUTBOUND';

  // 3. Resolve Duration
  const durationSeconds = typeof payload.duration === 'number'
    ? payload.duration
    : typeof payload.durationSeconds === 'number'
    ? payload.durationSeconds
    : 0;

  // 4. Resolve Outcome
  let outcome = payload.outcome;
  if (!outcome) {
    if (durationSeconds <= 0) {
      outcome = 'NO_ANSWER';
    } else {
      outcome = 'CONNECTED';
    }
  }

  // 5. Resolve Student Reference
  let studentId = (payload.student_id || payload.studentId || '').trim() || null;
  let resolvedCollegeId = (payload.college_id || payload.collegeId || fallbackCollegeId || '').trim();

  // If studentId not explicitly in payload, try matching by customer_number phone
  const rawPhone = payload.customer_number || payload.phoneNumber;
  if (!studentId && rawPhone && rawPhone.trim()) {
    const digits = rawPhone.replace(/\D/g, '');
    const phone10 = digits.length >= 10 ? digits.slice(-10) : digits;

    const matchedStudent = await prisma.student.findFirst({
      where: {
        OR: [
          { phone: { contains: phone10 } },
          { whatsapp: { contains: phone10 } },
        ],
        ...(resolvedCollegeId ? { collegeId: resolvedCollegeId } : {}),
      },
      select: {
        id: true,
        collegeId: true,
      },
    });

    if (matchedStudent) {
      studentId = matchedStudent.id;
      if (!resolvedCollegeId && matchedStudent.collegeId) {
        resolvedCollegeId = matchedStudent.collegeId;
      }
    }
  }

  // If collegeId still unassigned, query student's college
  if (studentId && !resolvedCollegeId) {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { collegeId: true },
    });
    if (student?.collegeId) {
      resolvedCollegeId = student.collegeId;
    }
  }

  // 6. Resolve Summary & Notes
  const summary = (payload.remarks || payload.summary || 'AI Voice admissions call completed').trim();

  // 7. Resolve Extracted Information
  const collectedInfo: Record<string, any> = {
    district: payload.district || null,
    town: payload.town || null,
    looking_for: payload.looking_for || null,
    customer_name: payload.customer_name || null,
  };

  // 8. Extract Follow-Up Details
  let followUpRequired = Boolean(payload.followUpRequired);
  let followUpDate: Date | null = null;
  let followUpType: string | null = payload.followUpType || null;

  if (payload.followUpDate) {
    const parsed = interpretNaturalFollowUpDate(payload.followUpDate);
    if (parsed.success && parsed.date) {
      followUpRequired = true;
      followUpDate = parsed.date;
      followUpType = followUpType || 'Callback';
    }
  } else if (summary) {
    // Attempt to detect if remarks mentioned a callback/date/visit
    const lower = summary.toLowerCase();
    if (
      lower.includes('call back') ||
      lower.includes('callback') ||
      lower.includes('follow up') ||
      lower.includes('follow-up') ||
      lower.includes('visit') ||
      lower.includes('campus')
    ) {
      followUpRequired = true;
      followUpType = followUpType || (lower.includes('visit') ? 'Visit' : 'Callback');
      // Search for days of the week or dates
      const dateMatch = interpretNaturalFollowUpDate(summary);
      if (dateMatch.success && dateMatch.date) {
        followUpDate = dateMatch.date;
      }
    }
  }

  // 9. Build Normalized CallSummaryInput
  const callSummaryInput: IngestCallSummaryInput = {
    spxCallId,
    collegeId: resolvedCollegeId,
    studentId,
    direction,
    status: payload.status || 'COMPLETED',
    outcome,
    startedAt: payload.called_at ? new Date(payload.called_at) : new Date(),
    endedAt: payload.called_at ? new Date(new Date(payload.called_at).getTime() + durationSeconds * 1000) : new Date(),
    durationSeconds,
    summary,
    studentInterest: payload.looking_for || null,
    collectedInfo,
    followUpRequired,
    followUpDate,
    followUpType,
    recordingUrl: payload.recording_url || payload.recordingUrl || null,
    idempotencyKey: `webhook_${spxCallId}`,
  };

  return {
    callSummaryInput,
    matchedStudentId: studentId,
    resolvedCollegeId,
  };
}
