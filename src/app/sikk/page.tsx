import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import SikkPageContent from '@/components/sikk/SikkPageContent';
import { getRecentSikkPostsAsync, getAllSikkTagsAsync, getSikkRootCategoriesWithTagsAsync, getSikkRootCategoriesAsync } from '@/lib/sikk';

export const metadata = {
  title: 'Sikk | func(sikk)',
  description: '개인 공부 자료',
};

export const revalidate = 10;

export default async function SikkPage() {
  // Check admin access
  const session = await auth();
  if (!session?.user?.isAdmin) {
    redirect('/');
  }

  const [recentPosts, categories, tags, rootCategoriesWithTags] = await Promise.all([
    getRecentSikkPostsAsync(5),
    getSikkRootCategoriesAsync(),
    getAllSikkTagsAsync(),
    getSikkRootCategoriesWithTagsAsync(),
  ]);

  return (
    <SikkPageContent
      rootCategoriesWithTags={rootCategoriesWithTags}
      recentPosts={recentPosts}
      categories={categories}
      tags={tags}
    />
  );
}
