import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || !session.organizationId) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const taskId = params.id;
    const body = await req.json();
    const { status, title, description, priority, employeeId, dueDate, location } = body;

    // Check organization active status
    const org = await prisma.organization.findUnique({
      where: { id: session.organizationId },
    });
    if (!org || org.accessStatus !== 'ACTIVE') {
      return NextResponse.json({ error: 'Organization access is inactive.' }, { status: 403 });
    }

    // Role-based Task Lookup
    let taskWhere: any = { id: taskId, organizationId: session.organizationId };
    if (session.role === 'EMPLOYEE') {
      if (!session.employeeId) {
        return NextResponse.json({ error: 'Unauthorized employee account.' }, { status: 403 });
      }
      taskWhere.employeeId = session.employeeId;
    }

    const task = await prisma.task.findFirst({
      where: taskWhere,
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found or access denied.' }, { status: 404 });
    }

    const updateData: any = {};

    if (session.role === 'EMPLOYEE') {
      // Employees can ONLY update task status
      if (status) {
        if (!['ACCEPTED', 'IN_PROGRESS', 'COMPLETED'].includes(status)) {
          return NextResponse.json({ error: 'Invalid status transition.' }, { status: 400 });
        }
        updateData.status = status;
        if (status === 'COMPLETED') {
          updateData.completedAt = new Date();
        }
      }
    } else if (session.role === 'OWNER') {
      // Owners can update all task fields
      if (status) {
        updateData.status = status;
        if (status === 'COMPLETED') updateData.completedAt = new Date();
      }
      if (title) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (priority) updateData.priority = priority;
      if (employeeId !== undefined) updateData.employeeId = employeeId;
      if (dueDate) updateData.dueDate = new Date(dueDate);
      if (location !== undefined) updateData.location = location;
    }

    const updatedTask = await prisma.task.update({
      where: { id: task.id },
      data: updateData,
    });

    return NextResponse.json({ task: updatedTask });
  } catch (error) {
    console.error('Task update error:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}
