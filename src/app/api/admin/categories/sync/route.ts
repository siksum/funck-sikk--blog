import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { buildCategoryTree } from '@/lib/mdx';

// POST - Sync categories from MDX files to database
export async function POST() {
  const session = await auth();
  const isDev = process.env.NODE_ENV === 'development';

  if (!isDev && !session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const tree = buildCategoryTree();
    let created = 0;

    // Helper to generate slug
    const generateSlug = (name: string) => {
      return name
        .toLowerCase()
        .replace(/[^a-z0-9가-힣]+/g, '-')
        .replace(/^-|-$/g, '');
    };

    // Process root categories and their children
    for (const [, rootCategory] of Object.entries(tree.children)) {
      const rootSlug = generateSlug(rootCategory.name);

      // Check if root category exists
      let existingRoot = await prisma.category.findUnique({
        where: { slug: rootSlug },
      });

      if (!existingRoot) {
        // Create root category
        const maxOrder = await prisma.category.aggregate({
          where: { parentId: null },
          _max: { order: true },
        });

        existingRoot = await prisma.category.create({
          data: {
            name: rootCategory.name,
            slug: rootSlug,
            parentId: null,
            order: (maxOrder._max.order || 0) + 1,
          },
        });
        created++;
      }

      // Process child categories
      for (const [, childCategory] of Object.entries(rootCategory.children)) {
        const childSlug = generateSlug(childCategory.name);

        const existingChild = await prisma.category.findUnique({
          where: { slug: childSlug },
        });

        if (!existingChild) {
          const maxChildOrder = await prisma.category.aggregate({
            where: { parentId: existingRoot.id },
            _max: { order: true },
          });

          await prisma.category.create({
            data: {
              name: childCategory.name,
              slug: childSlug,
              parentId: existingRoot.id,
              order: (maxChildOrder._max.order || 0) + 1,
            },
          });
          created++;
        }
      }
    }

    return NextResponse.json({ success: true, created });
  } catch (error) {
    console.error('Failed to sync categories:', error);
    return NextResponse.json({ error: 'Failed to sync categories' }, { status: 500 });
  }
}
