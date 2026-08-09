import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'EMPLOYEE' || !session.employeeId || !session.organizationId) {
      return NextResponse.json({ error: 'Unauthorized employee access.' }, { status: 403 });
    }

    // Verify organization access status in database
    const org = await prisma.organization.findUnique({
      where: { id: session.organizationId },
    });

    if (!org || org.accessStatus !== 'ACTIVE') {
      return NextResponse.json(
        { error: `Organization access is currently ${org?.accessStatus || 'INACTIVE'}. Contact administrator.` },
        { status: 403 }
      );
    }

    if (org.accessExpiresAt && new Date(org.accessExpiresAt) < new Date()) {
      await prisma.organization.update({
        where: { id: org.id },
        data: { accessStatus: 'EXPIRED' },
      });
      return NextResponse.json(
        { error: 'Organization access has expired. Contact administrator.' },
        { status: 403 }
      );
    }

    const { latitude, longitude, accuracy } = await req.json().catch(() => ({}));

    // Check if there is already an active work session
    const existingSession = await prisma.workSession.findFirst({
      where: {
        employeeId: session.employeeId,
        status: 'ACTIVE',
      },
    });

    if (existingSession) {
      return NextResponse.json({
        message: 'Work session is already active',
        workSession: existingSession,
      });
    }

    // Create WorkSession and set Employee currentStatus to WORKING
    const newSession = await prisma.$transaction(async (tx) => {
      const ws = await tx.workSession.create({
        data: {
          employeeId: session.employeeId!,
          organizationId: session.organizationId!,
          startTime: new Date(),
          startLat: latitude || null,
          startLng: longitude || null,
          status: 'ACTIVE',
        },
      });

      await tx.employee.update({
        where: { id: session.employeeId! },
        data: {
          currentStatus: 'WORKING',
          lastSeenAt: new Date(),
        },
      });

      if (typeof latitude === 'number' && typeof longitude === 'number') {
        await tx.employeeLocation.create({
          data: {
            employeeId: session.employeeId!,
            organizationId: session.organizationId!,
            workSessionId: ws.id,
            latitude,
            longitude,
            accuracy: accuracy || null,
            timestamp: new Date(),
          },
        });
      }

      return ws;
    });

    return NextResponse.json({
      message: 'Work started successfully!',
      workSession: newSession,
    });
  } catch (error) {
    console.error('Work start error:', error);
    return NextResponse.json({ error: 'Failed to start work session.' }, { status: 500 });
  }
}
