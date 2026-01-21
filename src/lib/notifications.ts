import { prisma } from './db';
import { Resend } from 'resend';
import webpush from 'web-push';

function getResend() {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    `mailto:${process.env.ADMIN_EMAIL || 'admin@example.com'}`,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

interface NotificationPayload {
  title: string;
  slug: string;
  description: string;
}

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  url?: string;
}

interface PushSubscriptionData {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

export async function sendPushToUsers(userIds: string[], payload: PushPayload) {
  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    return { sent: 0, failed: 0 };
  }

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId: { in: userIds } },
  });

  return sendPushToSubscriptions(subscriptions, payload);
}

export async function sendPushToSubscriptions(
  subscriptions: PushSubscriptionData[],
  payload: PushPayload
) {
  const results = { sent: 0, failed: 0 };

  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    return results;
  }

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify({
          ...payload,
          icon: payload.icon || '/icons/icon-192x192.png',
        })
      );
      results.sent++;
    } catch (error: unknown) {
      const webPushError = error as { statusCode?: number };
      if (webPushError.statusCode === 410) {
        await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
      }
      results.failed++;
    }
  }

  return results;
}

interface CommentWithAuthor {
  id: string;
  content: string;
  author: { name: string | null };
}

export async function sendCommentNotification(
  comment: CommentWithAuthor,
  postSlug: string,
  commentAuthorId: string
) {
  const existingComments = await prisma.comment.findMany({
    where: { postSlug },
    select: { authorId: true },
    distinct: ['authorId'],
  });

  const userIdsToNotify = [
    ...new Set(
      existingComments
        .map((c) => c.authorId)
        .filter((id) => id !== commentAuthorId)
    ),
  ];

  if (userIdsToNotify.length === 0) return { sent: 0, failed: 0 };

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const payload: PushPayload = {
    title: `${comment.author.name || '누군가'}님이 댓글을 남겼습니다`,
    body: comment.content.slice(0, 100),
    url: `${baseUrl}/blog/${postSlug}#comment-${comment.id}`,
  };

  return sendPushToUsers(userIdsToNotify, payload);
}

export async function sendNewPostNotifications(payload: NotificationPayload) {
  const { title, slug, description } = payload;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const postUrl = `${baseUrl}/blog/${slug}`;

  const results = {
    emailsSent: 0,
    pushSent: 0,
    errors: [] as string[],
  };

  // Send email notifications
  const resend = getResend();
  if (resend) {
    const emailSubscribers = await prisma.emailSubscription.findMany({
      where: { isVerified: true },
    });

    for (const sub of emailSubscribers) {
      try {
        await resend.emails.send({
          from: 'func(sikk) <noreply@sikk.com>',
          to: sub.email,
          subject: `새 포스트: ${title}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>${title}</h2>
              <p>${description}</p>
              <a href="${postUrl}"
                 style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 8px;">
                포스트 읽기
              </a>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;" />
              <p style="color: #666; font-size: 12px;">
                <a href="${baseUrl}/unsubscribe?token=${sub.unsubscribeToken}" style="color: #666;">
                  구독 취소
                </a>
              </p>
            </div>
          `,
        });
        results.emailsSent++;

        await prisma.emailSubscription.update({
          where: { id: sub.id },
          data: { lastNotified: new Date() },
        });
      } catch (error) {
        results.errors.push(`Email to ${sub.email}: ${error}`);
      }
    }
  }

  // Send push notifications
  if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    const pushSubscribers = await prisma.pushSubscription.findMany();

    for (const sub of pushSubscribers) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify({
            title: `새 포스트: ${title}`,
            body: description,
            icon: '/favicon.ico',
            url: postUrl,
          })
        );
        results.pushSent++;
      } catch (error: unknown) {
        const webPushError = error as { statusCode?: number };
        if (webPushError.statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } });
        }
        results.errors.push(`Push to ${sub.endpoint}: ${error}`);
      }
    }
  }

  return results;
}
