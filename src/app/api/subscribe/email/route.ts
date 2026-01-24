import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: '이메일을 입력해주세요.' }, { status: 400 });
    }

    const emailLower = email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailLower)) {
      return NextResponse.json({ error: '올바른 이메일 형식이 아닙니다.' }, { status: 400 });
    }

    // Check if already subscribed
    const existing = await prisma.emailSubscription.findUnique({
      where: { email: emailLower },
    });

    if (existing) {
      return NextResponse.json({ error: '이미 구독 중인 이메일입니다.' }, { status: 409 });
    }

    // Create new subscription
    await prisma.emailSubscription.create({
      data: {
        email: emailLower,
        isVerified: true, // Auto-verify for simplicity
      },
    });

    return NextResponse.json({ success: true, message: '구독이 완료되었습니다.' });
  } catch (error) {
    console.error('Email subscription error:', error);
    return NextResponse.json({ error: '구독 처리 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
