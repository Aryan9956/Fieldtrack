import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'EMPLOYEE' || !session.employeeId) {
      return NextResponse.json({ error: 'Unauthorized employee access.' }, { status: 403 });
    }

    const { latitude, longitude } = await req.json().catch(() => ({}));

    const activeSession = await prisma.workSession.findFirst({
      where: {
        employeeId: session.employeeId,
        status: 'ACTIVE',
      },
    });

    if (!activeSession) {
      // Ensure status is OFFLINE
      await prisma.employee.update({
        where: { id: session.employeeId },
        data: { currentStatus: 'OFFLINE' },
      });
      return NextResponse.json({ message: 'No active work session found' });
    }

    const now = new Date();
    const durationSeconds = Math.floor((now.getTime() - new Date(activeSession.startTime).getTime()) / 1000);

    const endedSession = await prisma.$transaction(async (tx) => {
      const ws = await tx.workSession.update({
        where: { id: activeSession.id },
        data: {
          endTime: now,
          duration: durationSeconds,
          endLat: latitude || null,
          endLng: longitude || null,
          status: 'COMPLETED',
        },
      });

      await tx.employee.update({
        where: { id: session.employeeId! },
        data: {
          currentStatus: 'OFFLINE',
          lastSeenAt: now,
        },
      });

      return ws;
    });

    return NextResponse.json({
      message: 'Work stopped successfully!',
      workSession: endedSession,
    });
  } catch (error) {
    console.error('Work stop error:', error);
    return NextResponse.json({ error: 'Failed to stop work session.' }, { status: 500 });
  }
}
