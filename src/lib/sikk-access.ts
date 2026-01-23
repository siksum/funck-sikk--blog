import { prisma } from './db';
import { Session } from 'next-auth';

export type AccessType = 'admin' | 'invited' | 'public_token' | 'denied';
export type DenialReason = 'not_found' | 'expired' | 'not_invited' | 'login_required' | 'revoked';

export interface AccessCheckResult {
  canAccess: boolean;
  accessType: AccessType;
  reason?: DenialReason;
}

export interface TokenAccessResult extends AccessCheckResult {
  slug?: string;
  title?: string;
}

/**
 * Check if a user can access a Sikk post
 * @param slug - Post slug
 * @param session - User session (null if not logged in)
 * @param publicToken - Optional public share token
 */
export async function checkSikkPostAccess(
  slug: string,
  session: Session | null,
  publicToken?: string
): Promise<AccessCheckResult> {
  // Find the post
  const post = await prisma.sikkPost.findUnique({
    where: { slug },
    include: {
      share: {
        include: {
          invitations: true,
        },
      },
    },
  });

  if (!post) {
    return { canAccess: false, accessType: 'denied', reason: 'not_found' };
  }

  // Admin always has access
  if (session?.user?.isAdmin) {
    return { canAccess: true, accessType: 'admin' };
  }

  // Check public token access
  if (publicToken && post.share) {
    const share = post.share;
    if (share.publicEnabled && share.publicToken === publicToken) {
      // Check expiration
      if (share.publicExpiresAt && new Date(share.publicExpiresAt) < new Date()) {
        return { canAccess: false, accessType: 'denied', reason: 'expired' };
      }
      return { canAccess: true, accessType: 'public_token' };
    }
  }

  // Check invitation access (requires login)
  if (session?.user?.email && post.share) {
    const invitation = post.share.invitations.find(
      (inv) => inv.email === session.user?.email && inv.status !== 'revoked'
    );

    if (invitation) {
      // Check invitation expiration
      if (invitation.expiresAt && new Date(invitation.expiresAt) < new Date()) {
        return { canAccess: false, accessType: 'denied', reason: 'expired' };
      }

      // Update invitation status if pending
      if (invitation.status === 'pending') {
        await prisma.sikkPostShareInvitation.update({
          where: { id: invitation.id },
          data: {
            status: 'accepted',
            acceptedAt: new Date(),
            userId: session.user.id,
          },
        });
      }

      return { canAccess: true, accessType: 'invited' };
    }
  }

  // If post is marked as public (legacy isPublic field), allow access
  if (post.isPublic) {
    return { canAccess: true, accessType: 'public_token' };
  }

  // No access - determine the reason
  if (!session) {
    return { canAccess: false, accessType: 'denied', reason: 'login_required' };
  }

  return { canAccess: false, accessType: 'denied', reason: 'not_invited' };
}

/**
 * Check access by public share token only (for /s/[token] route)
 * @param token - Public share token
 */
export async function checkSikkPostAccessByToken(token: string): Promise<TokenAccessResult> {
  const share = await prisma.sikkPostShare.findUnique({
    where: { publicToken: token },
    include: {
      post: {
        select: {
          slug: true,
          title: true,
        },
      },
    },
  });

  if (!share) {
    return { canAccess: false, accessType: 'denied', reason: 'not_found' };
  }

  if (!share.publicEnabled) {
    return { canAccess: false, accessType: 'denied', reason: 'not_found' };
  }

  if (share.publicExpiresAt && new Date(share.publicExpiresAt) < new Date()) {
    return { canAccess: false, accessType: 'denied', reason: 'expired' };
  }

  return {
    canAccess: true,
    accessType: 'public_token',
    slug: share.post.slug,
    title: share.post.title,
  };
}

/**
 * Get share settings for a post
 * @param slug - Post slug
 */
export async function getPostShareSettings(slug: string) {
  const post = await prisma.sikkPost.findUnique({
    where: { slug },
    include: {
      share: {
        include: {
          invitations: {
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
          },
        },
      },
    },
  });

  if (!post) {
    return null;
  }

  return post.share;
}

/**
 * Get all posts a user has been invited to
 * @param userEmail - User email
 */
export async function getInvitedPosts(userEmail: string) {
  const invitations = await prisma.sikkPostShareInvitation.findMany({
    where: {
      email: userEmail,
      status: { not: 'revoked' },
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    },
    include: {
      share: {
        include: {
          post: true,
        },
      },
    },
  });

  return invitations.map((inv) => inv.share.post);
}
