import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSikkDatabaseItemUrl } from '@/lib/url';

interface DatabaseItemPageProps {
  params: Promise<{ slug: string; itemId: string }>;
}

// Redirect old /sikk/db/[slug]/[itemId] URLs to new /sikk/categories/[...category]/db/[slug]/[itemId] URLs
export default async function DatabaseItemRedirect({ params }: DatabaseItemPageProps) {
  const { slug, itemId } = await params;

  const database = await prisma.sikkDatabase.findUnique({
    where: { slug },
    select: { slug: true, category: true },
  });

  if (!database) {
    notFound();
  }

  // Verify the item exists
  const item = await prisma.sikkDatabaseItem.findFirst({
    where: { id: itemId, database: { slug } },
    select: { id: true },
  });

  if (!item) {
    notFound();
  }

  // Convert category name path to slug path
  const categorySlugPath = database.category
    ? database.category.split('/')
    : [];

  // Redirect to the new URL format
  const newUrl = getSikkDatabaseItemUrl(categorySlugPath, database.slug, itemId);
  redirect(newUrl);
}

// Keep generateStaticParams for backwards compatibility during build
export async function generateStaticParams() {
  return [];
}
