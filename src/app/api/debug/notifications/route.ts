import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { sendPushToSubscriptions } from '@/lib/notifications';
import webpush from 'web-push';

export async function GET() {
  const session = await auth();

  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get all admin users
  const adminUsers = await prisma.user.findMany({
    where: { isAdmin: true },
    select: {
      id: true,
      email: true,
      name: true,
      pushSubscriptions: {
        select: { id: true, endpoint: true, createdAt: true },
      },
    },
  });

  // Get subscriptions with null userId
  const nullUserSubscriptions = await prisma.pushSubscription.findMany({
    where: { userId: null },
    select: { id: true, endpoint: true, createdAt: true },
  });

  // Get current session info
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      isAdmin: true,
      pushSubscriptions: {
        select: { id: true, endpoint: true, createdAt: true },
      },
    },
  });

  // Check VAPID keys
  const vapidConfigured = !!(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY
  );

  return NextResponse.json({
    vapidConfigured,
    currentUser,
    adminUsers,
    nullUserSubscriptions,
    totalAdminSubscriptions: adminUsers.reduce(
      (sum, u) => sum + u.pushSubscriptions.length,
      0
    ),
    totalNullSubscriptions: nullUserSubscriptions.length,
  });
}

export async function POST() {
  const session = await auth();

  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check VAPID keys
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (!publicKey || !privateKey) {
    return NextResponse.json(
      { error: 'VAPID keys not configured' },
      { status: 500 }
    );
  }

  webpush.setVapidDetails(
    `mailto:${process.env.ADMIN_EMAIL || 'admin@example.com'}`,
    publicKey,
    privateKey
  );

  // Get ALL subscriptions (admin users + null userId)
  const adminUsers = await prisma.user.findMany({
    where: { isAdmin: true },
    include: { pushSubscriptions: true },
  });
  const adminSubscriptions = adminUsers.flatMap((u) => u.pushSubscriptions);

  const nullUserSubscriptions = await prisma.pushSubscription.findMany({
    where: { userId: null },
  });

  // Combine and deduplicate
  const subscriptionsMap = new Map<
    string,
    (typeof adminSubscriptions)[0]
  >();
  [...adminSubscriptions, ...nullUserSubscriptions].forEach((sub) => {
    subscriptionsMap.set(sub.endpoint, sub);
  });
  const allSubscriptions = Array.from(subscriptionsMap.values());

  if (allSubscriptions.length === 0) {
    return NextResponse.json({
      error: 'No push subscriptions found',
      adminSubscriptions: adminSubscriptions.length,
      nullSubscriptions: nullUserSubscriptions.length,
    });
  }

  const result = await sendPushToSubscriptions(allSubscriptions, {
    title: '🔔 일정 알림 테스트',
    body: '알림 시스템이 정상 작동합니다!',
    icon: '/icons/icon-192x192.png',
    url: '/my-world',
  });

  return NextResponse.json({
    message: 'Test notification sent',
    totalSubscriptions: allSubscriptions.length,
    adminSubscriptions: adminSubscriptions.length,
    nullSubscriptions: nullUserSubscriptions.length,
    result,
  });
}
