import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import webpush from 'web-push';

export async function POST() {
  const session = await auth();

  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check VAPID keys
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (!publicKey || !privateKey) {
    return NextResponse.json({
      error: 'VAPID keys not configured',
      publicKey: publicKey ? 'SET' : 'MISSING',
      privateKey: privateKey ? 'SET' : 'MISSING',
    }, { status: 500 });
  }

  // Setup VAPID
  webpush.setVapidDetails(
    `mailto:${process.env.ADMIN_EMAIL || 'admin@example.com'}`,
    publicKey,
    privateKey
  );

  // Get user's push subscriptions
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId: session.user.id },
  });

  if (subscriptions.length === 0) {
    return NextResponse.json({
      error: 'No push subscriptions found for your account',
      userId: session.user.id,
    }, { status: 404 });
  }

  const results = { sent: 0, failed: 0, errors: [] as string[] };

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify({
          title: '🔔 테스트 알림',
          body: '알림 시스템이 정상 작동합니다!',
          icon: '/icons/icon-192x192.png',
          url: '/',
        })
      );
      results.sent++;
    } catch (error: unknown) {
      results.failed++;
      const err = error as { message?: string; statusCode?: number };
      results.errors.push(`${err.statusCode}: ${err.message}`);

      // Remove invalid subscriptions
      if (err.statusCode === 410) {
        await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
      }
    }
  }

  return NextResponse.json({
    message: 'Test notification sent',
    subscriptions: subscriptions.length,
    results,
  });
}
