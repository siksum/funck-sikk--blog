import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: '이메일을 입력해주세요.' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: '올바른 이메일 형식이 아닙니다.' }, { status: 400 });
    }

    // Check if already subscribed
    const existing = await prisma.emailSubscription.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existing) {
      if (existing.isActive) {
        return NextResponse.json({ error: '이미 구독 중인 이메일입니다.' }, { status: 400 });
      }
      // Reactivate subscription
      await prisma.emailSubscription.update({
        where: { email: email.toLowerCase() },
        data: { isActive: true },
      });
      return NextResponse.json({ message: '구독이 다시 활성화되었습니다.' });
    }

    // Create new subscription
    await prisma.emailSubscription.create({
      data: {
        email: email.toLowerCase(),
        isActive: true,
      },
    });

    return NextResponse.json({ message: '구독해 주셔서 감사합니다!' });
  } catch (error) {
    console.error('Email subscription error:', error);
    return NextResponse.json({ error: '구독 처리 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
