import { notFound } from 'next/navigation';
import Link from 'next/link';
import CategoryPageContent from '@/components/category/CategoryPageContent';
import BlogPostLayout from '@/components/blog/BlogPostLayout';
import BlogPostContent from '@/components/blog/BlogPostContent';
import CommentSection from '@/components/comments/CommentSection';
import ReadingProgressBar from '@/components/blog/ReadingProgressBar';
import PostNavigation from '@/components/blog/PostNavigation';
import FloatingActions from '@/components/blog/FloatingActions';
import SocialShareButtons from '@/components/blog/SocialShareButtons';
import EmojiReactions from '@/components/blog/EmojiReactions';
import AuthorCard from '@/components/blog/AuthorCard';
import KeyboardNavigation from '@/components/blog/KeyboardNavigation';
import HighlightShare from '@/components/blog/HighlightShare';
import DifficultyBadge from '@/components/blog/DifficultyBadge';
import BlogDatabaseTableView from '@/components/blog/BlogDatabaseTableView';
import BlogDatabaseItemContent from '@/components/blog/BlogDatabaseItemContent';
import {
  getCategoryBySlugPathAsync,
  getPostsByCategoryPathAsync,
  getChildCategoriesWithTagsAsync,
  getAllCategoriesHierarchicalAsync,
  getRecentPostsAsync,
  getAllTagsAsync,
  getRootCategoriesAsync,
  getPostBySlugAsync,
  getAllPostsAsync,
  getRelatedPostsAsync,
  getAdjacentPostsAsync,
} from '@/lib/posts';
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
async function parseSlugPath(slugPath: string[]) {
  // Check for 'db' in path (database route)
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

  // PRIORITY 1: Check if this is a valid category path FIRST
  // This ensures category listings take priority over posts with conflicting slugs
  const categoryExists = await getCategoryBySlugPathAsync(slugPath);
  if (categoryExists) {
    return { type: 'category' as const, categorySlugPath: slugPath };
  }

  // PRIORITY 2: Check if last segment is a post slug (since no category exists with this path)
  if (slugPath.length >= 1) {
    const possiblePostSlug = slugPath[slugPath.length - 1];

    // Check if a post exists with this slug
    const post = await getPostBySlugAsync(possiblePostSlug);
    if (post) {
      // Post found - show it (slug is unique across all categories)
      return { type: 'post' as const, categorySlugPath: post.categorySlugPath || [], postSlug: possiblePostSlug, post };
    }
  }

  // PRIORITY 3: Neither category nor post exists - return as category (will 404 later)
  return { type: 'category' as const, categorySlugPath: slugPath };
}

