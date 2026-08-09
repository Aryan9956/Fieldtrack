import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';


export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const actionFilter = searchParams.get('action') || '';
    const search = searchParams.get('q') || '';

    const where: any = {};
    if (actionFilter) {
      where.action = actionFilter;
    }
    if (search) {
      where.OR = [
        { action: { contains: search } },
        { entityType: { contains: search } },
        { performer: { name: { contains: search } } },
        { performer: { email: { contains: search } } },
      ];
    }

    const auditLogs = await prisma.auditLog.findMany({
      where,
      include: {
        performer: {
          select: { id: true, name: true, email: true, role: true },
        },
        target: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ auditLogs });
  } catch (error) {
    console.error('Audit logs error:', error);
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }
}
