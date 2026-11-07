import { NextResponse } from 'next/server';
import { authenticateSpxM2M, SpxAuthError } from '@/lib/integrations/spx/auth';
import { checkRateLimit } from '@/lib/integrations/spx/rate-limiter';
import { getMandalsByDistrict } from '@/lib/integrations/spx/address-utils';
import { recordAuditLog, getCorrelationId } from '@/lib/integrations/spx/audit-logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/integrations/spx/v1/addresses/districts/[districtId]/mandals
 * Returns mandals belonging strictly to the specified district.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ districtId: string }> }
) {
  const correlationId = getCorrelationId(req);
  const endpoint = '/api/integrations/spx/v1/addresses/districts/[districtId]/mandals';

  try {
    const auth = await authenticateSpxM2M(req);
    const { districtId } = await params;

    if (!districtId || !districtId.trim()) {
      return NextResponse.json(
        { success: false, error: 'INVALID_DISTRICT_ID', message: 'A valid district ID is required' },
        { status: 400 }
      );
    }

    const rateLimit = await checkRateLimit(`addr_mandals:${auth.collegeId}`, 120, 60, correlationId, auth.collegeId);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'RATE_LIMIT_EXCEEDED', message: 'Rate limit exceeded. Please retry later.' },
        { status: 429 }
      );
    }

    const mandals = await getMandalsByDistrict(districtId.trim());
    if (mandals === null) {
      return NextResponse.json(
        { success: false, error: 'DISTRICT_NOT_FOUND', message: `District ID '${districtId}' not found` },
        { status: 404 }
      );
    }

    recordAuditLog({
      correlationId,
      collegeId: auth.collegeId,
      credentialIdentity: auth.credentialId,
      endpoint,
      action: 'ADDRESS_SEARCH',
      status: 'SUCCESS',
      detail: `Returned ${mandals.length} mandals for district ${districtId}`,
    });

    return NextResponse.json(
      {
        success: true,
        districtId: districtId.trim(),
        count: mandals.length,
        mandals,
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

