import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = Date.now();
  let dbStatus = 'healthy';
  let dbLatencyMs = 0;

  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - dbStart;
  } catch (error) {
    dbStatus = 'unhealthy';
    console.error('[HealthCheck] Database connection error:', error);
  }

  const isHealthy = dbStatus === 'healthy';
  const statusCode = isHealthy ? 200 : 503;

  return NextResponse.json(
    {
      status: isHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: {
          status: dbStatus,
          latencyMs: dbLatencyMs,
        },
        paymentSystem: {
          status: process.env.PAYMENTS_ENABLED === 'true' ? 'ACTIVE' : 'INACTIVE (₹0 Mode)',
          enabled: process.env.PAYMENTS_ENABLED === 'true',
        },
        emailProvider: process.env.EMAIL_PROVIDER || 'dev',
      },
      responseTimeMs: Date.now() - startTime,
    },
    { status: statusCode }
  );
}
