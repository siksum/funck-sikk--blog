import { notFound } from 'next/navigation';
import Link from 'next/link';
import { unstable_noStore as noStore } from 'next/cache';
import { prisma } from '@/lib/db';
import { checkSikkCategoryAccessByToken } from '@/lib/sikk-access';
import { isValidTokenFormat } from '@/lib/token';
import MDXContent from '@/components/mdx/MDXContent';

export const dynamic = 'force-dynamic';

interface Column {
  id: string;
  name: string;
  type: 'date' | 'title' | 'text' | 'files' | 'url' | 'select' | 'number';
  options?: string[];
}

interface SharedDatabaseItemPageProps {
  params: Promise<{ token: string; dbSlug: string; itemId: string }>;
}

export async function generateMetadata({ params }: SharedDatabaseItemPageProps) {
  const { token, dbSlug, itemId } = await params;

  if (!isValidTokenFormat(token)) {
    return {
      title: '항목을 찾을 수 없습니다',
      robots: { index: false },
    };
  }

  const accessResult = await checkSikkCategoryAccessByToken(token);

  if (!accessResult.canAccess || !accessResult.categorySlugPath) {
    return {
      title: '항목을 찾을 수 없습니다',
      robots: { index: false },
    };
  }

  const database = await prisma.sikkDatabase.findUnique({
    where: { slug: dbSlug },
    select: { id: true, title: true, columns: true },
  });

  if (!database) {
    return {
      title: '항목을 찾을 수 없습니다',
      robots: { index: false },
    };
  }

  const item = await prisma.sikkDatabaseItem.findFirst({
    where: { id: itemId, databaseId: database.id },
    select: { data: true },
  });

  if (!item) {
    return {
      title: '항목을 찾을 수 없습니다',
      robots: { index: false },
    };
  }

  const columns = database.columns as unknown as Column[];
  const titleColumn = columns.find((c) => c.type === 'title');
  const data = item.data as Record<string, unknown>;
  const title = titleColumn ? String(data[titleColumn.id] || '제목 없음') : '제목 없음';

  return {
    title: `${title} | ${database.title} | ${accessResult.categoryName} | 공유된 카테고리`,
    robots: { index: false },
  };
}

async function getCategoryPath(categorySlugPath: string[]): Promise<string | null> {
  let currentCategory = await prisma.sikkCategory.findFirst({
    where: { slug: categorySlugPath[0], parentId: null },
    select: { id: true, name: true },
  });

  for (let i = 1; i < categorySlugPath.length; i++) {
    if (!currentCategory) return null;
    currentCategory = await prisma.sikkCategory.findFirst({
      where: { slug: categorySlugPath[i], parentId: currentCategory.id },
      select: { id: true, name: true },
    });
  }

  if (!currentCategory) return null;

  // Build category path string (using names)
  const buildCategoryPath = async (categoryId: string): Promise<string> => {
    const parts: string[] = [];
    let id: string | null = categoryId;

    while (id) {
      const cat: { name: string; parentId: string | null } | null = await prisma.sikkCategory.findUnique({
        where: { id },
        select: { name: true, parentId: true },
      });
      if (!cat) break;
      parts.unshift(cat.name);
      id = cat.parentId;
    }

    return parts.join('/');
  };

  return buildCategoryPath(currentCategory.id);
}

