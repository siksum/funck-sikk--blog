import { redirect } from 'next/navigation';

interface CategoryPageProps {
  params: Promise<{ slugPath: string[] }>;
}

// Redirect old /sikk/category/[...] URLs to new /sikk/categories/[...] URLs
// Note: This is a backup - the middleware should handle this redirect
export default async function SikkCategoryRedirect({ params }: CategoryPageProps) {
  const { slugPath } = await params;

  // Build the new URL path with encoded segments
  const encodedPath = slugPath.map(s => encodeURIComponent(s)).join('/');
  const newUrl = `/sikk/categories/${encodedPath}`;

  redirect(newUrl);
}

// Keep generateStaticParams for backwards compatibility during build
export async function generateStaticParams() {
  return [];
}
