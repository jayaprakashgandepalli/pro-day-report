import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSpxRedis } from '@/lib/integrations/spx/redis';
import { recordAuditLog, getCorrelationId } from '@/lib/integrations/spx/audit-logger';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const correlationId = getCorrelationId(req);
  const isEnabled = process.env.SPX_INTEGRATION_ENABLED === 'true';

  if (!isEnabled) {
    return NextResponse.json(
      {
        status: 'disabled',
        version: 'v1',
        timestamp: new Date().toISOString(),
        message: 'SPX Voice integration is currently disabled.',
      },
      { status: 200 }
    );
  }

  // Probe Database
  let dbStatus: 'connected' | 'disconnected' = 'disconnected';
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch (err) {
    dbStatus = 'disconnected';
  }

  // Probe Redis
  let redisStatus: 'connected' | 'disconnected' = 'disconnected';
  try {
    const redis = getSpxRedis();
    const isAvail = await redis.ping();
    if (isAvail) {
      redisStatus = 'connected';
    }
  } catch (_) {
    redisStatus = 'disconnected';
  }

  const isHealthy = dbStatus === 'connected' && redisStatus === 'connected';

  recordAuditLog({
    correlationId,
    collegeId: null,
    credentialIdentity: null,
    endpoint: '/api/integrations/spx/v1/health',
    action: 'HEALTH_CHECK',
    status: isHealthy ? 'SUCCESS' : 'FAILURE',
    detail: `Health check: db=${dbStatus}, redis=${redisStatus}`,
  });

  return NextResponse.json(
    {
      status: isHealthy ? 'healthy' : 'degraded',
      version: 'v1',
      timestamp: new Date().toISOString(),
      checks: {
        integrationEnabled: true,
        database: dbStatus,
        redis: redisStatus,
      },
    },
    { status: isHealthy ? 200 : 503 }
  );
}

