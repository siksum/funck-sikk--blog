import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import SikkCategoryPageContent from '@/components/sikk/SikkCategoryPageContent';
import DatabaseTableView from '@/components/sikk/DatabaseTableView';
import DatabaseItemContent from '@/components/sikk/DatabaseItemContent';
import {
  getSikkCategoryBySlugPathAsync,
  getSikkCategoryBySlugPathFromDbAsync,
  getSikkPostsByCategoryPathAsync,
  getSikkChildCategoriesWithTagsAsync,
  getAllSikkCategoriesHierarchicalAsync,
  getAllSikkTagsAsync,
  getSikkRootCategoriesAsync,
} from '@/lib/sikk';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

interface Column {
  id: string;
  name: string;
  type: 'date' | 'title' | 'text' | 'files' | 'url' | 'select' | 'number';
  options?: string[];
}

interface Item {
  id: string;
  data: Record<string, unknown>;
  content: string;
  order: number;
  createdAt: Date;
}

interface CategoryPageProps {
  params: Promise<{ slugPath: string[] }>;
}

export const revalidate = 10;

// Parse the slugPath to determine route type
// New URL structure: /sikk/category/[categoryPath]/[dbSlug]/[?itemId]
// No longer requires /db/ in the path
async function parseSlugPath(slugPath: string[]) {
  // Legacy support: if 'db' is in the path, use old parsing logic
  const dbIndex = slugPath.indexOf('db');
  if (dbIndex !== -1) {
    const categorySlugPath = slugPath.slice(0, dbIndex);
    const dbSlug = slugPath[dbIndex + 1];
    const itemId = slugPath[dbIndex + 2];

    if (!dbSlug) {
      return { type: 'invalid' as const };
    }

    if (itemId) {
      return { type: 'database-item' as const, categorySlugPath, dbSlug, itemId };
    }

    return { type: 'database' as const, categorySlugPath, dbSlug };
  }

  // New URL structure: try to detect database by checking last segment
  if (slugPath.length >= 2) {
    // Check if last segment is a database slug under parent category
    const possibleDbSlug = slugPath[slugPath.length - 1];
    const possibleCategorySlugPath = slugPath.slice(0, -1);

    // First, get the actual category from SikkCategory table (not from posts)
    // This ensures we can find categories even if they have no posts
    const category = await getSikkCategoryBySlugPathFromDbAsync(possibleCategorySlugPath);
    if (category) {
      // Use the category's path (names) instead of slugs for database lookup
      const categoryPathString = category.path.join('/');

      // Check if a database exists with this slug under this category
      const database = await prisma.sikkDatabase.findFirst({
        where: {
          slug: possibleDbSlug,
          category: categoryPathString,
        },
        select: { slug: true, category: true },
      });

      if (database) {
        return { type: 'database' as const, categorySlugPath: possibleCategorySlugPath, dbSlug: possibleDbSlug };
      }
    }

    // Check if it's a database item (last two segments: dbSlug/itemId)
    if (slugPath.length >= 3) {
      const possibleItemId = slugPath[slugPath.length - 1];
      const possibleDbSlug2 = slugPath[slugPath.length - 2];
      const possibleCategorySlugPath2 = slugPath.slice(0, -2);

      const category2 = await getSikkCategoryBySlugPathFromDbAsync(possibleCategorySlugPath2);
      if (category2) {
        const categoryPathString2 = category2.path.join('/');

        const database2 = await prisma.sikkDatabase.findFirst({
          where: {
            slug: possibleDbSlug2,
            category: categoryPathString2,
          },
          select: { id: true, slug: true },
        });

        if (database2) {
          // Check if item exists
          const item = await prisma.sikkDatabaseItem.findFirst({
            where: {
              id: possibleItemId,
              databaseId: database2.id,
            },
            select: { id: true },
          });

          if (item) {
            return { type: 'database-item' as const, categorySlugPath: possibleCategorySlugPath2, dbSlug: possibleDbSlug2, itemId: possibleItemId };
          }
        }
      }
    }
  }

  // Normal category route
  return { type: 'category' as const, categorySlugPath: slugPath };
}

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

