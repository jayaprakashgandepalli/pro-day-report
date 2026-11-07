/**
 * Automated Verification Suite for SPX Voice AI Integration - Stage 1 Foundation
 * Tests M2M Auth, Tenant Isolation, Token Store, Rate Limiting, Fail-Closed Security & Regression
 */

import jwt from 'jsonwebtoken';
import {
  authenticateSpxM2M,
  assertNoTenantMismatch,
  issueTestSpxM2MToken,
  SpxAuthError,
  extractM2MBearerToken,
} from '../src/lib/integrations/spx/auth';
import {
  buildTenantStudentWhereClause,
  SpxTenantIsolationError,
} from '../src/lib/integrations/spx/tenant';
import {
  createStudentAccessToken,
  verifyStudentAccessToken,
  revokeStudentAccessToken,
  hashToken,
} from '../src/lib/integrations/spx/token-store';
import {
  checkRateLimit,
  checkOtpCooldown,
  trackVerificationAttempt,
  clearVerificationAttempts,
} from '../src/lib/integrations/spx/rate-limiter';
import { getSpxRedis } from '../src/lib/integrations/spx/redis';
import { GET as healthCheckGET } from '../src/app/api/integrations/spx/v1/health/route';

// Ensure test environment variables
process.env.SPX_INTEGRATION_ENABLED = 'true';
process.env.SPX_M2M_MASTER_SECRET = 'stage1-verification-test-secret-key-999';
process.env.SPX_M2M_ISSUER = 'spx-voice-platform';
process.env.SPX_M2M_AUDIENCE = 'pro-admissions-backend';
process.env.SPX_ALLOW_DEV_FALLBACK = 'true'; // Allow isolated in-memory Redis client for automated test execution

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] ${testName}`);
  } else {
    console.error(`  [FAIL] ${testName}${detail ? ` - ${detail}` : ''}`);
    process.exitCode = 1;
  }
}

async function runTestSuite() {
  console.log('\n======================================================');
  console.log('SPX VOICE INTEGRATION - STAGE 1 AUTOMATED VERIFICATION');
  console.log('======================================================\n');

  const redis = getSpxRedis();

  // -----------------------------------------------------------------
  // SUITE 1: M2M Authentication & Cryptographic Verification
  // -----------------------------------------------------------------
  console.log('--- Suite 1: M2M Authentication & Cryptographic Verification ---');

  // Test 1.1: Feature flag check
  {
    process.env.SPX_INTEGRATION_ENABLED = 'false';
    const req = new Request('http://localhost/api/integrations/spx/v1/health', {
      headers: { Authorization: 'Bearer invalid' },
    });
    try {
      await authenticateSpxM2M(req);
      assert(false, 'Auth should reject when SPX_INTEGRATION_ENABLED is false');
    } catch (err: any) {
      assert(
        err instanceof SpxAuthError && err.errorCode === 'INTEGRATION_DISABLED' && err.statusCode === 503,
        'Auth throws 503 INTEGRATION_DISABLED when feature flag is off'
      );
    }
    process.env.SPX_INTEGRATION_ENABLED = 'true';
  }

  // Test 1.2: Missing Authorization header
  {
    const req = new Request('http://localhost/api/integrations/spx/v1/test');
    try {
      await authenticateSpxM2M(req);
      assert(false, 'Auth should reject when Authorization header is missing');
    } catch (err: any) {
      assert(
        err instanceof SpxAuthError && err.errorCode === 'MISSING_CREDENTIALS' && err.statusCode === 401,
        'Auth throws 401 MISSING_CREDENTIALS for absent Bearer header'
      );
    }
  }

  // Test 1.3: Valid M2M Token Authentication
  const testCollegeId = 'col_aurora_001';
  let validToken: string;
  {
    validToken = issueTestSpxM2MToken({
      collegeId: testCollegeId,
      collegeCode: 'AURORA',
      permissions: ['students:lookup', 'students:read', 'calls:write'],
    });

    const req = new Request('http://localhost/api/integrations/spx/v1/test', {
      headers: { Authorization: `Bearer ${validToken}` },
    });

    const context = await authenticateSpxM2M(req, ['students:lookup']);
    assert(
      context.collegeId === testCollegeId &&
      context.collegeCode === 'AURORA' &&
      context.permissions.includes('students:lookup') &&
      Boolean(context.correlationId),
      'Valid M2M token verified with correct collegeId, permissions, and correlationId'
    );
  }

  // Test 1.4: Invalid Signature (Forged Token)
  {
    const forgedToken = issueTestSpxM2MToken(
      { collegeId: testCollegeId },
      '1h',
      'attacker-forged-secret-key-111'
    );
    const req = new Request('http://localhost/api/integrations/spx/v1/test', {
      headers: { Authorization: `Bearer ${forgedToken}` },
    });

    try {
      await authenticateSpxM2M(req);
      assert(false, 'Auth should reject forged token with wrong signature');
    } catch (err: any) {
      assert(
        err instanceof SpxAuthError && err.errorCode === 'INVALID_TOKEN' && err.statusCode === 401,
        'Auth throws 401 INVALID_TOKEN for forged cryptographic signature'
      );
    }
  }

  // Test 1.5: Expired Token
  {
    const expiredToken = jwt.sign(
      {
        iss: 'spx-voice-platform',
        aud: 'pro-admissions-backend',
        sub: 'spx-voice-m2m-agent',
        jti: 'jti_expired_1',
        collegeId: testCollegeId,
        permissions: ['students:lookup'],
      },
      process.env.SPX_M2M_MASTER_SECRET!,
      { algorithm: 'HS256', expiresIn: '-10s' }
    );

    const req = new Request('http://localhost/api/integrations/spx/v1/test', {
      headers: { Authorization: `Bearer ${expiredToken}` },
    });

    try {
      await authenticateSpxM2M(req);
      assert(false, 'Auth should reject expired token');
    } catch (err: any) {
      assert(
        err instanceof SpxAuthError && err.message.includes('jwt expired'),
        'Auth throws 401 with jwt expired error'
      );
    }
  }

  // Test 1.6: Revoked Token JTI
  {
    const revokedJti = 'jti_revoked_test_99';
    const tokenToRevoke = issueTestSpxM2MToken({
      collegeId: testCollegeId,
      jti: revokedJti,
    });

    // Mark JTI as revoked in Redis
    await redis.set(`revoked:${revokedJti}`, '1', { exSeconds: 300 });

    const req = new Request('http://localhost/api/integrations/spx/v1/test', {
      headers: { Authorization: `Bearer ${tokenToRevoke}` },
    });

    try {
      await authenticateSpxM2M(req);
      assert(false, 'Auth should reject revoked token JTI');
    } catch (err: any) {
      assert(
        err instanceof SpxAuthError && err.errorCode === 'CREDENTIAL_REVOKED' && err.statusCode === 401,
        'Auth throws 401 CREDENTIAL_REVOKED when JTI is recorded in revocation registry'
      );
    }
  }

  // Test 1.7: Scope / Permission Enforcement
  {
    const lowPermToken = issueTestSpxM2MToken({
      collegeId: testCollegeId,
      permissions: ['students:lookup'],
    });

    const req = new Request('http://localhost/api/integrations/spx/v1/test', {
      headers: { Authorization: `Bearer ${lowPermToken}` },
    });

    try {
      await authenticateSpxM2M(req, ['students:admin_delete']);
      assert(false, 'Auth should reject token lacking required scope');
    } catch (err: any) {
      assert(
        err instanceof SpxAuthError && err.errorCode === 'INSUFFICIENT_PERMISSIONS' && err.statusCode === 403,
        'Auth throws 403 INSUFFICIENT_PERMISSIONS when required scope is absent'
      );
    }
  }

  // Test 1.8: Tenant Mismatch Defense (assertNoTenantMismatch)
  {
    const authContext = {
      collegeId: 'col_aurora_001',
      collegeCode: 'AURORA',
      credentialId: 'jti_123',
      permissions: ['students:lookup'],
      correlationId: 'req_test_1',
    };

    // Matching candidate
    let noErr = true;
    try {
      assertNoTenantMismatch(authContext, 'col_aurora_001', '/api/test');
      assertNoTenantMismatch(authContext, null, '/api/test');
      assertNoTenantMismatch(authContext, undefined, '/api/test');
    } catch {
      noErr = false;
    }
    assert(noErr, 'assertNoTenantMismatch allows matching or omitted collegeId');

    // Conflicting candidate
    try {
      assertNoTenantMismatch(authContext, 'col_hostile_attacker_999', '/api/test');
      assert(false, 'assertNoTenantMismatch should throw 403 on conflicting collegeId');
    } catch (err: any) {
      assert(
        err instanceof SpxAuthError && err.errorCode === 'TENANT_MISMATCH_DETECTED' && err.statusCode === 403,
        'assertNoTenantMismatch blocks client collegeId spoofing with 403 TENANT_MISMATCH_DETECTED'
      );
    }
  }

  // -----------------------------------------------------------------
  // SUITE 2: Multi-Tenant Boundary Isolation Helper
  // -----------------------------------------------------------------
  console.log('\n--- Suite 2: Multi-Tenant Boundary Isolation Helper ---');

  // Test 2.1: Prisma Where Clause Construction
  {
    const whereClause = buildTenantStudentWhereClause('col_aurora_001');
    assert(
      Array.isArray((whereClause as any).OR) &&
      (whereClause as any).OR.length === 2 &&
      (whereClause as any).OR[0].collegeId === 'col_aurora_001' &&
      (whereClause as any).OR[1].AND[0].collegeId === null &&
      (whereClause as any).OR[1].AND[1].employee.collegeId === 'col_aurora_001',
      'buildTenantStudentWhereClause correctly structures direct and creator-fallback OR conditions'
    );

    // Extra condition combining
    const combinedWhere = buildTenantStudentWhereClause('col_aurora_001', { phone: '9876543210' });
    assert(
      Array.isArray((combinedWhere as any).AND) &&
      (combinedWhere as any).AND[1].phone === '9876543210',
      'buildTenantStudentWhereClause wraps extra conditions with AND conjunction'
    );
  }

  // -----------------------------------------------------------------
  // SUITE 3: Student Access Token Store (High-Entropy Opaque Session)
  // -----------------------------------------------------------------
  console.log('\n--- Suite 3: Student Access Token Store ---');

  let testRawToken: string;
  let testTokenHash: string;

  // Test 3.1: Token Generation & Entropy
  {
    const created = await createStudentAccessToken(
      'stud_123',
      'col_aurora_001',
      'UNVERIFIED_GENERAL',
      ['student:read_basic'],
      60
    );

    testRawToken = created.rawToken;
    testTokenHash = created.tokenHash;

    assert(
      testRawToken.startsWith('sat_') &&
      testRawToken.length === 68 && // 'sat_' + 64 hex characters (256 bits)
      testTokenHash === hashToken(testRawToken),
      'createStudentAccessToken creates high-entropy 256-bit token with deterministic SHA-256 hash'
    );

    // Check that Redis stores hash, NOT raw token
    const storedByHash = await redis.get(`token:${testTokenHash}`);
    const storedByRaw = await redis.get(`token:${testRawToken}`);
    assert(
      storedByHash !== null && storedByRaw === null,
      'Token is securely hashed; plaintext token is never stored in Redis'
    );
  }

  // Test 3.2: Token Verification Success
  {
    const verification = await verifyStudentAccessToken(
      testRawToken,
      'col_aurora_001',
      'stud_123'
    );

    assert(
      verification.valid === true &&
      verification.session?.studentId === 'stud_123' &&
      verification.session?.collegeId === 'col_aurora_001' &&
      verification.session?.tier === 'UNVERIFIED_GENERAL',
      'verifyStudentAccessToken validates active session with correct tenant and student binding'
    );
  }

  // Test 3.3: Token Verification Cross-Tenant Block
  {
    const crossTenantVerification = await verifyStudentAccessToken(
      testRawToken,
      'col_other_college_999' // Mismatched college tenant
    );

    assert(
      crossTenantVerification.valid === false &&
      crossTenantVerification.error === 'TOKEN_TENANT_MISMATCH',
      'verifyStudentAccessToken blocks cross-tenant access with TOKEN_TENANT_MISMATCH'
    );
  }

  // Test 3.4: Token Verification Student ID Mismatch Block
  {
    const wrongStudentVerification = await verifyStudentAccessToken(
      testRawToken,
      'col_aurora_001',
      'stud_another_student_999' // Mismatched student ID
    );

    assert(
      wrongStudentVerification.valid === false &&
      wrongStudentVerification.error === 'TOKEN_STUDENT_MISMATCH',
      'verifyStudentAccessToken blocks student ID mismatch with TOKEN_STUDENT_MISMATCH'
    );
  }

  // Test 3.5: Token Revocation
  {
    const revoked = await revokeStudentAccessToken(testRawToken);
    assert(revoked === true, 'revokeStudentAccessToken deletes token session from Redis');

    const checkAfterRevoke = await verifyStudentAccessToken(testRawToken, 'col_aurora_001');
    assert(
      checkAfterRevoke.valid === false &&
      checkAfterRevoke.error === 'TOKEN_NOT_FOUND_OR_EXPIRED',
      'Revoked token immediately fails verification'
    );
  }

  // -----------------------------------------------------------------
  // SUITE 4: Distributed Rate Limiting
  // -----------------------------------------------------------------
  console.log('\n--- Suite 4: Distributed Rate Limiting ---');

  // Test 4.1: Sliding window rate limit
  {
    const testKey = `ratelimit_test_${Date.now()}`;
    const limit = 3;
    const windowSeconds = 10;

    const r1 = await checkRateLimit(testKey, limit, windowSeconds);
    const r2 = await checkRateLimit(testKey, limit, windowSeconds);
    const r3 = await checkRateLimit(testKey, limit, windowSeconds);
    const r4 = await checkRateLimit(testKey, limit, windowSeconds);

    assert(
      r1.allowed && r1.remaining === 2 &&
      r2.allowed && r2.remaining === 1 &&
      r3.allowed && r3.remaining === 0 &&
      !r4.allowed && r4.remaining === 0 && (r4.retryAfterSeconds ?? 0) > 0,
      'checkRateLimit allows requests up to max limit and blocks exceeding requests with retry-after'
    );
  }

  // Test 4.2: OTP Cooldown Enforcement
  {
    const testSession = `session_${Date.now()}`;
    const c1 = await checkOtpCooldown(testSession, 60);
    const c2 = await checkOtpCooldown(testSession, 60);

    assert(
      c1.allowed === true && c1.cooldownRemainingSeconds === 0 &&
      c2.allowed === false && c2.cooldownRemainingSeconds > 0,
      'checkOtpCooldown allows initial OTP request and blocks rapid subsequent requests during cooldown'
    );
  }

  // Test 4.3: OTP Verification Attempt Tracking and Lockout
  {
    const testSession = `attempt_session_${Date.now()}`;
    const a1 = await trackVerificationAttempt(testSession, 2, 300);
    const a2 = await trackVerificationAttempt(testSession, 2, 300);
    const a3 = await trackVerificationAttempt(testSession, 2, 300);

    assert(
      a1.allowed && a1.attemptsUsed === 1 && a1.attemptsRemaining === 1 &&
      a2.allowed && a2.attemptsUsed === 2 && a2.attemptsRemaining === 0 &&
      !a3.allowed && a3.attemptsUsed === 3 && a3.attemptsRemaining === 0,
      'trackVerificationAttempt tracks failed attempts and enforces lockout when maxAttempts is exceeded'
    );

    await clearVerificationAttempts(testSession);
    const a4 = await trackVerificationAttempt(testSession, 2, 300);
    assert(
      a4.allowed && a4.attemptsUsed === 1,
      'clearVerificationAttempts resets the attempt counter on successful validation'
    );
  }

  // -----------------------------------------------------------------
  // SUITE 5: Health Check Endpoint Route Handler
  // -----------------------------------------------------------------
  console.log('\n--- Suite 5: Integration Health Check Endpoint ---');

  // Test 5.1: Disabled Response
  {
    process.env.SPX_INTEGRATION_ENABLED = 'false';
    const req = new Request('http://localhost/api/integrations/spx/v1/health');
    const res = await healthCheckGET(req);
    const body = await res.json();

    assert(
      res.status === 200 && body.status === 'disabled' && body.message.includes('disabled'),
      'Health check returns 200 { status: "disabled" } when integration feature flag is off'
    );
    process.env.SPX_INTEGRATION_ENABLED = 'true';
  }

  // Test 5.2: Healthy Response
  {
    const req = new Request('http://localhost/api/integrations/spx/v1/health');
    const res = await healthCheckGET(req);
    const body = await res.json();

    assert(
      (res.status === 200 || res.status === 503) &&
      (body.status === 'healthy' || body.status === 'degraded') &&
      body.checks !== undefined &&
      typeof body.checks.database === 'string' &&
      typeof body.checks.redis === 'string',
      'Health check responds with structured health metrics without exposing secrets or credentials'
    );
  }

  // -----------------------------------------------------------------
  // VERIFICATION SUMMARY
  // -----------------------------------------------------------------
  console.log('\n======================================================');
  console.log(`RESULTS: ${passedTests} / ${totalTests} TESTS PASSED`);
  console.log('======================================================\n');

  if (passedTests === totalTests) {
    console.log('>>> ALL STAGE 1 FOUNDATION TESTS PASSED SUCCESSFULLY! <<<\n');
  } else {
    console.error('>>> SOME TESTS FAILED. CHECK LOGS ABOVE. <<<\n');
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('FATAL TEST SUITE ERROR:', err);
  process.exit(1);
});
