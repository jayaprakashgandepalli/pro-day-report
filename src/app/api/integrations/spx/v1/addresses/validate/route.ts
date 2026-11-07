import { NextResponse } from 'next/server';
import { authenticateSpxM2M, SpxAuthError } from '@/lib/integrations/spx/auth';
import { checkRateLimit } from '@/lib/integrations/spx/rate-limiter';
import { validateAddressHierarchy } from '@/lib/integrations/spx/address-utils';
import { recordAuditLog, getCorrelationId } from '@/lib/integrations/spx/audit-logger';

export const dynamic = 'force-dynamic';

/**
 * POST /api/integrations/spx/v1/addresses/validate
 * Validates that district, mandal, and village IDs form an authentic, unbroken hierarchy.
 */
export async function POST(req: Request) {
  const correlationId = getCorrelationId(req);
  const endpoint = '/api/integrations/spx/v1/addresses/validate';

  try {
    const auth = await authenticateSpxM2M(req);

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'INVALID_JSON', message: 'Malformed JSON payload' },
        { status: 400 }
      );
    }

    const { districtId, mandalId, villageId } = body;
    if (!districtId || !mandalId || !villageId) {
      return NextResponse.json(
        {
          success: false,
          error: 'MISSING_FIELDS',
          message: 'districtId, mandalId, and villageId are all required for hierarchy validation',
        },
        { status: 400 }
      );
    }

    const rateLimit = await checkRateLimit(`addr_validate:${auth.collegeId}`, 120, 60, correlationId, auth.collegeId);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'RATE_LIMIT_EXCEEDED', message: 'Rate limit exceeded. Please retry later.' },
        { status: 429 }
      );
    }

    const result = await validateAddressHierarchy(districtId, mandalId, villageId);

    recordAuditLog({
      correlationId,
      collegeId: auth.collegeId,
      credentialIdentity: auth.credentialId,
      endpoint,
      action: 'ADDRESS_VALIDATED',
      status: result.valid ? 'SUCCESS' : 'FAILURE',
      detail: result.valid
        ? `Valid: ${result.hierarchy?.village.name} -> ${result.hierarchy?.mandal.name} -> ${result.hierarchy?.district.name}`
        : `Invalid: ${result.error} - ${result.reason}`,
    });

    if (!result.valid) {
      return NextResponse.json(
        {
          valid: false,
          error: result.error,
          reason: result.reason,
        },
        { status: 422 }
      );
    }

    return NextResponse.json(
      {
        valid: true,
        hierarchy: result.hierarchy,
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

