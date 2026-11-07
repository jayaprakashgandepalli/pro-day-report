import { NextResponse } from 'next/server';
import { authenticateSpxM2M, SpxAuthError } from '@/lib/integrations/spx/auth';
import { checkRateLimit } from '@/lib/integrations/spx/rate-limiter';
import { getDistricts } from '@/lib/integrations/spx/address-utils';
import { recordAuditLog, getCorrelationId } from '@/lib/integrations/spx/audit-logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/integrations/spx/v1/addresses/districts
 * Returns all available District master records.
 */
export async function GET(req: Request) {
  const correlationId = getCorrelationId(req);
  const endpoint = '/api/integrations/spx/v1/addresses/districts';

  try {
    const auth = await authenticateSpxM2M(req);

    const rateLimit = await checkRateLimit(`addr_districts:${auth.collegeId}`, 120, 60, correlationId, auth.collegeId);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'RATE_LIMIT_EXCEEDED', message: 'Rate limit exceeded. Please retry later.' },
        { status: 429 }
      );
    }

    const districts = await getDistricts();

    recordAuditLog({
      correlationId,
      collegeId: auth.collegeId,
      credentialIdentity: auth.credentialId,
      endpoint,
      action: 'ADDRESS_SEARCH',
      status: 'SUCCESS',
      detail: `Returned ${districts.length} districts`,
    });

    return NextResponse.json(
      {
        success: true,
        count: districts.length,
        districts,
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

