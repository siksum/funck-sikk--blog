import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { Resend } from 'resend';

const isDev = process.env.NODE_ENV === 'development';
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!isDev && !session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { subject, content, targetType } = await request.json();

  if (!subject || !content) {
    return NextResponse.json({ error: 'Subject and content required' }, { status: 400 });
  }

  if (!resend) {
    return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
  }

  try {
    // Get verified email subscribers
    const subscribers = await prisma.emailSubscription.findMany({
      where: {
        isVerified: true,
        ...(targetType === 'verified' ? {} : {}),
      },
      select: { email: true },
    });

    if (subscribers.length === 0) {
      return NextResponse.json({ error: 'No subscribers to send to' }, { status: 400 });
    }

    // Send emails in batches
    const emails = subscribers.map((sub) => sub.email);
    const fromEmail = process.env.EMAIL_FROM || 'noreply@funcsikk.com';

    // Send to each subscriber
    const results = await Promise.allSettled(
      emails.map((email) =>
        resend.emails.send({
          from: `func(sikk) <${fromEmail}>`,
          to: email,
          subject,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #7c3aed;">${subject}</h1>
              <div style="line-height: 1.6;">
                ${content.replace(/\n/g, '<br>')}
              </div>
              <hr style="margin-top: 32px; border: none; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 12px;">
                이 이메일은 func(sikk) 블로그 구독자에게 발송되었습니다.
              </p>
            </div>
          `,
        })
      )
    );

    const successful = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    // Update lastNotified for all subscribers
    await prisma.emailSubscription.updateMany({
      where: { email: { in: emails } },
      data: { lastNotified: new Date() },
    });

    return NextResponse.json({
      success: true,
      sent: successful,
      failed,
      total: emails.length,
    });
  } catch (error) {
    console.error('Failed to send emails:', error);
    return NextResponse.json({ error: 'Failed to send emails' }, { status: 500 });
  }
}
