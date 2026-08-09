import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest, logAuditEvent } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CreateTaskSchema } from '@/lib/validators';

export const dynamic = 'force-dynamic';


export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || !session.organizationId) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status');

    const where: any = {
      organizationId: session.organizationId,
    };

    // If employee, filter by employeeId
    if (session.role === 'EMPLOYEE') {
      where.employeeId = session.employeeId;
    }

    if (statusFilter && statusFilter !== 'ALL') {
      where.status = statusFilter;
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        employee: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'OWNER' || !session.organizationId) {
      return NextResponse.json({ error: 'Unauthorized manager access.' }, { status: 403 });
    }

    const body = await req.json();
    const result = CreateTaskSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { title, description, employeeId, priority, dueDate, location } = result.data;

    const task = await prisma.task.create({
      data: {
        organizationId: session.organizationId,
        employeeId: employeeId || null,
        title,
        description: description || null,
        priority: priority || 'MEDIUM',
        status: 'ASSIGNED',
        dueDate: dueDate ? new Date(dueDate) : null,
        location: location || null,
      },
    });

    await logAuditEvent({
      performerId: session.userId,
      action: 'TASK_CREATED',
      entityType: 'TASK',
      entityId: task.id,
      metadata: { title, employeeId },
    });

    return NextResponse.json({ message: 'Task created successfully', task });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
