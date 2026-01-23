import { redirect, notFound } from 'next/navigation';
import { getPostBySlugAsync } from '@/lib/posts';
import { getBlogPostUrl } from '@/lib/url';

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

// Redirect old /blog/[slug] URLs to new /blog/categories/[...category]/[slug] URLs
export default async function BlogPostRedirect({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getPostBySlugAsync(slug);

  if (!post) {
    notFound();
  }

  // Redirect to the new URL format
  const newUrl = getBlogPostUrl(post.categorySlugPath || [], post.slug);
  redirect(newUrl);
}

// Keep generateStaticParams for backwards compatibility during build
export async function generateStaticParams() {
  return [];
}
