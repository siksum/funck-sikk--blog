import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const session = await auth();
  const body = await request.json();
  const { endpoint, keys } = body;

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json(
      { error: 'Invalid subscription data' },
      { status: 400 }
    );
  }

  const subscription = await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: {
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      userId: session?.user?.id || null,
    },
    update: {
      p256dh: keys.p256dh,
      auth: keys.auth,
      userId: session?.user?.id || null,
    },
  });

  return NextResponse.json({ success: true, id: subscription.id });
}

export async function DELETE(request: NextRequest) {
  const { endpoint } = await request.json();

  if (!endpoint) {
    return NextResponse.json({ error: 'Endpoint required' }, { status: 400 });
  }

  await prisma.pushSubscription
    .delete({ where: { endpoint } })
    .catch(() => {});

  return NextResponse.json({ success: true });
}
