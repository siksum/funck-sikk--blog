import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  if (!token) {
    return NextResponse.redirect(new URL('/subscribe/error', baseUrl));
  }

  const subscription = await prisma.emailSubscription.findUnique({
    where: { verifyToken: token },
  });

  if (!subscription) {
    return NextResponse.redirect(new URL('/subscribe/error', baseUrl));
  }

  await prisma.emailSubscription.update({
    where: { id: subscription.id },
    data: { isVerified: true, verifyToken: null },
  });

  return NextResponse.redirect(new URL('/subscribe/success', baseUrl));
}
