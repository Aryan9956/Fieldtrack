import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'OWNER' || !session.organizationId) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get('date'); // YYYY-MM-DD

    let dateFilter: any = {};
    if (dateStr) {
      const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
      const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);
      dateFilter = {
        timestamp: {
          gte: startOfDay,
          lte: endOfDay,
        },
      };
    }

    const locations = await prisma.employeeLocation.findMany({
      where: {
        employeeId: params.id,
        organizationId: session.organizationId,
        ...dateFilter,
      },
      orderBy: { timestamp: 'asc' },
      take: 500, // Reasonable cap
    });

    return NextResponse.json({ locations });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch location history' }, { status: 500 });
  }
}
