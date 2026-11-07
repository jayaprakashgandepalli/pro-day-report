import crypto from 'crypto';

export type AuditAction =
  | 'AUTH_SUCCESS'
  | 'AUTH_FAILED'
  | 'AUTH_REVOKED'
  | 'TENANT_MISMATCH_BLOCKED'
  | 'RATE_LIMIT_EXCEEDED'
  | 'TOKEN_CREATED'
  | 'TOKEN_VERIFIED'
  | 'TOKEN_REVOKED'
  | 'HEALTH_CHECK'
  | 'TENANT_VALIDATION_SUCCESS'
  | 'TENANT_VALIDATION_FAILED'
  | 'STUDENT_LOOKUP'
  | 'STUDENT_PROFILE_READ'
  | 'MISSING_FIELDS_CALCULATED'
  | 'COLLEGE_INFO_READ'
  | 'COLLEGE_KNOWLEDGE_READ'
  | 'STUDENT_UPDATE_FILL'
  | 'INTERNAL_ERROR'
  | 'ADDRESS_SEARCH'
  | 'ADDRESS_VALIDATED'
  | 'CALL_SUMMARY_INGESTED'
  | 'CALL_HISTORY_READ'
  | 'FOLLOW_UP_SCHEDULED'
  | 'FOLLOW_UP_READ'
  | 'OUTBOUND_CALL_INITIATED'
  | 'OUTBOUND_DISPATCH_FAILED'
  | 'OUTBOUND_CONFIG_ERROR'
  | 'OUTBOUND_STUDENT_NOT_FOUND'
  | 'OUTBOUND_NETWORK_ERROR'
  | 'WEBHOOK_CALL_INGESTED'
  | 'WEBHOOK_AUTH_FAILED'
  | 'WEBHOOK_UNCONFIGURED'
  | 'WEBHOOK_INTERNAL_ERROR';

export type AuditStatus = 'SUCCESS' | 'FAILURE' | 'BLOCKED';

export interface AuditLogEntry {
  correlationId: string;
  timestamp: string;
  collegeId: string | null;
  credentialIdentity: string | null;
  endpoint: string;
  action: AuditAction;
  status: AuditStatus;
  detail?: string;
  ipAddress?: string;
}

// In-memory ring-buffer for test inspection and telemetry verification (capped at 100 entries)
const recentAuditLogs: AuditLogEntry[] = [];
const MAX_RING_BUFFER = 100;

/**
 * Generates or normalizes a correlation ID for tracking request lifecycles.
 */
export function getCorrelationId(req?: Request): string {
  if (req) {
    const headerId = req.headers.get('x-correlation-id') || req.headers.get('x-request-id');
    if (headerId && headerId.trim()) {
      return headerId.trim();
    }
  }
  return `corr_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
}

/**
 * Records an integration security audit event.
 * CRITICAL: Never logs OTPs, raw tokens, passwords, recordings, or unnecessary student PII.
 */
export function recordAuditLog(entry: Omit<AuditLogEntry, 'timestamp'>): void {
  const completeEntry: AuditLogEntry = {
    ...entry,
    timestamp: new Date().toISOString(),
  };

  // Structured standard output for log aggregators (CloudWatch, Datadog, stdout)
  console.log(`[SPX_AUDIT] ${JSON.stringify(completeEntry)}`);

  // Maintain ring-buffer for health checks and automated test verification
  recentAuditLogs.unshift(completeEntry);
  if (recentAuditLogs.length > MAX_RING_BUFFER) {
    recentAuditLogs.pop();
  }
}

/**
 * Helper to inspect recent logs in tests (read-only snapshot).
 */
export function getRecentAuditLogs(): readonly AuditLogEntry[] {
  return [...recentAuditLogs];
}

/**
 * Clears the in-memory audit ring-buffer (used between test executions).
 */
export function clearAuditLogsForTesting(): void {
  recentAuditLogs.length = 0;
}