async function getDatabasesByCategory(categoryPath: string) {
  try {
    // Get the last part of the category path (e.g., "대학교" from "성신여자대학교/대학교")
    const categoryParts = categoryPath.split('/');
    const lastCategoryName = categoryParts[categoryParts.length - 1];

    const databases = await prisma.sikkDatabase.findMany({
      where: {
        OR: [
          // Exact match with full path
          { category: categoryPath },
          // Match with just the category name (for backwards compatibility)
          { category: lastCategoryName },
        ],
        isPublic: true,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { items: true },
        },
      },
    });
    return databases;
  } catch (error) {
    console.error('Failed to fetch databases:', error);
    return [];
  }
}

export async function generateMetadata({ params }: CategoryPageProps) {
  const { slugPath } = await params;
  const parsed = await parseSlugPath(slugPath);

  if (parsed.type === 'invalid') {
    return { title: 'Not Found' };
  }

  // Try post-based category lookup first, then DB-based fallback
  let category = await getSikkCategoryBySlugPathAsync(parsed.categorySlugPath);
  if (!category) {
    const dbCategory = await getSikkCategoryBySlugPathFromDbAsync(parsed.categorySlugPath);
    if (dbCategory) {
      category = {
        name: dbCategory.name,
        slug: dbCategory.slug,
        path: dbCategory.path,
        slugPath: dbCategory.slugPath,
        count: 0,
        directCount: 0,
        children: {},
      };
    }
  }
  if (!category) {
    return { title: 'Category Not Found' };
  }

  if (parsed.type === 'category') {
    const fullPath = category.path.join(' > ');
    return {
      title: `${fullPath} | Sikk`,
      description: `${fullPath} 카테고리의 포스트 목록`,
    };
  }

  // Database or database item
  const database = await prisma.sikkDatabase.findUnique({
    where: { slug: parsed.dbSlug },
    select: { title: true, description: true, columns: true },
  });

  if (!database) {
    return { title: 'Not Found' };
  }

  if (parsed.type === 'database') {
    return {
      title: `${database.title} | ${category.path.join(' > ')} | func(sikk)`,
      description: database.description || '',
    };
  }

  // Database item
  const item = await prisma.sikkDatabaseItem.findFirst({
    where: { id: parsed.itemId, database: { slug: parsed.dbSlug } },
    select: { data: true },
  });

  if (!item) {
    return { title: 'Not Found' };
  }

  const columns = database.columns as unknown as Column[];
  const titleColumn = columns.find((c) => c.type === 'title');
  const data = item.data as Record<string, unknown>;
  const title = titleColumn ? String(data[titleColumn.id] || '제목 없음') : '제목 없음';

  return {
    title: `${title} | ${database.title} | ${category.path.join(' > ')} | func(sikk)`,
  };
}

export async function generateStaticParams() {
  const categories = await getAllSikkCategoriesHierarchicalAsync();

  // Filter out categories with empty slugPath (catch-all route requires at least one segment)
  return categories
    .filter((category) => category.slugPath && category.slugPath.length > 0)
    .map((category) => ({
      slugPath: category.slugPath,
    }));
}

