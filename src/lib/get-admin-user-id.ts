import { prisma } from './db';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'namyoung0718@gmail.com';

/**
 * Get the admin user ID for my-world data access.
 * If the logged-in user's email matches the admin email,
 * returns the user ID that has data (regardless of provider).
 * This allows admin to access their data from any OAuth provider.
 */
export async function getAdminUserId(
  sessionUserId: string | undefined,
  sessionEmail: string | undefined | null
): Promise<string> {
  // If not admin email, use the session user id or dev-user
  if (sessionEmail !== ADMIN_EMAIL) {
    return sessionUserId || 'dev-user';
  }

  // For admin email, find the user with that email who has data
  const adminUser = await prisma.user.findFirst({
    where: { email: ADMIN_EMAIL },
    orderBy: { createdAt: 'asc' }, // Get the oldest account (likely has data)
  });

  if (adminUser) {
    return adminUser.id;
  }

  // Fallback to session user id or dev-user
  return sessionUserId || 'dev-user';
}
