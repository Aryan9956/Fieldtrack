import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { LocationUpdateSchema } from '@/lib/validators';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'EMPLOYEE' || !session.employeeId || !session.organizationId) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    // Check organization active status
    const org = await prisma.organization.findUnique({
      where: { id: session.organizationId },
    });

    if (!org || org.accessStatus !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Organization access is inactive. Location update rejected.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const result = LocationUpdateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: 'Invalid location data' }, { status: 400 });
    }

    const { latitude, longitude, accuracy } = result.data;

    // Check if employee is in an active work session
    const activeSession = await prisma.workSession.findFirst({
      where: {
        employeeId: session.employeeId,
        status: 'ACTIVE',
      },
    });

    if (!activeSession) {
      return NextResponse.json(
        { message: 'Location update ignored: Employee is not currently in an active work session.' },
        { status: 200 }
      );
    }

    // Check last location to prevent spamming duplicate updates
    const lastLoc = await prisma.employeeLocation.findFirst({
      where: { employeeId: session.employeeId },
      orderBy: { timestamp: 'desc' },
    });

    if (lastLoc) {
      const timeDiffSeconds = (Date.now() - new Date(lastLoc.timestamp).getTime()) / 1000;
      const isSameCoords = Math.abs(lastLoc.latitude - latitude) < 0.0001 && Math.abs(lastLoc.longitude - longitude) < 0.0001;

      if (isSameCoords && timeDiffSeconds < 10) {
        return NextResponse.json({ message: 'Duplicate location throttled' });
      }
    }

    const newLoc = await prisma.employeeLocation.create({
      data: {
        employeeId: session.employeeId,
        organizationId: session.organizationId,
        workSessionId: activeSession.id,
        latitude,
        longitude,
        accuracy: accuracy || null,
        timestamp: new Date(),
      },
    });

    await prisma.employee.update({
      where: { id: session.employeeId },
      data: { lastSeenAt: new Date() },
    });

    return NextResponse.json({ message: 'Location updated', location: newLoc });
  } catch (error) {
    console.error('Location update error:', error);
    return NextResponse.json({ error: 'Failed to record location update' }, { status: 500 });
  }
}
