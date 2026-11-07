import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateSpxM2M, SpxAuthError } from '@/lib/integrations/spx/auth';
import { checkRateLimit } from '@/lib/integrations/spx/rate-limiter';
import { recordAuditLog, getCorrelationId } from '@/lib/integrations/spx/audit-logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/integrations/spx/v1/college/knowledge
 * Retrieves approved college knowledge from ConfigValue.
 * Preserves source and category. Returns empty array if no approved knowledge exists.
 */
export async function GET(req: Request) {
  const correlationId = getCorrelationId(req);
  const endpoint = '/api/integrations/spx/v1/college/knowledge';

  try {
    // 1. M2M Authentication with 'college:read' scope
    const auth = await authenticateSpxM2M(req, ['college:read']);

    // 2. Rate Limiting per Tenant
    const rateLimit = await checkRateLimit(`college_knowledge:${auth.collegeId}`, 120, 60, correlationId, auth.collegeId);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'RATE_LIMIT_EXCEEDED',
          message: 'Rate limit exceeded. Please retry later.',
          retryAfterSeconds: rateLimit.retryAfterSeconds,
        },
        { status: 429 }
      );
    }

    // 3. Query Approved Knowledge from ConfigValue:
    // - College-specific records (e.g., catchment schools, tenant configurations)
    // - System-approved master dictionaries (Academic streams 'GROUP', 'STUDY_INTEREST', 'FEE_BEARABLE')
    const configs = await prisma.configValue.findMany({
      where: {
        OR: [
          { collegeId: auth.collegeId },
          {
            type: { in: ['GROUP', 'STUDY_INTEREST', 'FEE_BEARABLE'] },
            collegeId: null,
          },
        ],
      },
      select: {
        id: true,
        type: true,
        value: true,
        grade: true,
        strength: true,
        headmasterName: true,
        collegeId: true,
      },
      orderBy: [{ type: 'asc' }, { value: 'asc' }],
    });

    // 4. Map Knowledge with Provenance
    const knowledge = configs.map((item) => {
      let category = item.type;
      if (item.type === 'GROUP') category = 'ACADEMIC_STREAM';
      else if (item.type === 'STUDY_INTEREST') category = 'STUDY_MODE_PREFERENCE';
      else if (item.type === 'FEE_BEARABLE') category = 'FEE_BEARABILITY';
      else if (item.type === 'SCHOOL') category = 'FEEDER_HIGH_SCHOOL';

      const isCollegeSpecific = item.collegeId === auth.collegeId;

      return {
        id: item.id,
        category,
        rawType: item.type,
        fact: item.value,
        source: isCollegeSpecific ? 'COLLEGE_SPECIFIC' : 'APPROVED_MASTER_DICTIONARY',
        details: item.type === 'SCHOOL'
          ? {
              grade: item.grade || null,
              strength: item.strength || 0,
            }
          : undefined,
      };
    });

    recordAuditLog({
      correlationId,
      collegeId: auth.collegeId,
      credentialIdentity: auth.credentialId,
      endpoint,
      action: 'COLLEGE_KNOWLEDGE_READ',
      status: 'SUCCESS',
      detail: `Returned ${knowledge.length} approved knowledge facts`,
    });

    return NextResponse.json(
      {
        success: true,
        count: knowledge.length,
        knowledge,
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

    recordAuditLog({
      correlationId,
      collegeId: null,
      credentialIdentity: null,
      endpoint,
      action: 'INTERNAL_ERROR',
      status: 'FAILURE',
      detail: err.message,
    });

    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

