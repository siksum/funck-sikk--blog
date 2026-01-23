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
          include: {
            parent: {
              include: {
                parent: true, // Support up to 3 levels of nesting
              },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    });

    // Build full slugPath for each category based on its parent chain
    return sections.map((section) => ({
      ...section,
      categories: section.categories.map((cat) => {
        const slugPath: string[] = [];
        const path: string[] = [];

        // Build path from parent chain (root to current)
        if (cat.parent?.parent) {
          slugPath.push(cat.parent.parent.slug);
          path.push(cat.parent.parent.name);
        }
        if (cat.parent) {
          slugPath.push(cat.parent.slug);
          path.push(cat.parent.name);
        }
        slugPath.push(cat.slug);
        path.push(cat.name);

        return {
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          slugPath,
          path,
        };
      }),
    }));
  } catch (error) {
    console.error('Failed to fetch sikk sections:', error);
    return [];
  }
}

export default async function SikkPage() {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    redirect('/');
  }

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
