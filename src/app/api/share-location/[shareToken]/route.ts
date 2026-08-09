import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { shareToken: string } }) {
  try {
    const shareRecord = await prisma.locationShareToken.findUnique({
      where: { shareToken: params.shareToken },
      include: {
        organization: { select: { name: true } },
        employee: {
          include: {
            user: { select: { name: true } },
          },
        },
      },
    });

    if (!shareRecord || !shareRecord.isActive) {
      return NextResponse.json({ error: 'Share link invalid or deactivated' }, { status: 404 });
    }

    if (shareRecord.expiresAt && new Date(shareRecord.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'Share link has expired' }, { status: 410 });
    }

    // Fetch employee or active employees in organization
    const employeeWhere = shareRecord.employeeId
      ? { id: shareRecord.employeeId, organizationId: shareRecord.organizationId }
      : { organizationId: shareRecord.organizationId, isActive: true };

    const employees = await prisma.employee.findMany({
      where: employeeWhere,
      select: {
        id: true,
        currentStatus: true,
        lastSeenAt: true,
        designation: true,
        user: { select: { name: true } },
        locations: {
          orderBy: { timestamp: 'desc' },
          take: 1,
          select: { latitude: true, longitude: true, accuracy: true, timestamp: true },
        },
        tasks: {
          where: { status: { in: ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS'] } },
          take: 1,
          select: { title: true, status: true },
        },
      },
    });

    // Recent trail points for primary employee (last 50 location points)
    let trailPoints: Array<{ latitude: number; longitude: number; timestamp: Date }> = [];
    if (shareRecord.employeeId) {
      const points = await prisma.employeeLocation.findMany({
        where: { employeeId: shareRecord.employeeId },
        orderBy: { timestamp: 'desc' },
        take: 50,
        select: { latitude: true, longitude: true, timestamp: true },
      });
      trailPoints = points.reverse();
    }

    return NextResponse.json({
      organizationName: shareRecord.organization.name,
      title: shareRecord.title || 'Live Location Tracking',
      expiresAt: shareRecord.expiresAt,
      employees: employees.map((emp) => {
        const lastLoc = emp.locations[0];
        return {
          id: emp.id,
          name: emp.user.name,
          designation: emp.designation,
          status: emp.currentStatus,
          lastSeenAt: emp.lastSeenAt,
          task: emp.tasks[0]?.title || null,
          latitude: lastLoc?.latitude || null,
          longitude: lastLoc?.longitude || null,
          accuracy: lastLoc?.accuracy || null,
          updatedAt: lastLoc?.timestamp || null,
        };
      }),
      trailPoints,
    });
  } catch (error) {
    console.error('Fetch public share location error:', error);
    return NextResponse.json({ error: 'Failed to load live location data' }, { status: 500 });
  }
}