async function getSections() {
  try {
    const sections = await prisma.section.findMany({
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
    console.error('Failed to fetch sections:', error);
    return [];
  }
}

async function getDatabasesByCategory(categoryPath: string) {
  try {
    const databases = await prisma.blogDatabase.findMany({
      where: {
        category: categoryPath,
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

function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

function estimateDifficulty(content: string, tags: string[]): 'beginner' | 'intermediate' | 'advanced' {
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
}

export async function generateMetadata({ params }: CategoryPageProps) {
  const { slugPath } = await params;
  const parsed = await parseSlugPath(slugPath);

  if (parsed.type === 'invalid') {
    return { title: 'Not Found' };
  }

  if (parsed.type === 'post') {
    return {
      title: `${parsed.post.title} | func(sikk)`,
      description: parsed.post.description,
    };
  }

  const category = await getCategoryBySlugPathAsync(parsed.categorySlugPath);
  if (!category && parsed.type === 'category') {
    return { title: 'Category Not Found' };
  }

  if (parsed.type === 'category') {
    const fullPath = category!.path.join(' > ');
    return {
      title: `${fullPath} | func(sikk)`,
      description: `${fullPath} 카테고리의 포스트 목록`,
    };
  }

  // Database or database item
  const database = await prisma.blogDatabase.findUnique({
    where: { slug: parsed.dbSlug },
    select: { title: true, description: true, columns: true },
  });

  if (!database) {
    return { title: 'Not Found' };
  }

  if (parsed.type === 'database') {
    return {
      title: `${database.title} | ${category?.path.join(' > ') || 'Blog'} | func(sikk)`,
      description: database.description || '',
    };
  }

  // Database item
  const item = await prisma.blogDatabaseItem.findFirst({
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
    title: `${title} | ${database.title} | ${category?.path.join(' > ') || 'Blog'} | func(sikk)`,
  };
}

export async function generateStaticParams() {
  try {
    const categories = await getAllCategoriesHierarchicalAsync();
    const posts = await getAllPostsAsync();

    const categoryParams = categories
      .filter((category) => {
        if (!category.slugPath || !Array.isArray(category.slugPath)) return false;
        if (category.slugPath.length === 0) return false;
        return category.slugPath.every((segment) => typeof segment === 'string' && segment.length > 0);
      })
      .map((category) => ({
        slugPath: category.slugPath,
      }));

    // Add post routes
    const postParams = posts
      .filter((post) => post.categorySlugPath && post.categorySlugPath.length > 0)
      .map((post) => ({
        slugPath: [...post.categorySlugPath, post.slug],
      }));

    return [...categoryParams, ...postParams];
  } catch (error) {
    console.error('Error generating static params for blog categories:', error);
    return [];
  }
}

export default async function BlogCategoryPage({ params }: CategoryPageProps) {
  const session = await auth();
  const isAdmin = session?.user?.isAdmin || false;
  const { slugPath } = await params;
  const parsed = await parseSlugPath(slugPath);

  if (parsed.type === 'invalid') {
    notFound();
  }

  // Handle post page
  if (parsed.type === 'post') {
    const post = parsed.post;

    // Check if post is private
    const isPrivate = !post.isPublic;
    if (isPrivate && !isAdmin) {
      notFound();
    }

    const formattedDate = new Date(post.date).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const readingTime = calculateReadingTime(post.content);
    const [relatedPosts, { prevPost, nextPost }, categories, sections] = await Promise.all([
      getRelatedPostsAsync(post.slug, 3),
      getAdjacentPostsAsync(post.slug),
      getRootCategoriesAsync(),
      getSections(),
    ]);
    const difficulty = estimateDifficulty(post.content, post.tags);

    return (
      <>
        <ReadingProgressBar readingTime={readingTime} />
        <HighlightShare />
        <BlogPostLayout
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
                className="relative w-full h-48 sm:h-64 md:h-80 bg-gray-200 dark:bg-gray-700"
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
              <Link href="/blog" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
                Blog
              </Link>
              {post.categorySlugPath && post.categorySlugPath.map((slug, index) => (
                <span key={index} className="flex items-center">
                  <span className="mx-2">/</span>
                  <Link
                    href={`/blog/categories/${post.categorySlugPath.slice(0, index + 1).map(s => encodeURIComponent(s)).join('/')}`}
                    className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                  >
                    {post.categoryPath?.[index] || slug}
                  </Link>
                </span>
              ))}
            </div>

            <div className="flex items-center gap-3 mb-4">
              <DifficultyBadge level={difficulty} />
              {isPrivate && (
                <span className="px-3 py-1 text-xs font-semibold bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded-full border border-yellow-300 dark:border-yellow-700">
                  비공개 미리보기
                </span>
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
              <div className="flex flex-wrap gap-2 lg:hidden">
                {post.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/tags/${encodeURIComponent(tag)}`}
                    className="px-2 py-1 rounded transition-colors hover:scale-105"
                    style={{ backgroundColor: 'var(--tag-bg)', color: 'var(--tag-text)' }}
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            </div>
          </header>

          {/* Violet Divider */}
          <hr className="mb-8 border-t-2 border-violet-400 dark:border-violet-500" />

          {/* Content */}
          <BlogPostContent
            content={post.content}
            slug={post.slug}
            isAdmin={isAdmin}
            initialMetadata={{
              title: post.title,
              description: post.description || '',
              date: post.date,
              tags: post.tags,
              category: post.category || '',
              isPublic: post.isPublic,
              thumbnail: post.thumbnail,
              thumbnailPosition: post.thumbnailPosition,
              thumbnailScale: post.thumbnailScale,
            }}
          />

          {/* Violet Divider before comments */}
          <hr className="my-8 border-t-2 border-violet-400 dark:border-violet-500" />

          {/* Comments with Reactions */}
          <CommentSection
            postSlug={post.slug}
            reactionsContent={
              <div className="text-center">
                <p className="text-sm mb-4" style={{ color: 'var(--foreground-muted)' }}>
                  이 글이 마음에 드셨다면 반응이나 댓글을 남겨주세요!
                </p>
                <EmojiReactions postSlug={post.slug} />
              </div>
            }
          />

          {/* Share Buttons */}
          <div className="mt-8 flex items-center justify-center gap-3">
            <span className="text-xs" style={{ color: 'var(--foreground-muted)' }}>공유</span>
            <div className="h-px w-8" style={{ backgroundColor: 'var(--card-border)' }} />
            <SocialShareButtons title={post.title} />
          </div>

          {/* Post Navigation */}
          <PostNavigation prevPost={prevPost} nextPost={nextPost} />

          {/* Author Card */}
          <AuthorCard />

          {/* Footer */}
          <footer className="mt-12 pt-8 border-t" style={{ borderColor: 'var(--card-border)' }}>
            <Link
              href="/blog"
              className="inline-flex items-center text-violet-600 dark:text-violet-400 hover:underline"
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
              블로그 목록으로 돌아가기
            </Link>
          </footer>
        </BlogPostLayout>
        <FloatingActions />
        <KeyboardNavigation prevPost={prevPost} nextPost={nextPost} />
      </>
    );
  }

  // Get category for other route types
  const category = await getCategoryBySlugPathAsync(parsed.categorySlugPath);
  if (!category && parsed.type === 'category') {
    notFound();
  }

  // Handle database item page
  if (parsed.type === 'database-item') {
    const database = await prisma.blogDatabase.findUnique({
      where: { slug: parsed.dbSlug },
      select: { id: true, title: true, slug: true, columns: true, isPublic: true, category: true },
    });

    if (!database || (!database.isPublic && !isAdmin)) {
      notFound();
    }

    const item = await prisma.blogDatabaseItem.findFirst({
      where: { id: parsed.itemId, databaseId: database.id },
    });

    if (!item) {
      notFound();
    }

    const columns = database.columns as unknown as Column[];
    const titleColumn = columns.find((c) => c.type === 'title');
    const data = item.data as Record<string, unknown>;
    const title = titleColumn ? String(data[titleColumn.id] || '제목 없음') : '제목 없음';
    const databaseUrl = `/blog/categories/${parsed.categorySlugPath.map(s => encodeURIComponent(s)).join('/')}/db/${parsed.dbSlug}`;

    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="mb-8">
          <nav className="mb-4">
            <ol
              className="flex items-center gap-2 text-sm flex-wrap"
              style={{ color: 'var(--foreground)', opacity: 0.7 }}
            >
              <li>
                <Link href="/blog" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
                  Blog
                </Link>
              </li>
              {category && category.path.map((name, index) => (
                <li key={index} className="flex items-center gap-2">
                  <span className="mx-1">/</span>
                  <Link
                    href={`/blog/categories/${parsed.categorySlugPath.slice(0, index + 1).map(s => encodeURIComponent(s)).join('/')}`}
                    className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                  >
                    {name}
                  </Link>
                </li>
              ))}
              <li className="flex items-center gap-2">
                <span className="mx-1">/</span>
                <Link href={databaseUrl} className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
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
                        className="text-violet-600 dark:text-violet-400 hover:underline"
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

        <hr className="mb-8 border-t-2 border-violet-400 dark:border-violet-500" />

        <BlogDatabaseItemContent
          databaseId={database.id}
          itemId={item.id}
          content={item.content}
          isAdmin={isAdmin}
        />

        <footer className="mt-12 pt-8 border-t" style={{ borderColor: 'var(--card-border)' }}>
          <Link
            href={databaseUrl}
            className="inline-flex items-center text-violet-600 dark:text-violet-400 hover:underline"
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
    const database = await prisma.blogDatabase.findUnique({
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
                <Link href="/blog" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
                  Blog
                </Link>
              </li>
              {category && category.path.map((name, index) => (
                <li key={index} className="flex items-center gap-2">
                  <span className="mx-1">/</span>
                  <Link
                    href={`/blog/categories/${parsed.categorySlugPath.slice(0, index + 1).map(s => encodeURIComponent(s)).join('/')}`}
                    className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
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
                <span className="px-2 py-1 text-sm rounded bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400">
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
                href={`/admin/blog/databases/${database.id}`}
                className="flex-shrink-0 px-4 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600 transition-colors text-sm"
              >
                편집
              </Link>
            )}
          </div>
        </header>

        <BlogDatabaseTableView
          databaseId={database.id}
          databaseSlug={database.slug}
          columns={columns}
          items={items}
          isAdmin={isAdmin}
          categorySlugPath={parsed.categorySlugPath}
        />

        <footer className="mt-12 pt-8 border-t" style={{ borderColor: 'var(--card-border)' }}>
          <Link
            href={`/blog/categories/${parsed.categorySlugPath.map(s => encodeURIComponent(s)).join('/')}`}
            className="inline-flex items-center text-violet-600 dark:text-violet-400 hover:underline"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {category?.name || 'Blog'}(으)로 돌아가기
          </Link>
        </footer>
      </div>
    );
  }

  // Handle normal category page
  if (!category) {
    notFound();
  }

  const categoryPathString = category.path.join('/');

  const [childCategories, directPosts, allPosts, recentPosts, categories, tags, sections, databases] = await Promise.all([
    getChildCategoriesWithTagsAsync(parsed.categorySlugPath),
    getPostsByCategoryPathAsync(parsed.categorySlugPath, false),
    getPostsByCategoryPathAsync(parsed.categorySlugPath, true),
    getRecentPostsAsync(5),
    getRootCategoriesAsync(),
    getAllTagsAsync(),
    getSections(),
    getDatabasesByCategory(categoryPathString),
  ]);

  return (
    <CategoryPageContent
      category={{
        name: category.name,
        path: category.path,
        slugPath: category.slugPath,
      }}
      childCategories={childCategories}
      directPosts={directPosts}
      allPostsCount={allPosts.length}
      recentPosts={recentPosts}
      categories={categories}
      tags={tags}
      sections={sections}
      databases={databases}
    />
  );
}
