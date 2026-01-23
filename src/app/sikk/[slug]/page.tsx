import { redirect, notFound } from 'next/navigation';
import { getSikkPostBySlugAsync } from '@/lib/sikk';
import { getSikkPostUrl } from '@/lib/url';

interface SikkPostPageProps {
  params: Promise<{ slug: string }>;
}

// Redirect old /sikk/[slug] URLs to new /sikk/categories/[...category]/[slug] URLs
export default async function SikkPostRedirect({ params }: SikkPostPageProps) {
  const { slug } = await params;
  const post = await getSikkPostBySlugAsync(slug);

  if (!post) {
    notFound();
  }

  // Redirect to the new URL format
  const newUrl = getSikkPostUrl(post.categorySlugPath || [], post.slug);
  redirect(newUrl);
}

// Keep generateStaticParams for backwards compatibility during build
export async function generateStaticParams() {
  return [];
}
