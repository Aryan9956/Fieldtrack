import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || !session.organizationId) {
    return new Response('Unauthorized', { status: 403 });
  }

  const orgId = session.organizationId;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendUpdate = async () => {
        try {
          const employees = await prisma.employee.findMany({
            where: { organizationId: orgId, isActive: true },
            include: {
              user: { select: { name: true } },
              locations: {
                take: 1,
                orderBy: { timestamp: 'desc' },
              },
              tasks: {
                where: { status: { in: ['IN_PROGRESS', 'ACCEPTED'] } },
                take: 1,
              },
            },
          });

          const mapData = employees.map((emp) => {
            const lastLoc = emp.locations[0];
            return {
              id: emp.id,
              name: emp.user.name,
              status: emp.currentStatus,
              task: emp.tasks[0]?.title || 'No active task',
              lat: lastLoc?.latitude || 19.076,
              lng: lastLoc?.longitude || 72.8777,
              lastSeen: emp.lastSeenAt ? new Date(emp.lastSeenAt).toLocaleTimeString() : 'Never',
            };
          });

          controller.enqueue(encoder.encode(`data: ${JSON.stringify(mapData)}\n\n`));
        } catch (e) {
          console.error('SSE Error:', e);
        }
      };

      // Send initial
      await sendUpdate();

      // Interval stream every 10s
      const interval = setInterval(sendUpdate, 10000);

      req.signal.addEventListener('abort', () => {
        clearInterval(interval);
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
