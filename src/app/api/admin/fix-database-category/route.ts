import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

// POST: Fix database category paths
// This updates databases that have partial category names to full paths
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get all databases
    const databases = await prisma.sikkDatabase.findMany();

    // Get all categories to build a lookup map
    const categories = await prisma.sikkCategory.findMany({
      include: {
        parent: true,
      },
    });

    // Build category name to full path mapping
    const categoryPathMap: Record<string, string> = {};

    for (const cat of categories) {
      if (cat.parent) {
        // This is a child category - map the child name to full path
        const fullPath = `${cat.parent.name}/${cat.name}`;
        categoryPathMap[cat.name] = fullPath;
      } else {
        // This is a root category
        categoryPathMap[cat.name] = cat.name;
      }
    }

    const updates: { id: string; oldCategory: string; newCategory: string }[] = [];

    for (const db of databases) {
      if (!db.category) continue;

      // Check if the category is a partial name that needs to be expanded
      const isAlreadyFullPath = db.category.includes('/');

      if (!isAlreadyFullPath && categoryPathMap[db.category]) {
        const newCategory = categoryPathMap[db.category];

        // Only update if the new path is different (i.e., it's a child category)
        if (newCategory !== db.category) {
          await prisma.sikkDatabase.update({
            where: { id: db.id },
            data: { category: newCategory },
          });

          updates.push({
            id: db.id,
            oldCategory: db.category,
            newCategory,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${updates.length} database(s)`,
      updates,
    });
  } catch (error) {
    console.error('Failed to fix database categories:', error);
    return NextResponse.json({ error: 'Failed to fix categories' }, { status: 500 });
  }
}

// GET: Preview what would be fixed
export async function GET() {
  const session = await auth();

  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const databases = await prisma.sikkDatabase.findMany({
      select: { id: true, title: true, category: true },
    });

    const categories = await prisma.sikkCategory.findMany({
      include: { parent: true },
    });

    const categoryPathMap: Record<string, string> = {};

    for (const cat of categories) {
      if (cat.parent) {
        categoryPathMap[cat.name] = `${cat.parent.name}/${cat.name}`;
      } else {
        categoryPathMap[cat.name] = cat.name;
      }
    }

    const preview = databases
      .filter((db) => {
        if (!db.category) return false;
        const isAlreadyFullPath = db.category.includes('/');
        return !isAlreadyFullPath && categoryPathMap[db.category] && categoryPathMap[db.category] !== db.category;
      })
      .map((db) => ({
        id: db.id,
        title: db.title,
        currentCategory: db.category,
        suggestedCategory: categoryPathMap[db.category!],
      }));

    return NextResponse.json({
      categoryMap: categoryPathMap,
      databasesToFix: preview,
    });
  } catch (error) {
    console.error('Failed to preview fix:', error);
    return NextResponse.json({ error: 'Failed to preview' }, { status: 500 });
  }
}
