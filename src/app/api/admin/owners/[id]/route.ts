import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const owner = await prisma.user.findFirst({
      where: { id: params.id, role: 'OWNER' },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        emailVerifiedAt: true,
        createdAt: true,
        ownedOrganization: {
          include: {
            subscription: true,
            employees: {
              include: {
                user: { select: { name: true, email: true } },
              },
            },
            accessGrants: {
              orderBy: { createdAt: 'desc' },
              take: 20,
            },
          },
        },
        auditLogsReceived: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!owner) {
      return NextResponse.json({ error: 'Owner not found' }, { status: 404 });
    }

    return NextResponse.json({ owner });
  } catch (error) {
    console.error('Fetch owner detail error:', error);
    return NextResponse.json({ error: 'Failed to fetch owner details' }, { status: 500 });
  }
}
