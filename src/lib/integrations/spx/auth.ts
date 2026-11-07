import jwt from 'jsonwebtoken';
import { getSpxRedis } from './redis';
import { recordAuditLog, getCorrelationId } from './audit-logger';

export interface SpxM2MTokenPayload {
  iss: string;
  aud: string;
  sub: string;
  jti: string;
  collegeId: string;
  collegeCode: string;
  permissions: string[];
  iat?: number;
  exp?: number;
}

export interface SpxM2MContext {
  collegeId: string;
  collegeCode: string;
  credentialId: string;
  permissions: string[];
  correlationId: string;
}

export class SpxAuthError extends Error {
  public statusCode: number;
  public errorCode: string;

  constructor(message: string, statusCode: number = 401, errorCode: string = 'UNAUTHORIZED') {
    super(message);
    this.name = 'SpxAuthError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
  }
}

/**
 * Extracts the M2M Bearer token from the standard Authorization header.
 * CRITICAL: Never accepts human cookies or query parameters for M2M communication.
 */
export function extractM2MBearerToken(req: Request): string | null {
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
  if (!authHeader) return null;

  const parts = authHeader.trim().split(/\s+/);
  if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
    return parts[1].trim();
  }
  return null;
}

/**
 * Validates the M2M authentication of an incoming SPX Voice request.
 * Enforces cryptographic signature, issuer, audience, tenant binding, and revocation.
 */
export async function authenticateSpxM2M(
  req: Request,
  requiredPermissions: string[] = []
): Promise<SpxM2MContext> {
  const correlationId = getCorrelationId(req);
  const endpoint = new URL(req.url).pathname;

  // 1. Check Global Integration Feature Flag
  const isEnabled = process.env.SPX_INTEGRATION_ENABLED === 'true';
  if (!isEnabled) {
    recordAuditLog({
      correlationId,
      collegeId: null,
      credentialIdentity: null,
      endpoint,
      action: 'AUTH_FAILED',
      status: 'BLOCKED',
      detail: 'SPX integration is disabled in this environment',
    });
    throw new SpxAuthError('SPX Voice integration is disabled', 503, 'INTEGRATION_DISABLED');
  }

  // 2. Extract Bearer Token
  const rawToken = extractM2MBearerToken(req);
  if (!rawToken) {
    recordAuditLog({
      correlationId,
      collegeId: null,
      credentialIdentity: null,
      endpoint,
      action: 'AUTH_FAILED',
      status: 'FAILURE',
      detail: 'Missing or malformed Authorization Bearer header',
    });
    throw new SpxAuthError('Missing Authorization Bearer token', 401, 'MISSING_CREDENTIALS');
  }

  // 3. Resolve Master Secret (Strictly isolated from human JWT_SECRET)
  const masterSecret = process.env.SPX_M2M_MASTER_SECRET;
  if (!masterSecret || !masterSecret.trim()) {
    throw new SpxAuthError('Server M2M authentication is unconfigured', 500, 'AUTH_CONFIGURATION_ERROR');
  }

  const expectedIssuer = process.env.SPX_M2M_ISSUER || 'spx-voice-platform';
  const expectedAudience = process.env.SPX_M2M_AUDIENCE || 'pro-admissions-backend';

  // 4. Cryptographic Signature & Claims Verification
  let decoded: SpxM2MTokenPayload;
  try {
    decoded = jwt.verify(rawToken, masterSecret.trim(), {
      algorithms: ['HS256'],
      issuer: expectedIssuer,
      audience: expectedAudience,
    }) as SpxM2MTokenPayload;
  } catch (err: any) {
    recordAuditLog({
      correlationId,
      collegeId: null,
      credentialIdentity: null,
      endpoint,
      action: 'AUTH_FAILED',
      status: 'FAILURE',
      detail: `JWT verification failure: ${err.message}`,
    });
    throw new SpxAuthError(`Invalid token: ${err.message}`, 401, 'INVALID_TOKEN');
  }

  // 5. Validate Required Claims Structure
  if (!decoded.collegeId || typeof decoded.collegeId !== 'string' || !decoded.collegeId.trim()) {
    throw new SpxAuthError('Token lacks valid collegeId tenant claim', 401, 'INVALID_TENANT_CLAIM');
  }
  if (!decoded.jti || typeof decoded.jti !== 'string') {
    throw new SpxAuthError('Token lacks mandatory jti identifier', 401, 'INVALID_TOKEN_IDENTIFIER');
  }

  // 6. Check Token Revocation Registry in Redis
  try {
    const redis = getSpxRedis();
    const isRevoked = await redis.get(`revoked:${decoded.jti}`);
    if (isRevoked) {
      recordAuditLog({
        correlationId,
        collegeId: decoded.collegeId,
        credentialIdentity: decoded.jti,
        endpoint,
        action: 'AUTH_REVOKED',
        status: 'BLOCKED',
        detail: 'Token JTI is explicitly revoked',
      });
      throw new SpxAuthError('Integration credential has been revoked', 401, 'CREDENTIAL_REVOKED');
    }
  } catch (err: any) {
    if (err instanceof SpxAuthError) throw err;
    // If Redis is unavailable, FAIL-CLOSED for security
    recordAuditLog({
      correlationId,
      collegeId: decoded.collegeId,
      credentialIdentity: decoded.jti,
      endpoint,
      action: 'AUTH_FAILED',
      status: 'FAILURE',
      detail: `Revocation check failed: ${err.message}`,
    });
    throw new SpxAuthError('Authentication infrastructure unavailable', 503, 'REDIS_UNAVAILABLE');
  }

  // 7. Validate Permissions / Scopes
  const grantedPermissions = Array.isArray(decoded.permissions) ? decoded.permissions : [];
  for (const required of requiredPermissions) {
    if (!grantedPermissions.includes(required)) {
      recordAuditLog({
        correlationId,
        collegeId: decoded.collegeId,
        credentialIdentity: decoded.jti,
        endpoint,
        action: 'AUTH_FAILED',
        status: 'BLOCKED',
        detail: `Missing required permission: ${required}`,
      });
      throw new SpxAuthError(`Insufficient scope. Required: ${required}`, 403, 'INSUFFICIENT_PERMISSIONS');
    }
  }

  // 8. Log Authentication Success
  recordAuditLog({
    correlationId,
    collegeId: decoded.collegeId,
    credentialIdentity: decoded.jti,
    endpoint,
    action: 'AUTH_SUCCESS',
    status: 'SUCCESS',
  });

  return {
    collegeId: decoded.collegeId.trim(),
    collegeCode: (decoded.collegeCode || '').trim(),
    credentialId: decoded.jti.trim(),
    permissions: grantedPermissions,
    correlationId,
  };
}

