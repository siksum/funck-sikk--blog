import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { Resend } from 'resend';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: '유효한 이메일을 입력해주세요' }, { status: 400 });
    }

    const verifyToken = crypto.randomBytes(32).toString('hex');

    await prisma.emailSubscription.upsert({
      where: { email },
      update: { verifyToken, isVerified: false },
      create: { email, verifyToken },
    });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: 'func(sikk) <noreply@sikk.com>',
        to: email,
        subject: '구독 확인 - func(sikk)',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>구독해 주셔서 감사합니다!</h2>
            <p>아래 링크를 클릭하여 구독을 확인해 주세요:</p>
            <a href="${baseUrl}/api/subscribe/verify?token=${verifyToken}"
               style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 8px;">
              구독 확인하기
            </a>
            <p style="margin-top: 20px; color: #666;">
              이 이메일을 요청하지 않으셨다면 무시해주세요.
            </p>
          </div>
        `,
      });
    }

    return NextResponse.json({ success: true, message: '확인 이메일을 전송했습니다.' });
  } catch (error) {
    console.error('Email subscription error:', error);
    return NextResponse.json({ error: '구독 처리 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
