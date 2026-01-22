import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import SikkPageContent from '@/components/sikk/SikkPageContent';
import { getRecentSikkPostsAsync, getAllSikkTagsAsync, getSikkRootCategoriesWithTagsAsync, getSikkRootCategoriesAsync } from '@/lib/sikk';
import { prisma } from '@/lib/db';

export const metadata = {
  title: 'Sikk | func(sikk)',
  description: '개인 공부 자료',
};

export const revalidate = 10;

async function getSikkSections() {
  try {
    const sections = await prisma.sikkSection.findMany({
      include: {
        categories: {
          where: { parentId: null },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    });
    return sections;
  } catch (error) {
    console.error('Failed to fetch sikk sections:', error);
    return [];
  }
}

export default async function SikkPage() {
  // TODO: Re-enable admin auth check
  // const session = await auth();
  // if (!session?.user?.isAdmin) {
  //   redirect('/');
  // }

  const [recentPosts, categories, tags, rootCategoriesWithTags, sections] = await Promise.all([
    getRecentSikkPostsAsync(5),
    getSikkRootCategoriesAsync(),
    getAllSikkTagsAsync(),
    getSikkRootCategoriesWithTagsAsync(),
    getSikkSections(),
  ]);

  return (
    <SikkPageContent
      rootCategoriesWithTags={rootCategoriesWithTags}
      recentPosts={recentPosts}
      categories={categories}
      tags={tags}
      sections={sections}
    />
  );
}
