import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import DatabaseTableView from '@/components/sikk/DatabaseTableView';

export const revalidate = 10;

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

interface DatabasePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: DatabasePageProps) {
  const { slug } = await params;
  const database = await prisma.sikkDatabase.findUnique({
    where: { slug },
    select: { title: true, description: true },
  });

  if (!database) {
    return { title: 'Not Found' };
  }

  return {
    title: `${database.title} | func(sikk)`,
    description: database.description || '',
  };
}

export default async function DatabasePage({ params }: DatabasePageProps) {
  const { slug } = await params;

  const database = await prisma.sikkDatabase.findUnique({
    where: { slug },
    include: {
      items: {
        orderBy: { order: 'asc' },
      },
    },
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

  const columns = database.columns as Column[];
  const items = database.items as unknown as Item[];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center text-sm mb-4" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
          <Link href="/sikk" className="hover:text-pink-600 dark:hover:text-pink-400 transition-colors">
            Sikk
          </Link>
          <span className="mx-2">/</span>
          <span>데이터베이스</span>
        </div>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>
              {database.title}
            </h1>
            {database.description && (
              <p className="text-lg" style={{ color: 'var(--foreground)', opacity: 0.8 }}>
                {database.description}
              </p>
            )}
          </div>

          {isAdmin && (
            <Link
              href={`/admin/sikk/databases/${database.id}`}
              className="flex-shrink-0 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors text-sm"
            >
              편집
            </Link>
          )}
        </div>
      </header>

      {/* Table View */}
      <DatabaseTableView
        databaseId={database.id}
        databaseSlug={database.slug}
        columns={columns}
        items={items}
        isAdmin={isAdmin}
      />

      {/* Footer */}
      <footer className="mt-12 pt-8 border-t" style={{ borderColor: 'var(--card-border)' }}>
        <Link
          href="/sikk"
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
          Sikk 목록으로 돌아가기
        </Link>
      </footer>
    </div>
  );
}
