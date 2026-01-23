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

export interface CategoryAccessResult extends AccessCheckResult {
  categoryId?: string;
  categoryName?: string;
  categorySlugPath?: string[];
  includeSubcategories?: boolean;
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

  // Check category-level sharing
  let categoryHasShareSettings = false;
  if (post.category) {
    // Check if this category has share settings (admin is controlling access)
    const categoryShareCheck = await checkCategoryHasShareSettings(post.category);
    categoryHasShareSettings = categoryShareCheck;

    const categoryAccess = await checkPostCategoryAccess(post.category, session);
    if (categoryAccess.canAccess) {
      return categoryAccess;
    }
  }

  // If post is marked as public (legacy isPublic field), allow access
  // BUT if the category has share settings, the admin wants to control access - don't allow public access
  // Also, if the post has its own share settings, don't allow public access without proper token/invitation
  if (post.isPublic && !post.share && !categoryHasShareSettings) {
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

// ============ CATEGORY SHARING ============

/**
 * Build category slug path from category and its parents
 */
async function buildCategorySlugPath(categoryId: string): Promise<string[]> {
  const slugPath: string[] = [];
  let currentId: string | null = categoryId;

  while (currentId) {
    const category: { slug: string; parentId: string | null } | null = await prisma.sikkCategory.findUnique({
      where: { id: currentId },
      select: { slug: true, parentId: true },
    });
    if (!category) break;
    slugPath.unshift(category.slug);
    currentId = category.parentId;
  }

  return slugPath;
}

/**
 * Get category by slug path
 */
async function getCategoryBySlugPath(slugPath: string[]): Promise<{ id: string; name: string } | null> {
  if (slugPath.length === 0) return null;

  let currentCategory = await prisma.sikkCategory.findFirst({
    where: { slug: slugPath[0], parentId: null },
    select: { id: true, name: true },
  });

  for (let i = 1; i < slugPath.length; i++) {
    if (!currentCategory) return null;
    currentCategory = await prisma.sikkCategory.findFirst({
      where: { slug: slugPath[i], parentId: currentCategory.id },
      select: { id: true, name: true },
    });
  }

  return currentCategory;
}

/**
 * Check if a user can access a Sikk category
 * @param categorySlugPath - Category slug path array
 * @param session - User session (null if not logged in)
 * @param publicToken - Optional public share token
 */
export async function checkSikkCategoryAccess(
  categorySlugPath: string[],
  session: Session | null,
  publicToken?: string
): Promise<AccessCheckResult> {
  // Admin always has access
  if (session?.user?.isAdmin) {
    return { canAccess: true, accessType: 'admin' };
  }

  // Find the category
  const category = await getCategoryBySlugPath(categorySlugPath);
  if (!category) {
    return { canAccess: false, accessType: 'denied', reason: 'not_found' };
  }

  // Get category share
  const share = await prisma.sikkCategoryShare.findUnique({
    where: { categoryId: category.id },
    include: { invitations: true },
  });

  // Check public token access
  if (publicToken && share) {
    if (share.publicEnabled && share.publicToken === publicToken) {
      if (share.publicExpiresAt && new Date(share.publicExpiresAt) < new Date()) {
        return { canAccess: false, accessType: 'denied', reason: 'expired' };
      }
      return { canAccess: true, accessType: 'public_token' };
    }
  }

  // Check invitation access (requires login)
  if (session?.user?.email && share) {
    const invitation = share.invitations.find(
      (inv) => inv.email === session.user?.email && inv.status !== 'revoked'
    );

    if (invitation) {
      if (invitation.expiresAt && new Date(invitation.expiresAt) < new Date()) {
        return { canAccess: false, accessType: 'denied', reason: 'expired' };
      }

      if (invitation.status === 'pending') {
        await prisma.sikkCategoryShareInvitation.update({
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

  // Check parent categories if includeSubcategories is enabled
  const parentAccess = await checkParentCategoryAccess(categorySlugPath, session);
  if (parentAccess.canAccess) {
    return parentAccess;
  }

  // No access
  if (!session) {
    return { canAccess: false, accessType: 'denied', reason: 'login_required' };
  }

  return { canAccess: false, accessType: 'denied', reason: 'not_invited' };
}

/**
 * Check if parent categories grant access (via includeSubcategories)
 */
async function checkParentCategoryAccess(
  categorySlugPath: string[],
  session: Session | null
): Promise<AccessCheckResult> {
  // Check each parent category
  for (let i = categorySlugPath.length - 1; i > 0; i--) {
    const parentSlugPath = categorySlugPath.slice(0, i);
    const parentCategory = await getCategoryBySlugPath(parentSlugPath);
    if (!parentCategory) continue;

    const parentShare = await prisma.sikkCategoryShare.findUnique({
      where: { categoryId: parentCategory.id },
      include: { invitations: true },
    });

    if (!parentShare || !parentShare.includeSubcategories) continue;

    // Check parent invitation access
    if (session?.user?.email) {
      const invitation = parentShare.invitations.find(
        (inv) => inv.email === session.user?.email && inv.status !== 'revoked'
      );

      if (invitation) {
        if (invitation.expiresAt && new Date(invitation.expiresAt) < new Date()) {
          continue;
        }
        return { canAccess: true, accessType: 'invited' };
      }
    }

    // Check parent public token (only if publicEnabled and includeSubcategories)
    if (parentShare.publicEnabled) {
      if (parentShare.publicExpiresAt && new Date(parentShare.publicExpiresAt) < new Date()) {
        continue;
      }
      // Note: For subcategory access via parent, user needs direct token or invitation
      // Public access to parent doesn't automatically grant access to subcategories without token
    }
  }

  return { canAccess: false, accessType: 'denied' };
}

/**
 * Check access by category public share token (for /sc/[token] route)
 */
export async function checkSikkCategoryAccessByToken(token: string): Promise<CategoryAccessResult> {
  const share = await prisma.sikkCategoryShare.findUnique({
    where: { publicToken: token },
    include: {
      category: {
        select: {
          id: true,
          name: true,
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

  const slugPath = await buildCategorySlugPath(share.categoryId);

  return {
    canAccess: true,
    accessType: 'public_token',
    categoryId: share.category.id,
    categoryName: share.category.name,
    categorySlugPath: slugPath,
    includeSubcategories: share.includeSubcategories,
  };
}

/**
 * Get share settings for a category
 */
export async function getCategoryShareSettings(categorySlugPath: string[]) {
  const category = await getCategoryBySlugPath(categorySlugPath);
  if (!category) return null;

  const share = await prisma.sikkCategoryShare.findUnique({
    where: { categoryId: category.id },
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
  });

  return share;
}

/**
 * Check if a category has share settings (admin is controlling access)
 * This includes checking parent categories with includeSubcategories enabled
 * @param categoryPath - Category path (e.g., "성신여자대학교/1번")
 */
async function checkCategoryHasShareSettings(categoryPath: string): Promise<boolean> {
  const pathParts = categoryPath.split('/');

  // Find the category by name path
  let slugPath: string[] = [];
  let currentParentId: string | null = null;
  let categoryId: string | null = null;

  for (const name of pathParts) {
    const category: { id: string; slug: string } | null = await prisma.sikkCategory.findFirst({
      where: {
        name: name,
        parentId: currentParentId,
      },
      select: { id: true, slug: true },
    });

    if (!category) {
      return false;
    }

    slugPath.push(category.slug);
    currentParentId = category.id;
    categoryId = category.id;
  }

  if (!categoryId) return false;

  // Check if this category has share settings
  const share = await prisma.sikkCategoryShare.findUnique({
    where: { categoryId },
  });

  if (share) {
    return true;
  }

  // Check parent categories with includeSubcategories enabled
  for (let i = slugPath.length - 1; i > 0; i--) {
    const parentSlugPath = slugPath.slice(0, i);
    const parentCategory = await getCategoryBySlugPath(parentSlugPath);
    if (!parentCategory) continue;

    const parentShare = await prisma.sikkCategoryShare.findUnique({
      where: { categoryId: parentCategory.id },
    });

    if (parentShare && parentShare.includeSubcategories) {
      return true;
    }
  }

  return false;
}

/**
 * Check if a post is accessible via category sharing
 * @param categoryPath - Post's category path (e.g., "성신여자대학교/1번")
 * @param session - User session
 */
export async function checkPostCategoryAccess(
  categoryPath: string | null,
  session: Session | null
): Promise<AccessCheckResult> {
  if (!categoryPath) {
    return { canAccess: false, accessType: 'denied', reason: 'not_found' };
  }

  // Convert category path to slug path
  const pathParts = categoryPath.split('/');

  // Find the category by name path and build slug path
  let slugPath: string[] = [];
  let currentParentId: string | null = null;

  for (const name of pathParts) {
    const category: { id: string; slug: string } | null = await prisma.sikkCategory.findFirst({
      where: {
        name: name,
        parentId: currentParentId,
      },
      select: { id: true, slug: true },
    });

    if (!category) {
      // Category not found in DB, cannot check sharing
      return { canAccess: false, accessType: 'denied', reason: 'not_found' };
    }

    slugPath.push(category.slug);
    currentParentId = category.id;
  }

  // Check category access
  return checkSikkCategoryAccess(slugPath, session);
}
