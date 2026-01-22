import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { getSikkCategoryBySlugPathAsync } from '@/lib/sikk';
import DatabaseItemContent from '@/components/sikk/DatabaseItemContent';

export const revalidate = 10;

interface Column {
  id: string;
  name: string;
  type: string;
  options?: string[];
}

interface DatabaseItemPageProps {
  params: Promise<{ slugPath: string[]; dbSlug: string; itemId: string }>;
}

export async function generateMetadata({ params }: DatabaseItemPageProps) {
  const { slugPath, dbSlug, itemId } = await params;

  const category = await getSikkCategoryBySlugPathAsync(slugPath);
  const database = await prisma.sikkDatabase.findUnique({
    where: { slug: dbSlug },
    select: { title: true, columns: true },
  });

  if (!database || !category) {
    return { title: 'Not Found' };
  }

  const item = await prisma.sikkDatabaseItem.findFirst({
    where: { id: itemId, database: { slug: dbSlug } },
    select: { data: true },
  });

  if (!item) {
    return { title: 'Not Found' };
  }

  const columns = database.columns as Column[];
  const titleColumn = columns.find((c) => c.type === 'title');
  const data = item.data as Record<string, unknown>;
  const title = titleColumn ? String(data[titleColumn.id] || '제목 없음') : '제목 없음';

  return {
    title: `${title} | ${database.title} | ${category.path.join(' > ')} | func(sikk)`,
  };
}

export default async function CategoryDatabaseItemPage({ params }: DatabaseItemPageProps) {
  const { slugPath, dbSlug, itemId } = await params;

  // Check admin access - Sikk is admin-only
  const session = await auth();
  if (!session?.user?.isAdmin) {
    redirect('/');
  }

  const isAdmin = session?.user?.isAdmin || false;

  // Get category info for breadcrumb
  const category = await getSikkCategoryBySlugPathAsync(slugPath);
  if (!category) {
    notFound();
  }

  const database = await prisma.sikkDatabase.findUnique({
    where: { slug: dbSlug },
    select: { id: true, title: true, slug: true, columns: true, isPublic: true, category: true },
  });

  if (!database) {
    notFound();
  }

  // If database is private and user is not admin, show 404
  if (!database.isPublic && !isAdmin) {
    notFound();
  }

  // Verify database belongs to this category
  const expectedCategoryPath = category.path.join('/');
  if (database.category !== expectedCategoryPath) {
    notFound();
  }

  const item = await prisma.sikkDatabaseItem.findFirst({
    where: { id: itemId, databaseId: database.id },
  });

  if (!item) {
    notFound();
  }

  const columns = database.columns as Column[];
  const titleColumn = columns.find((c) => c.type === 'title');
  const data = item.data as Record<string, unknown>;
  const title = titleColumn ? String(data[titleColumn.id] || '제목 없음') : '제목 없음';

  // Build database URL with category path
  const databaseUrl = `/sikk/category/${slugPath.map(s => encodeURIComponent(s)).join('/')}/db/${dbSlug}`;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <header className="mb-8">
        {/* Breadcrumb */}
        <nav className="mb-4">
          <ol
            className="flex items-center gap-2 text-sm flex-wrap"
            style={{ color: 'var(--foreground)', opacity: 0.7 }}
          >
            <li>
              <Link
                href="/sikk"
                className="hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
              >
                Sikk
              </Link>
            </li>
            {category.path.map((name, index) => (
              <li key={index} className="flex items-center gap-2">
                <span className="mx-1">/</span>
                <Link
                  href={`/sikk/category/${slugPath.slice(0, index + 1).map(s => encodeURIComponent(s)).join('/')}`}
                  className="hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
                >
                  {name}
                </Link>
              </li>
            ))}
            <li className="flex items-center gap-2">
              <span className="mx-1">/</span>
              <Link
                href={databaseUrl}
                className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
              >
                {database.title}
              </Link>
            </li>
          </ol>
        </nav>

        <h1 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>
          {title}
        </h1>

        {/* Metadata Display */}
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

      {/* Purple Divider for database items */}
      <hr className="mb-8 border-t-2 border-purple-400 dark:border-purple-500" />

      {/* Content */}
      <DatabaseItemContent
        databaseId={database.id}
        itemId={item.id}
        content={item.content}
        isAdmin={isAdmin}
      />

      {/* Footer */}
      <footer className="mt-12 pt-8 border-t" style={{ borderColor: 'var(--card-border)' }}>
        <Link
          href={databaseUrl}
          className="inline-flex items-center text-purple-600 dark:text-purple-400 hover:underline"
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
          {database.title}(으)로 돌아가기
        </Link>
      </footer>
    </div>
  );
}
