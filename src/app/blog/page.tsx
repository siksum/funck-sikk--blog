import BlogPageContent from '@/components/blog/BlogPageContent';
import { getRecentPosts, getAllTags, getRootCategoriesWithTags, getRootCategories } from '@/lib/posts';

export const metadata = {
  title: '블로그 | func(sikk)',
  description: '모든 블로그 포스트',
};

export default function BlogPage() {
  const recentPosts = getRecentPosts(5);
  const categories = getRootCategories();
  const tags = getAllTags();
  const rootCategoriesWithTags = getRootCategoriesWithTags();

  return (
    <BlogPageContent
      rootCategoriesWithTags={rootCategoriesWithTags}
      recentPosts={recentPosts}
      categories={categories}
      tags={tags}
    />
  );
}
