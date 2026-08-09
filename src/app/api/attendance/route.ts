import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay, subDays, startOfWeek, startOfMonth } from 'date-fns';

export const dynamic = 'force-dynamic';


export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'OWNER' || !session.organizationId) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') || 'TODAY'; // TODAY | YESTERDAY | THIS_WEEK | THIS_MONTH | CUSTOM
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    const now = new Date();
    let gte: Date = startOfDay(now);
    let lte: Date = endOfDay(now);

    if (range === 'YESTERDAY') {
      const yesterday = subDays(now, 1);
      gte = startOfDay(yesterday);
      lte = endOfDay(yesterday);
    } else if (range === 'THIS_WEEK') {
      gte = startOfWeek(now, { weekStartsOn: 1 });
      lte = endOfDay(now);
    } else if (range === 'THIS_MONTH') {
      gte = startOfMonth(now);
      lte = endOfDay(now);
    } else if (range === 'CUSTOM' && startDateParam) {
      gte = startOfDay(new Date(startDateParam));
      lte = endDateParam ? endOfDay(new Date(endDateParam)) : endOfDay(now);
    }

    // Fetch all active employees in organization
    const employees = await prisma.employee.findMany({
      where: {
        organizationId: session.organizationId,
        isActive: true,
      },
      include: {
        user: { select: { name: true, email: true } },
        workSessions: {
          where: {
            startTime: {
              gte,
              lte,
            },
          },
          orderBy: { startTime: 'desc' },
        },
      },
    });

    const attendanceRecords = employees.map((emp) => {
      const totalDurationSeconds = emp.workSessions.reduce((acc, s) => acc + (s.duration || 0), 0);
      const activeSession = emp.workSessions.find((s) => s.status === 'ACTIVE');

      let status = emp.currentStatus;
      if (emp.workSessions.length === 0) {
        status = 'NOT_STARTED';
      }

      const firstSession = emp.workSessions[emp.workSessions.length - 1];
      const lastSession = emp.workSessions[0];

      return {
        employeeId: emp.id,
        name: emp.user.name,
        email: emp.user.email,
        designation: emp.designation,
        status,
        startTime: firstSession?.startTime || null,
        endTime: lastSession?.endTime || null,
        totalWorkingDurationSeconds: totalDurationSeconds,
        sessionCount: emp.workSessions.length,
      };
    });

    return NextResponse.json({ attendance: attendanceRecords, range, gte, lte });
  } catch (error) {
    console.error('Attendance error:', error);
    return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 });
  }
}
