import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSikkDatabaseUrl } from '@/lib/url';

interface DatabasePageProps {
  params: Promise<{ slug: string }>;
}

// Redirect old /sikk/db/[slug] URLs to new /sikk/categories/[...category]/db/[slug] URLs
export default async function DatabaseRedirect({ params }: DatabasePageProps) {
  const { slug } = await params;

  const database = await prisma.sikkDatabase.findUnique({
    where: { slug },
    select: { slug: true, category: true },
  });

  if (!database) {
    notFound();
  }

  // Convert category name path to slug path
  const categorySlugPath = database.category
    ? database.category.split('/')
    : [];

  // Redirect to the new URL format
  const newUrl = getSikkDatabaseUrl(categorySlugPath, database.slug);
  redirect(newUrl);
}

// Keep generateStaticParams for backwards compatibility during build
export async function generateStaticParams() {
  return [];
}
