import { NextResponse } from 'next/server';
import { authenticateSpxM2M, SpxAuthError } from '@/lib/integrations/spx/auth';
import { checkRateLimit } from '@/lib/integrations/spx/rate-limiter';
import { getVillagesByMandal } from '@/lib/integrations/spx/address-utils';
import { recordAuditLog, getCorrelationId } from '@/lib/integrations/spx/audit-logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/integrations/spx/v1/addresses/mandals/[mandalId]/villages
 * Returns villages belonging strictly to the specified mandal.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ mandalId: string }> }
) {
  const correlationId = getCorrelationId(req);
  const endpoint = '/api/integrations/spx/v1/addresses/mandals/[mandalId]/villages';

  try {
    const auth = await authenticateSpxM2M(req);
    const { mandalId } = await params;

    if (!mandalId || !mandalId.trim()) {
      return NextResponse.json(
        { success: false, error: 'INVALID_MANDAL_ID', message: 'A valid mandal ID is required' },
        { status: 400 }
      );
    }

    const rateLimit = await checkRateLimit(`addr_villages:${auth.collegeId}`, 120, 60, correlationId, auth.collegeId);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'RATE_LIMIT_EXCEEDED', message: 'Rate limit exceeded. Please retry later.' },
        { status: 429 }
      );
    }

    const villages = await getVillagesByMandal(mandalId.trim());
    if (villages === null) {
      return NextResponse.json(
        { success: false, error: 'MANDAL_NOT_FOUND', message: `Mandal ID '${mandalId}' not found` },
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
      detail: `Returned ${villages.length} villages for mandal ${mandalId}`,
    });

    return NextResponse.json(
      {
        success: true,
        mandalId: mandalId.trim(),
        count: villages.length,
        villages,
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

