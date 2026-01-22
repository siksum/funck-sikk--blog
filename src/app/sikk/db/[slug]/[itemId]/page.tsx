import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import DatabaseItemContent from '@/components/sikk/DatabaseItemContent';

export const revalidate = 10;

interface Column {
  id: string;
  name: string;
  type: string;
  options?: string[];
}

interface DatabaseItemPageProps {
  params: Promise<{ slug: string; itemId: string }>;
}

export async function generateMetadata({ params }: DatabaseItemPageProps) {
  const { slug, itemId } = await params;

  const database = await prisma.sikkDatabase.findUnique({
    where: { slug },
    select: { title: true, columns: true },
  });

  if (!database) {
    return { title: 'Not Found' };
  }

  const item = await prisma.sikkDatabaseItem.findFirst({
    where: { id: itemId, database: { slug } },
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
    title: `${title} | ${database.title} | func(sikk)`,
  };
}

export default async function DatabaseItemPage({ params }: DatabaseItemPageProps) {
  const { slug, itemId } = await params;

  const database = await prisma.sikkDatabase.findUnique({
    where: { slug },
    select: { id: true, title: true, slug: true, columns: true, isPublic: true },
  });

  if (!database) {
    notFound();
  }

  const session = await auth();
  const isAdmin = session?.user?.isAdmin || false;

  // If database is private and user is not admin, show 404
  if (!database.isPublic && !isAdmin) {
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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center text-sm mb-4" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
          <Link href="/sikk" className="hover:text-pink-600 dark:hover:text-pink-400 transition-colors">
            Sikk
          </Link>
          <span className="mx-2">/</span>
          <Link
            href={`/sikk/db/${database.slug}`}
            className="hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
          >
            {database.title}
          </Link>
        </div>

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

      {/* Pink Divider */}
      <hr className="mb-8 border-t-2 border-pink-400 dark:border-pink-500" />

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
          href={`/sikk/db/${database.slug}`}
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
          {database.title}(으)로 돌아가기
        </Link>
      </footer>
    </div>
  );
}
