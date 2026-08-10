import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest, logAuditEvent } from '@/lib/auth';
import { pruneOldLocations } from '@/lib/location-retention';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const { days = 60 } = await req.json().catch(() => ({ days: 60 }));
    const retentionDays = typeof days === 'number' && days > 0 ? days : 60;

    const prunedCount = await pruneOldLocations(retentionDays);

    await logAuditEvent({
      performerId: session.userId,
      action: 'LOCATION_DATA_PRUNED',
      entityType: 'SYSTEM',
      metadata: { retentionDays, prunedCount },
    });

    return NextResponse.json({
      message: `Successfully pruned ${prunedCount} location points older than ${retentionDays} days.`,
      prunedCount,
    });
  } catch (error) {
    console.error('Location retention cleanup error:', error);
    return NextResponse.json({ error: 'Failed to prune old location data' }, { status: 500 });
  }
}
