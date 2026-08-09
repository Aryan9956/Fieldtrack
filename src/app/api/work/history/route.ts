import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'EMPLOYEE' || !session.employeeId) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const sessions = await prisma.workSession.findMany({
      where: { employeeId: session.employeeId },
      orderBy: { startTime: 'desc' },
      take: 50,
    });

    return NextResponse.json({ sessions });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch work history' }, { status: 500 });
  }
}
