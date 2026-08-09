import { NextResponse } from 'next/server';
import { devEmailLogs } from '@/lib/email/dev-provider';

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  return NextResponse.json({
    emails: devEmailLogs,
    count: devEmailLogs.length,
  });
}
