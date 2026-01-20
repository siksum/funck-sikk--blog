import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { getAllSikkPosts } from '@/lib/sikk';
import { SikkCategory } from '@prisma/client';

// POST sync sikk categories from MDX files
export async function POST() {
  const session = await auth();
  const isDev = process.env.NODE_ENV === 'development';

  if (!isDev && !session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get all categories from MDX files
    const posts = getAllSikkPosts();
    const categoriesSet = new Set<string>();

    posts.forEach((post) => {
      if (post.category) {
        categoriesSet.add(post.category);
      }
    });

    const mdxCategories = Array.from(categoriesSet);
    const created: string[] = [];

    // Helper to generate slug
    const generateSlug = (name: string) => {
      return name
        .toLowerCase()
        .replace(/[^a-z0-9가-힣]+/g, '-')
        .replace(/^-|-$/g, '');
    };

    for (const categoryPath of mdxCategories) {
      const parts = categoryPath.split('/');
      let parentId: string | null = null;

      for (const part of parts) {
        const baseSlug = generateSlug(part);

        // Check if category exists
        const existing: SikkCategory | null = await prisma.sikkCategory.findFirst({
          where: {
            name: part,
            parentId,
          },
        });

        if (existing) {
          parentId = existing.id;
        } else {
          // Get max order
          const maxOrderResult = await prisma.sikkCategory.aggregate({
            where: { parentId },
            _max: { order: true },
          });
          const newOrder = (maxOrderResult._max.order ?? 0) + 1;

          // Handle duplicate slug by appending a number
          let finalSlug = baseSlug;
          let counter = 1;
          let slugExists = await prisma.sikkCategory.findUnique({ where: { slug: finalSlug } });
          while (slugExists) {
            finalSlug = `${baseSlug}-${counter}`;
            counter++;
            slugExists = await prisma.sikkCategory.findUnique({ where: { slug: finalSlug } });
          }

          const newCategory: SikkCategory = await prisma.sikkCategory.create({
            data: {
              name: part,
              slug: finalSlug,
              parentId,
              order: newOrder,
            },
          });
          created.push(part);
          parentId = newCategory.id;
        }
      }
    }

    return NextResponse.json({
      success: true,
      synced: mdxCategories.length,
      created: created.length,
      createdCategories: created,
    });
  } catch (error) {
    console.error('Failed to sync sikk categories:', error);
    return NextResponse.json({ error: 'Failed to sync categories' }, { status: 500 });
  }
}