/**
 * Defensive check: Verifies that caller did not submit a conflicting collegeId
 * in request query or body to spoof tenant boundaries.
 */
export function assertNoTenantMismatch(
  auth: SpxM2MContext,
  candidateCollegeId: string | null | undefined,
  endpoint: string
): void {
  if (candidateCollegeId && candidateCollegeId.trim()) {
    if (candidateCollegeId.trim() !== auth.collegeId) {
      recordAuditLog({
        correlationId: auth.correlationId,
        collegeId: auth.collegeId,
        credentialIdentity: auth.credentialId,
        endpoint,
        action: 'TENANT_MISMATCH_BLOCKED',
        status: 'BLOCKED',
        detail: `Client attempted to query collegeId=${candidateCollegeId} using credential for collegeId=${auth.collegeId}`,
      });
      throw new SpxAuthError(
        'Tenant mismatch: Request parameters do not match authenticated college context',
        403,
        'TENANT_MISMATCH_DETECTED'
      );
    }
  }
}

/**
 * Utility for issuing signed M2M tokens (used in testing and credential provisioning).
 */
export function issueTestSpxM2MToken(
  claims: Partial<SpxM2MTokenPayload> & { collegeId: string },
  expiresIn: string = '1h',
  secretOverride?: string
): string {
  const secret = secretOverride || process.env.SPX_M2M_MASTER_SECRET || 'test-m2m-master-secret-key-12345';
  const issuer = process.env.SPX_M2M_ISSUER || 'spx-voice-platform';
  const audience = process.env.SPX_M2M_AUDIENCE || 'pro-admissions-backend';

  const { collegeId, collegeCode, permissions, jti, ...restClaims } = claims;

  const payload: SpxM2MTokenPayload = {
    iss: issuer,
    aud: audience,
    sub: 'spx-voice-m2m-agent',
    jti: jti || `jti_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    collegeId,
    collegeCode: collegeCode || 'TEST',
    permissions: permissions || [
      'students:lookup',
      'students:read',
      'students:update',
      'college:read',
      'calls:write',
    ],
    ...restClaims,
  };

  return jwt.sign(payload, secret, {
    algorithm: 'HS256',
    expiresIn: expiresIn as any,
  });
}