export default async function SikkCategoryPage({ params }: CategoryPageProps) {
  // Check admin access - Sikk is admin-only
  const session = await auth();
  if (!session?.user?.isAdmin) {
    redirect('/');
  }

  const isAdmin = session?.user?.isAdmin || false;
  const { slugPath } = await params;
  const parsed = await parseSlugPath(slugPath);

  if (parsed.type === 'invalid') {
    notFound();
  }

  // For database pages, use DB-based category lookup (works even with no posts in category)
  // For normal category pages, use post-based lookup with DB fallback
  let category = await getSikkCategoryBySlugPathAsync(parsed.categorySlugPath);
  if (!category) {
    // Fallback to DB-based lookup for categories without posts (e.g., database-only categories)
    const dbCategory = await getSikkCategoryBySlugPathFromDbAsync(parsed.categorySlugPath);
    if (dbCategory) {
      // Create a minimal category object compatible with the expected interface
      category = {
        name: dbCategory.name,
        slug: dbCategory.slug,
        path: dbCategory.path,
        slugPath: dbCategory.slugPath,
        count: 0,
        directCount: 0,
        children: {},
      };
    }
  }
  if (!category) {
    notFound();
  }

  // Handle database item page
  if (parsed.type === 'database-item') {
    const database = await prisma.sikkDatabase.findUnique({
      where: { slug: parsed.dbSlug },
      select: { id: true, title: true, slug: true, columns: true, isPublic: true, category: true },
    });

    if (!database || (!database.isPublic && !isAdmin)) {
      notFound();
    }

    // Verify database belongs to this category
    const expectedCategoryPath = category.path.join('/');
    if (database.category !== expectedCategoryPath) {
      notFound();
    }

    const item = await prisma.sikkDatabaseItem.findFirst({
      where: { id: parsed.itemId, databaseId: database.id },
    });

    if (!item) {
      notFound();
    }

    const columns = database.columns as unknown as Column[];
    const titleColumn = columns.find((c) => c.type === 'title');
    const data = item.data as Record<string, unknown>;
    const title = titleColumn ? String(data[titleColumn.id] || '제목 없음') : '제목 없음';
    const databaseUrl = `/sikk/category/${parsed.categorySlugPath.map(s => encodeURIComponent(s)).join('/')}/${parsed.dbSlug}`;

    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="mb-8">
          <nav className="mb-4">
            <ol
              className="flex items-center gap-2 text-sm flex-wrap"
              style={{ color: 'var(--foreground)', opacity: 0.7 }}
            >
              <li>
                <Link href="/sikk" className="hover:text-pink-600 dark:hover:text-pink-400 transition-colors">
                  Sikk
                </Link>
              </li>
              {category.path.map((name, index) => (
                <li key={index} className="flex items-center gap-2">
                  <span className="mx-1">/</span>
                  <Link
                    href={`/sikk/category/${parsed.categorySlugPath.slice(0, index + 1).map(s => encodeURIComponent(s)).join('/')}`}
                    className="hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
                  >
                    {name}
                  </Link>
                </li>
              ))}
              <li className="flex items-center gap-2">
                <span className="mx-1">/</span>
                <Link href={databaseUrl} className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                  {database.title}
                </Link>
              </li>
            </ol>
          </nav>

          <h1 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>
            {title}
          </h1>

          <div className="flex flex-wrap gap-4 text-sm" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
            {columns
              .filter((c) => c.type !== 'title' && data[c.id])
              .slice(0, 4)
              .map((column) => (
                <div key={column.id} className="flex items-center gap-1">
                  <span className="font-medium">{column.name}:</span>
                  <span>
                    {column.type === 'url' ? (
                      <a
                        href={String(data[column.id])}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-pink-600 dark:text-pink-400 hover:underline"
                      >
                        링크
                      </a>
                    ) : column.type === 'files' && Array.isArray(data[column.id]) ? (
                      `${(data[column.id] as string[]).length}개 파일`
                    ) : (
                      String(data[column.id])
                    )}
                  </span>
                </div>
              ))}
          </div>
        </header>

        <hr className="mb-8 border-t-2 border-purple-400 dark:border-purple-500" />

        <DatabaseItemContent
          databaseId={database.id}
          itemId={item.id}
          content={item.content}
          isAdmin={isAdmin}
        />

        <footer className="mt-12 pt-8 border-t" style={{ borderColor: 'var(--card-border)' }}>
          <Link
            href={databaseUrl}
            className="inline-flex items-center text-purple-600 dark:text-purple-400 hover:underline"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {database.title}(으)로 돌아가기
          </Link>
        </footer>
      </div>
    );
  }

  // Handle database page
  if (parsed.type === 'database') {
    const database = await prisma.sikkDatabase.findUnique({
      where: { slug: parsed.dbSlug },
      include: {
        items: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!database || (!database.isPublic && !isAdmin)) {
      notFound();
    }

    // Verify database belongs to this category
    const expectedCategoryPath = category.path.join('/');
    if (database.category !== expectedCategoryPath) {
      notFound();
    }

    const columns = database.columns as unknown as Column[];
    const items = database.items as unknown as Item[];

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="mb-8">
          <nav className="mb-4">
            <ol
              className="flex items-center gap-2 text-sm flex-wrap"
              style={{ color: 'var(--foreground)', opacity: 0.7 }}
            >
              <li>
                <Link href="/sikk" className="hover:text-pink-600 dark:hover:text-pink-400 transition-colors">
                  Sikk
                </Link>
              </li>
              {category.path.map((name, index) => (
                <li key={index} className="flex items-center gap-2">
                  <span className="mx-1">/</span>
                  <Link
                    href={`/sikk/category/${parsed.categorySlugPath.slice(0, index + 1).map(s => encodeURIComponent(s)).join('/')}`}
                    className="hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
                  >
                    {name}
                  </Link>
                </li>
              ))}
              <li className="flex items-center gap-2">
                <span className="mx-1">/</span>
                <span style={{ color: 'var(--foreground)' }}>{database.title}</span>
              </li>
            </ol>
          </nav>

          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h1 className="text-3xl md:text-4xl font-bold" style={{ color: 'var(--foreground)' }}>
                  {database.title}
                </h1>
                <span className="px-2 py-1 text-sm rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
                  DB
                </span>
              </div>
              {database.description && (
                <p className="text-lg" style={{ color: 'var(--foreground)', opacity: 0.8 }}>
                  {database.description}
                </p>
              )}
            </div>

            {isAdmin && (
              <Link
                href={`/admin/sikk/databases/${database.id}`}
                className="flex-shrink-0 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm"
              >
                편집
              </Link>
            )}
          </div>
        </header>

        <DatabaseTableView
          databaseId={database.id}
          databaseSlug={database.slug}
          columns={columns}
          items={items}
          isAdmin={isAdmin}
          categorySlugPath={parsed.categorySlugPath}
        />

        <footer className="mt-12 pt-8 border-t" style={{ borderColor: 'var(--card-border)' }}>
          <Link
            href={`/sikk/category/${parsed.categorySlugPath.map(s => encodeURIComponent(s)).join('/')}`}
            className="inline-flex items-center text-pink-600 dark:text-pink-400 hover:underline"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {category.name}(으)로 돌아가기
          </Link>
        </footer>
      </div>
    );
  }

  // Handle normal category page
  const categoryPathString = category.path.join('/');

  const [childCategories, directPosts, allPosts, categories, tags, sections, databases] = await Promise.all([
    getSikkChildCategoriesWithTagsAsync(parsed.categorySlugPath),
    getSikkPostsByCategoryPathAsync(parsed.categorySlugPath, false),
    getSikkPostsByCategoryPathAsync(parsed.categorySlugPath, true),
    getSikkRootCategoriesAsync(),
    getAllSikkTagsAsync(),
    getSikkSections(),
    getDatabasesByCategory(categoryPathString),
  ]);

  return (
    <SikkCategoryPageContent
      category={{
        name: category.name,
        path: category.path,
        slugPath: category.slugPath,
      }}
      childCategories={childCategories}
      directPosts={directPosts}
      allPostsCount={allPosts.length}
      categories={categories}
      tags={tags}
      sections={sections}
      databases={databases}
    />
  );
}
