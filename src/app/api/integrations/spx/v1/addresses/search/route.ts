import { NextResponse } from 'next/server';
import { authenticateSpxM2M, SpxAuthError } from '@/lib/integrations/spx/auth';
import { checkRateLimit } from '@/lib/integrations/spx/rate-limiter';
import { searchAddresses } from '@/lib/integrations/spx/address-utils';
import { recordAuditLog, getCorrelationId } from '@/lib/integrations/spx/audit-logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/integrations/spx/v1/addresses/search?q=...
 * Searches villages, mandals, and districts with full parent hierarchy resolution.
 * Disambiguates duplicate village names by returning their distinct parent mandals and districts.
 */
export async function GET(req: Request) {
  const correlationId = getCorrelationId(req);
  const endpoint = '/api/integrations/spx/v1/addresses/search';

  try {
    const auth = await authenticateSpxM2M(req);

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || searchParams.get('query') || '';

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'QUERY_TOO_SHORT', message: 'Search query must be at least 2 characters long' },
        { status: 400 }
      );
    }

    const rateLimit = await checkRateLimit(`addr_search:${auth.collegeId}`, 120, 60, correlationId, auth.collegeId);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'RATE_LIMIT_EXCEEDED', message: 'Rate limit exceeded. Please retry later.' },
        { status: 429 }
      );
    }

    const results = await searchAddresses(query.trim());

    recordAuditLog({
      correlationId,
      collegeId: auth.collegeId,
      credentialIdentity: auth.credentialId,
      endpoint,
      action: 'ADDRESS_SEARCH',
      status: 'SUCCESS',
      detail: `Query: '${query.trim()}' returned ${results.length} results`,
    });

    return NextResponse.json(
      {
        success: true,
        query: query.trim(),
        count: results.length,
        results,
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

