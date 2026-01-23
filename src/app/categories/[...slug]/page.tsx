import { redirect } from 'next/navigation';

interface CategoryPageProps {
  params: Promise<{ slug: string[] }>;
}

// Redirect old /categories/[...] URLs to new /blog/categories/[...] URLs
// Note: This is a backup - the middleware should handle this redirect
export default async function CategoryRedirect({ params }: CategoryPageProps) {
  const { slug } = await params;

  // Build the new URL path with encoded segments
  const encodedPath = slug.map(s => encodeURIComponent(s)).join('/');
  const newUrl = `/blog/categories/${encodedPath}`;

  redirect(newUrl);
}

// Keep generateStaticParams for backwards compatibility during build
export async function generateStaticParams() {
  return [];
}
