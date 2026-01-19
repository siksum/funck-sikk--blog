import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

const isDev = process.env.NODE_ENV === 'development';

export async function GET() {
  const session = await auth();

  if (!isDev && !session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [emailSubscribers, pushSubscribers] = await Promise.all([
    prisma.emailSubscription.findMany({
      orderBy: { createdAt: 'desc' },
    }),
    prisma.pushSubscription.count(),
  ]);

  return NextResponse.json({
    email: emailSubscribers,
    pushCount: pushSubscribers,
  });
}
