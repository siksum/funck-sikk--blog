import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 });
    }

    const subscription = await prisma.emailSubscription.findUnique({
      where: { unsubscribeToken: token },
    });

    if (!subscription) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 404 });
    }

    await prisma.emailSubscription.delete({
      where: { id: subscription.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return NextResponse.json({ error: 'Failed to unsubscribe' }, { status: 500 });
  }
}
