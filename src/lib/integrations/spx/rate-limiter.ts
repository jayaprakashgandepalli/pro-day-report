import { getSpxRedis, RedisUnavailableError } from './redis';
import { recordAuditLog } from './audit-logger';

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
  retryAfterSeconds?: number;
}

export interface CooldownResult {
  allowed: boolean;
  cooldownRemainingSeconds: number;
}

export interface AttemptResult {
  allowed: boolean;
  attemptsUsed: number;
  attemptsRemaining: number;
}

export class SpxRateLimitError extends Error {
  public statusCode: number = 429;
  public retryAfterSeconds: number;
  public errorCode: string;

  constructor(
    message: string = 'Too many requests. Please slow down.',
    retryAfterSeconds: number = 60,
    errorCode: string = 'RATE_LIMIT_EXCEEDED'
  ) {
    super(message);
    this.name = 'SpxRateLimitError';
    this.retryAfterSeconds = retryAfterSeconds;
    this.errorCode = errorCode;
  }
}

/**
 * Reusable distributed sliding-window / time-bucket rate limiter.
 * Keys are strictly namespaced under `spx:ratelimit:`.
 */
export async function checkRateLimit(
  keyIdentifier: string,
  maxRequests: number = 120,
  windowSeconds: number = 60,
  correlationId?: string,
  collegeId?: string
): Promise<RateLimitResult> {
  const redis = getSpxRedis();
  const currentWindow = Math.floor(Date.now() / (windowSeconds * 1000));
  const redisKey = `ratelimit:${keyIdentifier}:${currentWindow}`;

  try {
    const currentCount = await redis.incr(redisKey, windowSeconds * 2);
    const ttl = await redis.ttl(redisKey);
    const resetSeconds = ttl > 0 ? ttl : windowSeconds;

    if (currentCount > maxRequests) {
      if (correlationId) {
        recordAuditLog({
          correlationId,
          collegeId: collegeId || null,
          credentialIdentity: keyIdentifier,
          endpoint: '/api/integrations/spx/*',
          action: 'RATE_LIMIT_EXCEEDED',
          status: 'BLOCKED',
          detail: `Key ${keyIdentifier} exceeded ${maxRequests} requests per ${windowSeconds}s`,
        });
      }

      return {
        allowed: false,
        limit: maxRequests,
        remaining: 0,
        resetSeconds,
        retryAfterSeconds: resetSeconds,
      };
    }

    return {
      allowed: true,
      limit: maxRequests,
      remaining: Math.max(0, maxRequests - currentCount),
      resetSeconds,
    };
  } catch (err: any) {
    // Fail-Closed: If Redis fails, reject to prevent abuse
    if (err instanceof RedisUnavailableError) {
      throw err;
    }
    throw new RedisUnavailableError(`Rate limiter failed: ${err.message}`);
  }
}

/**
 * Verifies that an OTP resend request respects mandatory minimum cooldown (default 60s).
 */
export async function checkOtpCooldown(
  sessionId: string,
  cooldownSeconds: number = 60
): Promise<CooldownResult> {
  const redis = getSpxRedis();
  const key = `otp_cooldown:${sessionId}`;

  const ttl = await redis.ttl(key);
  if (ttl > 0) {
    return {
      allowed: false,
      cooldownRemainingSeconds: ttl,
    };
  }

  // Set new cooldown lock
  await redis.set(key, '1', { exSeconds: cooldownSeconds });
  return {
    allowed: true,
    cooldownRemainingSeconds: 0,
  };
}

/**
 * Tracks verification attempts on an OTP or security challenge (maximum 3 attempts).
 */
export async function trackVerificationAttempt(
  sessionId: string,
  maxAttempts: number = 3,
  lockoutSeconds: number = 600
): Promise<AttemptResult> {
  const redis = getSpxRedis();
  const key = `otp_attempts:${sessionId}`;

  const attemptsUsed = await redis.incr(key, lockoutSeconds);
  const remaining = Math.max(0, maxAttempts - attemptsUsed);

  return {
    allowed: attemptsUsed <= maxAttempts,
    attemptsUsed,
    attemptsRemaining: remaining,
  };
}

/**
 * Resets attempt counters upon successful verification.
 */
export async function clearVerificationAttempts(sessionId: string): Promise<void> {
  const redis = getSpxRedis();
  await redis.del(`otp_attempts:${sessionId}`);
  await redis.del(`otp_cooldown:${sessionId}`);
}

