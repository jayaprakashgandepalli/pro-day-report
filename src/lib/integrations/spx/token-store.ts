import crypto from 'crypto';
import { getSpxRedis, RedisUnavailableError } from './redis';
import { recordAuditLog } from './audit-logger';

export type StudentAccessTier = 'UNVERIFIED_GENERAL' | 'VERIFIED_PHONE_HOLDER' | 'VERIFIED_LEGAL_GUARDIAN';

export interface StudentAccessSession {
  studentId: string;
  collegeId: string;
  tier: StudentAccessTier;
  scopes: string[];
  createdAt: string;
  expiresAt: string;
}

export interface CreatedTokenResult {
  rawToken: string;
  tokenHash: string;
  expiresInSeconds: number;
}

/**
 * Computes a deterministic SHA-256 hash of a raw token.
 * Plaintext tokens are NEVER stored in Redis.
 */
export function hashToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken.trim()).digest('hex');
}

/**
 * Creates a short-lived, high-entropy student access token (256-bit random hex).
 * Persists the SHA-256 hash in Redis bound to studentId and collegeId.
 */
export async function createStudentAccessToken(
  studentId: string,
  collegeId: string,
  tier: StudentAccessTier = 'UNVERIFIED_GENERAL',
  scopes: string[] = ['student:read_basic'],
  ttlSeconds: number = 900, // 15 minutes default
  correlationId?: string
): Promise<CreatedTokenResult> {
  const rawBytes = crypto.randomBytes(32);
  const rawToken = `sat_${rawBytes.toString('hex')}`;
  const tokenHash = hashToken(rawToken);

  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);

  const session: StudentAccessSession = {
    studentId: studentId.trim(),
    collegeId: collegeId.trim(),
    tier,
    scopes,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  const redis = getSpxRedis();
  const redisKey = `token:${tokenHash}`;

  try {
    const success = await redis.set(redisKey, JSON.stringify(session), { exSeconds: ttlSeconds });
    if (!success) {
      throw new Error('Failed to persist student token in Redis');
    }

    if (correlationId) {
      recordAuditLog({
        correlationId,
        collegeId,
        credentialIdentity: null,
        endpoint: '/api/integrations/spx/token-store',
        action: 'TOKEN_CREATED',
        status: 'SUCCESS',
        detail: `Token created for studentId=${studentId}, tier=${tier}, ttl=${ttlSeconds}s`,
      });
    }

    return {
      rawToken,
      tokenHash,
      expiresInSeconds: ttlSeconds,
    };
  } catch (err: any) {
    if (err instanceof RedisUnavailableError) throw err;
    throw new RedisUnavailableError(`Token store error: ${err.message}`);
  }
}

/**
 * Validates a raw student access token against Redis.
 * Verifies that the token hash exists, is unexpired, and matches expected college and student IDs.
 */
export async function verifyStudentAccessToken(
  rawToken: string | null | undefined,
  expectedCollegeId: string,
  expectedStudentId?: string,
  correlationId?: string
): Promise<{ valid: boolean; session?: StudentAccessSession; error?: string }> {
  if (!rawToken || !rawToken.trim() || !rawToken.startsWith('sat_')) {
    return { valid: false, error: 'MISSING_OR_INVALID_TOKEN_FORMAT' };
  }

  const tokenHash = hashToken(rawToken);
  const redis = getSpxRedis();
  const redisKey = `token:${tokenHash}`;

  try {
    const data = await redis.get(redisKey);
    if (!data) {
      if (correlationId) {
        recordAuditLog({
          correlationId,
          collegeId: expectedCollegeId,
          credentialIdentity: null,
          endpoint: '/api/integrations/spx/token-store',
          action: 'TOKEN_VERIFIED',
          status: 'FAILURE',
          detail: 'Token hash not found in Redis or expired',
        });
      }
      return { valid: false, error: 'TOKEN_NOT_FOUND_OR_EXPIRED' };
    }

    const session: StudentAccessSession = JSON.parse(data);

    // Enforce Tenant Binding
    if (session.collegeId !== expectedCollegeId.trim()) {
      if (correlationId) {
        recordAuditLog({
          correlationId,
          collegeId: expectedCollegeId,
          credentialIdentity: null,
          endpoint: '/api/integrations/spx/token-store',
          action: 'TENANT_MISMATCH_BLOCKED',
          status: 'BLOCKED',
          detail: `Token collegeId=${session.collegeId} does not match expected=${expectedCollegeId}`,
        });
      }
      return { valid: false, error: 'TOKEN_TENANT_MISMATCH' };
    }

    // Enforce Student Binding if expectedStudentId is provided
    if (expectedStudentId && session.studentId !== expectedStudentId.trim()) {
      return { valid: false, error: 'TOKEN_STUDENT_MISMATCH' };
    }

    return { valid: true, session };
  } catch (err: any) {
    if (err instanceof RedisUnavailableError) throw err;
    throw new RedisUnavailableError(`Token verification failed: ${err.message}`);
  }
}

/**
 * Revokes an active student access token immediately.
 */
export async function revokeStudentAccessToken(
  rawToken: string,
  correlationId?: string
): Promise<boolean> {
  if (!rawToken || !rawToken.trim() || !rawToken.startsWith('sat_')) {
    return false;
  }

  const tokenHash = hashToken(rawToken);
  const redis = getSpxRedis();

  try {
    const deleted = await redis.del(`token:${tokenHash}`);
    if (correlationId) {
      recordAuditLog({
        correlationId,
        collegeId: null,
        credentialIdentity: null,
        endpoint: '/api/integrations/spx/token-store',
        action: 'TOKEN_REVOKED',
        status: 'SUCCESS',
        detail: `Token hash ${tokenHash.substring(0, 8)}... revoked`,
      });
    }
    return deleted;
  } catch (err: any) {
    if (err instanceof RedisUnavailableError) throw err;
    throw new RedisUnavailableError(`Token revocation failed: ${err.message}`);
  }
}

