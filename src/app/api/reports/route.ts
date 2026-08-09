import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatDuration } from '@/lib/utils';

export const dynamic = 'force-dynamic';


export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'OWNER' || !session.organizationId) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const exportCsv = searchParams.get('export') === 'true';

    const employees = await prisma.employee.findMany({
      where: { organizationId: session.organizationId },
      include: {
        user: { select: { name: true, email: true } },
        workSessions: true,
        tasks: true,
      },
    });

    const reportData = employees.map((emp) => {
      const totalHoursSeconds = emp.workSessions.reduce((acc, s) => acc + (s.duration || 0), 0);
      const tasksAssigned = emp.tasks.length;
      const tasksCompleted = emp.tasks.filter((t) => t.status === 'COMPLETED').length;
      const completionPercentage = tasksAssigned > 0 ? Math.round((tasksCompleted / tasksAssigned) * 100) : 0;

      return {
        employeeId: emp.id,
        name: emp.user.name,
        email: emp.user.email,
        designation: emp.designation || 'Field Rep',
        totalWorkingDuration: formatDuration(totalHoursSeconds),
        totalSeconds: totalHoursSeconds,
        tasksAssigned,
        tasksCompleted,
        completionPercentage: `${completionPercentage}%`,
      };
    });

    if (exportCsv) {
      const headers = ['Employee Name,Email,Designation,Total Working Hours,Tasks Assigned,Tasks Completed,Completion Rate'];
      const rows = reportData.map((r) =>
        `"${r.name}","${r.email}","${r.designation}","${r.totalWorkingDuration}",${r.tasksAssigned},${r.tasksCompleted},"${r.completionPercentage}"`
      );
      const csvContent = [...headers, ...rows].join('\n');

      return new Response(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="fieldtrack_report_${Date.now()}.csv"`,
        },
      });
    }

    return NextResponse.json({ reports: reportData });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
