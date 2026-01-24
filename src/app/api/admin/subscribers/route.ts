import { NextRequest, NextResponse } from 'next/server';
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
    prisma.pushSubscription.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return NextResponse.json({
    email: emailSubscribers,
    push: pushSubscribers,
    pushCount: pushSubscribers.length,
  });
}

export async function DELETE(request: NextRequest) {
  const session = await auth();

  if (!isDev && !session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id, type } = await request.json();

  if (!id || !type) {
    return NextResponse.json({ error: 'ID and type required' }, { status: 400 });
  }

  try {
    if (type === 'email') {
      await prisma.emailSubscription.delete({ where: { id } });
    } else if (type === 'push') {
      await prisma.pushSubscription.delete({ where: { id } });
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
