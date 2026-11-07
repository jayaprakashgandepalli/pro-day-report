import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export interface CallRecordData {
  id: string;
  spxCallId: string;
  collegeId: string;
  studentId: string | null;
  direction: string;
  status: string;
  outcome: string | null;
  startedAt: string | null;
  endedAt: string | null;
  durationSeconds: number;
  summary: string | null;
  studentInterest: string | null;
  collectedInfo: any | null;
  followUpRequired: boolean;
  followUpDate: string | null;
  followUpType: string | null;
  recordingUrl: string | null;
  idempotencyKey: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IngestCallSummaryInput {
  spxCallId: string;
  collegeId: string;
  studentId?: string | null;
  direction?: 'INBOUND' | 'OUTBOUND';
  status?: string;
  outcome?: string | null;
  startedAt?: Date | string | null;
  endedAt?: Date | string | null;
  durationSeconds?: number;
  summary?: string | null;
  studentInterest?: string | null;
  collectedInfo?: Record<string, any> | null;
  followUpRequired?: boolean;
  followUpDate?: Date | string | null;
  followUpType?: string | null;
  recordingUrl?: string | null;
  idempotencyKey?: string | null;
}

export interface IngestResult {
  record: CallRecordData;
  isDuplicate: boolean;
}

/**
 * Finds an existing call record by SPX call ID or idempotency key.
 */
export async function findCallRecord(
  spxCallId: string,
  idempotencyKey?: string | null
): Promise<CallRecordData | null> {
  const cleanCallId = spxCallId?.trim();
  const cleanIdemp = idempotencyKey?.trim() || null;

  const records = await prisma.$queryRaw<CallRecordData[]>`
    SELECT * FROM "SpxCallRecord"
    WHERE "spxCallId" = ${cleanCallId}
       OR (${cleanIdemp}::text IS NOT NULL AND "idempotencyKey" = ${cleanIdemp})
    LIMIT 1
  `;

  return records.length > 0 ? records[0] : null;
}

/**
 * Ingests an AI call record with database-enforced idempotency.
 * If the call was already ingested, safely returns the existing record (isDuplicate: true).
 * Strictly avoids polluting the human Visit model.
 */
export async function ingestCallRecord(input: IngestCallSummaryInput): Promise<IngestResult> {
  const cleanCallId = input.spxCallId.trim();
  const cleanCollegeId = input.collegeId.trim();
  const cleanStudentId = input.studentId ? input.studentId.trim() : null;
  const direction = (input.direction || 'OUTBOUND').toUpperCase();
  const status = input.status || 'COMPLETED';
  const outcome = input.outcome || null;

  const startedAt = input.startedAt ? new Date(input.startedAt).toISOString() : null;
  const endedAt = input.endedAt ? new Date(input.endedAt).toISOString() : null;
  const durationSeconds = input.durationSeconds && input.durationSeconds >= 0 ? Math.floor(input.durationSeconds) : 0;

  const summary = input.summary ? input.summary.trim() : null;
  const studentInterest = input.studentInterest ? input.studentInterest.trim() : null;
  const collectedInfoJson = input.collectedInfo ? JSON.stringify(input.collectedInfo) : null;

  const followUpRequired = Boolean(input.followUpRequired);
  const followUpDate = input.followUpDate ? new Date(input.followUpDate).toISOString() : null;
  const followUpType = input.followUpType ? input.followUpType.trim() : null;

  const recordingUrl = input.recordingUrl ? input.recordingUrl.trim() : null;
  const idempotencyKey = input.idempotencyKey ? input.idempotencyKey.trim() : null;

  // 1. Check for existing record first (Idempotency)
  const existing = await findCallRecord(cleanCallId, idempotencyKey);
  if (existing) {
    return {
      record: existing,
      isDuplicate: true,
    };
  }

  // 2. Insert new SpxCallRecord atomically
  const id = `call_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const now = new Date().toISOString();

  await prisma.$executeRaw`
    INSERT INTO "SpxCallRecord" (
      "id",
      "spxCallId",
      "collegeId",
      "studentId",
      "direction",
      "status",
      "outcome",
      "startedAt",
      "endedAt",
      "durationSeconds",
      "summary",
      "studentInterest",
      "collectedInfo",
      "followUpRequired",
      "followUpDate",
      "followUpType",
      "recordingUrl",
      "idempotencyKey",
      "createdAt",
      "updatedAt"
    ) VALUES (
      ${id},
      ${cleanCallId},
      ${cleanCollegeId},
      ${cleanStudentId},
      ${direction},
      ${status},
      ${outcome},
      ${startedAt ? Prisma.sql`${startedAt}::timestamp` : null},
      ${endedAt ? Prisma.sql`${endedAt}::timestamp` : null},
      ${durationSeconds},
      ${summary},
      ${studentInterest},
      ${collectedInfoJson ? Prisma.sql`${collectedInfoJson}::jsonb` : null},
      ${followUpRequired},
      ${followUpDate ? Prisma.sql`${followUpDate}::timestamp` : null},
      ${followUpType},
      ${recordingUrl},
      ${idempotencyKey},
      ${now}::timestamp,
      ${now}::timestamp
    )
    ON CONFLICT ("spxCallId") DO NOTHING
  `;

  // Fetch the persisted record
  const saved = await findCallRecord(cleanCallId, idempotencyKey);
  if (!saved) {
    throw new Error('Failed to persist and retrieve call record');
  }

  return {
    record: saved,
    isDuplicate: false,
  };
}

/**
 * Retrieves tenant-scoped AI call history for staff visibility.
 * Filters by authenticated collegeId and optional studentId.
 */
export async function listCallRecords(
  collegeId: string,
  options: {
    studentId?: string;
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ count: number; calls: CallRecordData[] }> {
  const cleanCollegeId = collegeId.trim();
  const limit = Math.min(100, Math.max(1, options.limit || 20));
  const offset = Math.max(0, options.offset || 0);
  const cleanStudentId = options.studentId ? options.studentId.trim() : null;

  let calls: CallRecordData[];
  let countResult: Array<{ count: string | number }>;

  if (cleanStudentId) {
    calls = await prisma.$queryRaw<CallRecordData[]>`
      SELECT * FROM "SpxCallRecord"
      WHERE "collegeId" = ${cleanCollegeId}
        AND "studentId" = ${cleanStudentId}
      ORDER BY "createdAt" DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    countResult = await prisma.$queryRaw<Array<{ count: string | number }>>`
      SELECT COUNT(*)::text as count FROM "SpxCallRecord"
      WHERE "collegeId" = ${cleanCollegeId}
        AND "studentId" = ${cleanStudentId}
    `;
  } else {
    calls = await prisma.$queryRaw<CallRecordData[]>`
      SELECT * FROM "SpxCallRecord"
      WHERE "collegeId" = ${cleanCollegeId}
      ORDER BY "createdAt" DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    countResult = await prisma.$queryRaw<Array<{ count: string | number }>>`
      SELECT COUNT(*)::text as count FROM "SpxCallRecord"
      WHERE "collegeId" = ${cleanCollegeId}
    `;
  }

  const totalCount = countResult.length > 0 ? parseInt(String(countResult[0].count), 10) : 0;

  return {
    count: totalCount,
    calls,
  };
}

