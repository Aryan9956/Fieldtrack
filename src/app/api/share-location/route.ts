import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || !session.organizationId) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const { employeeId, durationHours, title } = await req.json().catch(() => ({}));
    const hours = parseInt(durationHours, 10) || 24;

    const shareToken = crypto.randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);

    const shareRecord = await prisma.locationShareToken.create({
      data: {
        shareToken,
        organizationId: session.organizationId,
        employeeId: employeeId || (session.role === 'EMPLOYEE' ? session.employeeId : null),
        title: title || 'Live Tracking Share',
        expiresAt,
        isActive: true,
      },
    });

    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/share-location/${shareToken}`;

    return NextResponse.json({
      message: 'Live location share link generated',
      shareToken: shareRecord.shareToken,
      shareUrl,
      expiresAt: shareRecord.expiresAt,
    });
  } catch (error) {
    console.error('Create share token error:', error);
    return NextResponse.json({ error: 'Failed to create share link' }, { status: 500 });
  }
}
