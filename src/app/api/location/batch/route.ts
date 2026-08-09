import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'EMPLOYEE' || !session.employeeId || !session.organizationId) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const org = await prisma.organization.findUnique({
      where: { id: session.organizationId },
    });

    if (!org || org.accessStatus !== 'ACTIVE') {
      return NextResponse.json({ error: 'Organization access is inactive.' }, { status: 403 });
    }

    const { points } = await req.json().catch(() => ({}));

    if (!Array.isArray(points) || points.length === 0) {
      return NextResponse.json({ error: 'No location points provided.' }, { status: 400 });
    }

    // Limit batch size to 100 points per request to prevent server overload
    const boundedPoints = points.slice(0, 100);

    const activeSession = await prisma.workSession.findFirst({
      where: {
        employeeId: session.employeeId,
        status: 'ACTIVE',
      },
    });

    if (!activeSession) {
      return NextResponse.json(
        { message: 'Batch upload ignored: Employee is not currently in an active work session.' },
        { status: 200 }
      );
    }

    const createdRecords = [];
    for (const pt of boundedPoints) {
      if (typeof pt.latitude === 'number' && typeof pt.longitude === 'number') {
        const pointDate = pt.timestamp ? new Date(pt.timestamp) : new Date();
        const rec = await prisma.employeeLocation.create({
          data: {
            employeeId: session.employeeId,
            organizationId: session.organizationId,
            workSessionId: activeSession.id,
            latitude: pt.latitude,
            longitude: pt.longitude,
            accuracy: pt.accuracy || null,
            timestamp: pointDate,
          },
        });
        createdRecords.push(rec);
      }
    }

    await prisma.employee.update({
      where: { id: session.employeeId },
      data: { lastSeenAt: new Date() },
    });

    return NextResponse.json({
      message: `Successfully synchronized ${createdRecords.length} offline location points.`,
      uploadedCount: createdRecords.length,
    });
  } catch (error) {
    console.error('Batch location upload error:', error);
    return NextResponse.json({ error: 'Failed to synchronize offline location points' }, { status: 500 });
  }
}
