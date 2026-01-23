import { notFound } from 'next/navigation';
import Link from 'next/link';
import { unstable_noStore as noStore } from 'next/cache';
import { prisma } from '@/lib/db';
import { checkSikkCategoryAccessByToken } from '@/lib/sikk-access';
import { isValidTokenFormat } from '@/lib/token';

export const dynamic = 'force-dynamic';

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

interface SharedDatabasePageProps {
  params: Promise<{ token: string; dbSlug: string }>;
}

export async function generateMetadata({ params }: SharedDatabasePageProps) {
  const { token, dbSlug } = await params;

  if (!isValidTokenFormat(token)) {
    return {
      title: '데이터베이스를 찾을 수 없습니다',
      robots: { index: false },
    };
  }

  const accessResult = await checkSikkCategoryAccessByToken(token);

  if (!accessResult.canAccess || !accessResult.categorySlugPath) {
    return {
      title: '데이터베이스를 찾을 수 없습니다',
      robots: { index: false },
    };
  }

  const database = await prisma.sikkDatabase.findUnique({
    where: { slug: dbSlug },
    select: { title: true, description: true },
  });

  if (!database) {
    return {
      title: '데이터베이스를 찾을 수 없습니다',
      robots: { index: false },
    };
  }

  return {
    title: `${database.title} | ${accessResult.categoryName} | 공유된 카테고리`,
    description: database.description || '',
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

export default async function SharedDatabasePage({ params }: SharedDatabasePageProps) {
  const { token, dbSlug } = await params;

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
    include: {
      items: {
        orderBy: { order: 'asc' },
      },
    },
  });

  if (!database) {
    return <ErrorPage reason="not_found" />;
  }

  const columns = database.columns as unknown as Column[];
  const items = database.items as unknown as Item[];

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
            <span className="text-sm font-medium">공유된 데이터베이스</span>
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
              <span style={{ color: 'var(--foreground)' }}>{database.title}</span>
            </li>
          </ol>
        </nav>

        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <h1
              className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-rose-500 dark:from-pink-300 dark:to-rose-400"
            >
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
          <p className="mt-2 text-sm" style={{ color: 'var(--foreground-muted)' }}>
            {items.length}개의 항목
          </p>
        </header>

        {/* Table (Read-only) */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-pink-200 dark:border-pink-800/50">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column.id}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      {column.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {items.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      항목이 없습니다.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      {columns.map((column) => (
                        <td key={column.id} className="px-4 py-3">
                          <CellValue
                            column={column}
                            value={item.data[column.id]}
                            itemId={item.id}
                            token={token}
                            dbSlug={dbSlug}
                          />
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t" style={{ borderColor: 'var(--card-border)' }}>
          <Link
            href={`/sc/${token}`}
            className="inline-flex items-center text-pink-600 dark:text-pink-400 hover:underline"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {accessResult.categoryName}(으)로 돌아가기
          </Link>
        </footer>
      </div>
    </div>
  );
}

function CellValue({
  column,
  value,
  itemId,
  token,
  dbSlug,
}: {
  column: Column;
  value: unknown;
  itemId: string;
  token: string;
  dbSlug: string;
}) {
  if (column.type === 'files') {
    const files = Array.isArray(value) ? value : [];
    return (
      <div className="flex flex-wrap gap-1">
        {files.length === 0 ? (
          <span className="text-gray-400 dark:text-gray-500 text-sm">-</span>
        ) : (
          files.map((file: string, i: number) => (
            <a
              key={i}
              href={file}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded truncate max-w-[120px] hover:bg-gray-200 dark:hover:bg-gray-600"
              title={file}
            >
              {file.split('/').pop()}
            </a>
          ))
        )}
      </div>
    );
  }

  if (column.type === 'url') {
    const url = String(value || '');
    return url ? (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-pink-600 dark:text-pink-400 hover:underline text-sm truncate block max-w-[200px]"
        title={url}
      >
        {url}
      </a>
    ) : (
      <span className="text-gray-400 dark:text-gray-500 text-sm">-</span>
    );
  }

  if (column.type === 'select') {
    const selectValue = String(value || '');
    return selectValue ? (
      <span className="px-2 py-0.5 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded">
        {selectValue}
      </span>
    ) : (
      <span className="text-gray-400 dark:text-gray-500 text-sm">-</span>
    );
  }

  if (column.type === 'title') {
    return (
      <Link
        href={`/sc/${token}/db/${dbSlug}/${itemId}`}
        className="flex items-center gap-2 text-gray-900 dark:text-white font-medium hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
      >
        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span>{String(value || '제목 없음')}</span>
      </Link>
    );
  }

  if (column.type === 'date') {
    const dateValue = value ? String(value) : '';
    return dateValue ? (
      <span className="text-sm text-gray-900 dark:text-white">{dateValue}</span>
    ) : (
      <span className="text-gray-400 dark:text-gray-500 text-sm">-</span>
    );
  }

  return (
    <span className="text-sm text-gray-900 dark:text-white">
      {value ? String(value) : <span className="text-gray-400 dark:text-gray-500">-</span>}
    </span>
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
            : '데이터베이스를 찾을 수 없습니다'}
        </h1>
        <p className="mb-8" style={{ color: 'var(--foreground-muted)' }}>
          {reason === 'expired'
            ? '이 공유 링크의 유효 기간이 지났습니다. 공유자에게 새 링크를 요청해 주세요.'
            : '요청하신 데이터베이스가 존재하지 않거나 접근할 수 없습니다.'}
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