export default async function SharedDatabaseItemPage({ params }: SharedDatabaseItemPageProps) {
  const { token, dbSlug, itemId } = await params;

  if (!isValidTokenFormat(token)) {
    return <ErrorPage reason="not_found" />;
  }

  const accessResult = await checkSikkCategoryAccessByToken(token);

  if (!accessResult.canAccess || !accessResult.categorySlugPath) {
    return <ErrorPage reason={accessResult.reason || 'not_found'} />;
  }

  // Get category path for database lookup
  const categoryPath = await getCategoryPath(accessResult.categorySlugPath);
  if (!categoryPath) {
    return <ErrorPage reason="not_found" />;
  }

  // Get database
  const database = await prisma.sikkDatabase.findFirst({
    where: {
      slug: dbSlug,
      category: categoryPath,
      isPublic: true,
    },
    select: {
      id: true,
      title: true,
      slug: true,
      columns: true,
    },
  });

  if (!database) {
    return <ErrorPage reason="not_found" />;
  }

  // Get item
  const item = await prisma.sikkDatabaseItem.findFirst({
    where: {
      id: itemId,
      databaseId: database.id,
    },
  });

  if (!item) {
    return <ErrorPage reason="not_found" />;
  }

  const columns = database.columns as unknown as Column[];
  const titleColumn = columns.find((c) => c.type === 'title');
  const data = item.data as Record<string, unknown>;
  const title = titleColumn ? String(data[titleColumn.id] || '제목 없음') : '제목 없음';

  // Get share settings for expiration warning
  const share = await prisma.sikkCategoryShare.findUnique({
    where: { publicToken: token },
  });

  // Check if expiring soon (within 7 days)
  const isExpiringSoon =
    share?.publicExpiresAt &&
    new Date(share.publicExpiresAt).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000;

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Shared Notice */}
        <div className="mb-8 p-4 rounded-xl bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-500/40">
          <div className="flex items-center gap-2 text-pink-700 dark:text-pink-300">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
            <span className="text-sm font-medium">공유된 항목</span>
          </div>
          {isExpiringSoon && share?.publicExpiresAt && (
            <p className="mt-2 text-xs text-pink-600 dark:text-pink-400">
              이 링크는{' '}
              {new Date(share.publicExpiresAt).toLocaleDateString('ko-KR', {
                month: 'long',
                day: 'numeric',
              })}
              에 만료됩니다.
            </p>
          )}
        </div>

        {/* Breadcrumb */}
        <nav className="mb-4">
          <ol
            className="flex items-center gap-2 text-sm flex-wrap"
            style={{ color: 'var(--foreground)', opacity: 0.7 }}
          >
            <li>
              <Link href={`/sc/${token}`} className="hover:text-pink-600 dark:hover:text-pink-400 transition-colors">
                {accessResult.categoryName}
              </Link>
            </li>
            <li className="flex items-center gap-2">
              <span className="mx-1">/</span>
              <Link
                href={`/sc/${token}/db/${dbSlug}`}
                className="hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
              >
                {database.title}
              </Link>
            </li>
          </ol>
        </nav>

        {/* Header */}
        <header className="mb-8">
          <h1
            className="text-3xl md:text-4xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-rose-500 dark:from-pink-300 dark:to-rose-400"
          >
            {title}
          </h1>

          {/* Item metadata */}
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
                    ) : column.type === 'select' ? (
                      <span className="px-2 py-0.5 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded">
                        {String(data[column.id])}
                      </span>
                    ) : (
                      String(data[column.id])
                    )}
                  </span>
                </div>
              ))}
          </div>
        </header>

        {/* Divider */}
        <hr className="mb-8 border-t-2 border-pink-400 dark:border-pink-500" />

        {/* Content (Read-only) */}
        {item.content ? (
          <MDXContent content={item.content} />
        ) : (
          <div className="text-center py-12 text-gray-400 dark:text-gray-500">
            <p>아직 내용이 없습니다.</p>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t" style={{ borderColor: 'var(--card-border)' }}>
          <Link
            href={`/sc/${token}/db/${dbSlug}`}
            className="inline-flex items-center text-pink-600 dark:text-pink-400 hover:underline"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {database.title}(으)로 돌아가기
          </Link>
        </footer>
      </div>
    </div>
  );
}

function ErrorPage({ reason }: { reason: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center py-12">
      <div className="max-w-md mx-auto px-4 text-center">
        <div className="mb-8">
          <svg
            className="w-24 h-24 mx-auto text-pink-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>
          {reason === 'expired'
            ? '공유 링크가 만료되었습니다'
            : '항목을 찾을 수 없습니다'}
        </h1>
        <p className="mb-8" style={{ color: 'var(--foreground-muted)' }}>
          {reason === 'expired'
            ? '이 공유 링크의 유효 기간이 지났습니다. 공유자에게 새 링크를 요청해 주세요.'
            : '요청하신 항목이 존재하지 않거나 접근할 수 없습니다.'}
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-pink-500 text-white hover:bg-pink-600 transition-colors"
        >
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
