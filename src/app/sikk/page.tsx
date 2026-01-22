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

async function getSikkDatabases() {
  try {
    const databases = await prisma.sikkDatabase.findMany({
      where: { isPublic: true },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { items: true },
        },
      },
    });
    return databases;
  } catch (error) {
    console.error('Failed to fetch sikk databases:', error);
    return [];
  }
}

export default async function SikkPage() {
  // Check admin access
  const session = await auth();
  if (!session?.user?.isAdmin) {
    redirect('/');
  }

  const [recentPosts, categories, tags, rootCategoriesWithTags, sections, databases] = await Promise.all([
    getRecentSikkPostsAsync(5),
    getSikkRootCategoriesAsync(),
    getAllSikkTagsAsync(),
    getSikkRootCategoriesWithTagsAsync(),
    getSikkSections(),
    getSikkDatabases(),
  ]);

  return (
    <SikkPageContent
      rootCategoriesWithTags={rootCategoriesWithTags}
      recentPosts={recentPosts}
      categories={categories}
      tags={tags}
      sections={sections}
      databases={databases}
    />
  );
}
