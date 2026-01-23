import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import SikkCategoryPageContent from '@/components/sikk/SikkCategoryPageContent';
import DatabaseTableView from '@/components/sikk/DatabaseTableView';
import DatabaseItemContent from '@/components/sikk/DatabaseItemContent';
import ReadingProgressBar from '@/components/blog/ReadingProgressBar';
import PostNavigation from '@/components/blog/PostNavigation';
import FloatingActions from '@/components/blog/FloatingActions';
import DifficultyBadge from '@/components/blog/DifficultyBadge';
import SikkPostLayout from '@/components/sikk/SikkPostLayout';
import SikkPostContent from '@/components/sikk/SikkPostContent';
import ShareButton from '@/components/sikk/ShareButton';
import { getSikkPostUrl } from '@/lib/url';
import {
  getSikkCategoryBySlugPathAsync,
  getSikkCategoryBySlugPathFromDbAsync,
  getSikkPostsByCategoryPathAsync,
  getSikkChildCategoriesWithTagsAsync,
  getAllSikkCategoriesHierarchicalAsync,
  getAllSikkTagsAsync,
  getSikkRootCategoriesAsync,
  getSikkPostBySlugAsync,
  getRelatedSikkPostsAsync,
  getAdjacentSikkPostsAsync,
  getSikkSectionsAsync,
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
export const dynamicParams = true;

// Parse the slugPath to determine route type
// New URL structure: /sikk/categories/[categoryPath]/[dbSlug]/[?itemId]
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

  // PRIORITY 1: Check for posts FIRST (most common case)
  // Post slugs are unique, so if a post exists with this slug, always show it
  // The category path in URL is for SEO/readability, not for routing
  if (slugPath.length >= 1) {
    const possiblePostSlug = slugPath[slugPath.length - 1];
    const possibleCategorySlugPath = slugPath.slice(0, -1);

    // Check if a post exists with this slug
    const post = await getSikkPostBySlugAsync(possiblePostSlug);

    if (post) {
      // Post found - always return it (slug is unique across all categories)
      // Use the post's actual category path for the response
      return { type: 'post' as const, categorySlugPath: post.categorySlugPath || [], postSlug: possiblePostSlug, post };
    }
  }

  // PRIORITY 2: Check for databases
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

  // PRIORITY 3: Normal category route
  return { type: 'category' as const, categorySlugPath: slugPath };
}

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

  // Post page
  if (parsed.type === 'post') {
    return {
      title: `${parsed.post.title} | Sikk`,
      description: parsed.post.description || '',
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
  try {
    const categories = await getAllSikkCategoriesHierarchicalAsync();

    // Filter out categories with empty or invalid slugPath (catch-all route requires at least one segment)
    const validParams = categories
      .filter((category) => {
        // Ensure slugPath exists, is an array, and has at least one non-empty segment
        if (!category.slugPath || !Array.isArray(category.slugPath)) return false;
        if (category.slugPath.length === 0) return false;
        // Ensure all segments are non-empty strings
        return category.slugPath.every((segment) => typeof segment === 'string' && segment.length > 0);
      })
      .map((category) => ({
        slugPath: category.slugPath,
      }));

    return validParams;
  } catch (error) {
    console.error('Error generating static params for sikk category:', error);
    return [];
  }
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
  // Handle post page first (before category null check)
  if (parsed.type === 'post') {
    const post = parsed.post;
    const isPrivate = !post.isPublic;

    const formattedDate = new Date(post.date).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const calculateReadingTime = (content: string): number => {
      const wordsPerMinute = 200;
      const words = content.trim().split(/\s+/).length;
      return Math.ceil(words / wordsPerMinute);
    };

    const estimateDifficulty = (content: string, tags: string[]): 'beginner' | 'intermediate' | 'advanced' => {
      const words = content.trim().split(/\s+/).length;
      const advancedTags = ['exploit', 'pwn', 'reverse', 'advanced', 'deep-dive'];
      const beginnerTags = ['tutorial', 'beginner', 'intro', 'basic', '입문'];

      if (tags.some((tag) => advancedTags.includes(tag.toLowerCase())) || words > 3000) {
        return 'advanced';
      }
      if (tags.some((tag) => beginnerTags.includes(tag.toLowerCase())) || words < 1000) {
        return 'beginner';
      }
      return 'intermediate';
    };

    const readingTime = calculateReadingTime(post.content);
    const [relatedPosts, { prevPost, nextPost }, categories, sections] = await Promise.all([
      getRelatedSikkPostsAsync(post.slug, 3),
      getAdjacentSikkPostsAsync(post.slug),
      getSikkRootCategoriesAsync(),
      getSikkSectionsAsync(),
    ]);
    const difficulty = estimateDifficulty(post.content, post.tags);

    return (
      <>
        <ReadingProgressBar readingTime={readingTime} />
        <SikkPostLayout
          content={post.content}
          tags={post.tags}
          category={post.category}
          relatedPosts={relatedPosts}
          categories={categories}
          currentCategorySlugPath={post.categorySlugPath}
          sections={sections}
        >
          {/* Banner Image */}
          {post.thumbnail && (
            <div className="mb-8 -mx-4 sm:-mx-6 lg:-mx-8 rounded-xl overflow-hidden">
              <div
                className="relative w-full h-64 sm:h-80 md:h-96 bg-gray-200 dark:bg-gray-700"
                style={{
                  backgroundImage: `url(${post.thumbnail})`,
                  backgroundSize: `${post.thumbnailScale || 100}%`,
                  backgroundPosition: `center ${post.thumbnailPosition || 50}%`,
                  backgroundRepeat: 'no-repeat',
                }}
              />
            </div>
          )}

          {/* Header */}
          <header className="mb-8">
            <div className="flex items-center text-sm mb-4" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
              <Link href="/sikk" className="hover:text-pink-600 dark:hover:text-pink-400 transition-colors">
                Sikk
              </Link>
              {post.category && (
                <>
                  <span className="mx-2">/</span>
                  <Link
                    href={`/sikk/categories/${(post.categorySlugPath || []).map(s => encodeURIComponent(s)).join('/')}`}
                    className="hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
                  >
                    {post.category}
                  </Link>
                </>
              )}
            </div>

            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <DifficultyBadge level={difficulty} />
              {/* Status Badge */}
              {post.status && (
                <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${
                  post.status === 'completed'
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-300 dark:border-green-700'
                    : post.status === 'in_progress'
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700'
                    : 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300 border-gray-300 dark:border-gray-700'
                }`}>
                  {post.status === 'completed' ? '완료' : post.status === 'in_progress' ? '진행중' : '시작전'}
                </span>
              )}
              {isPrivate ? (
                <span className="px-3 py-1 text-xs font-semibold bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded-full border border-yellow-300 dark:border-yellow-700">
                  비공개
                </span>
              ) : (
                <ShareButton slug={post.slug} title={post.title} />
              )}
            </div>

            <h1 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>
              {post.title}
            </h1>

            <p className="text-lg mb-6" style={{ color: 'var(--foreground)', opacity: 0.8 }}>
              {post.description}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-sm mb-6" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
              <time dateTime={post.date}>{formattedDate}</time>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {readingTime}분 읽기
              </span>
              {post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 rounded text-xs"
                      style={{ backgroundColor: 'var(--tag-bg)', color: 'var(--tag-text)' }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </header>

          {/* Pink Divider */}
          <hr className="mb-8 border-t-2 border-pink-400 dark:border-pink-500" />

          {/* Content */}
          <SikkPostContent
            content={post.content}
            slug={post.slug}
            isAdmin={true}
            initialMetadata={{
              title: post.title,
              description: post.description || '',
              date: post.date.split('T')[0],
              tags: post.tags,
              status: (post.status as 'not_started' | 'in_progress' | 'completed') || 'not_started',
              isPublic: post.isPublic,
              category: post.category || '',
              thumbnail: post.thumbnail,
              thumbnailPosition: post.thumbnailPosition,
              thumbnailScale: post.thumbnailScale,
            }}
          />

          {/* Post Navigation */}
          <PostNavigation
            prevPost={prevPost}
            nextPost={nextPost}
            basePath="/sikk/categories"
            variant="pink"
          />

          {/* Footer */}
          <footer className="mt-12 pt-8 border-t-2 border-pink-300 dark:border-pink-500">
            <Link
              href={post.categorySlugPath && post.categorySlugPath.length > 0
                ? `/sikk/categories/${post.categorySlugPath.map(s => encodeURIComponent(s)).join('/')}`
                : '/sikk'}
              className="inline-flex items-center text-pink-600 dark:text-pink-400 hover:underline"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              {post.category || 'Sikk'} 목록으로 돌아가기
            </Link>
          </footer>
        </SikkPostLayout>
        <FloatingActions />
      </>
    );
  }

  // Category is required for all remaining routes (database, database-item, category)
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
    const databaseUrl = `/sikk/categories/${parsed.categorySlugPath.map(s => encodeURIComponent(s)).join('/')}/${parsed.dbSlug}`;

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
                    href={`/sikk/categories/${parsed.categorySlugPath.slice(0, index + 1).map(s => encodeURIComponent(s)).join('/')}`}
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
                    href={`/sikk/categories/${parsed.categorySlugPath.slice(0, index + 1).map(s => encodeURIComponent(s)).join('/')}`}
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
            href={`/sikk/categories/${parsed.categorySlugPath.map(s => encodeURIComponent(s)).join('/')}`}
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
