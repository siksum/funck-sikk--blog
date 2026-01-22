import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { getSikkCategoryBySlugPathAsync } from '@/lib/sikk';
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
  params: Promise<{ slugPath: string[]; dbSlug: string }>;
}

export async function generateMetadata({ params }: DatabasePageProps) {
  const { slugPath, dbSlug } = await params;

  const category = await getSikkCategoryBySlugPathAsync(slugPath);
  const database = await prisma.sikkDatabase.findUnique({
    where: { slug: dbSlug },
    select: { title: true, description: true },
  });

  if (!database || !category) {
    return { title: 'Not Found' };
  }

  return {
    title: `${database.title} | ${category.path.join(' > ')} | func(sikk)`,
    description: database.description || '',
  };
}

export default async function CategoryDatabasePage({ params }: DatabasePageProps) {
  const { slugPath, dbSlug } = await params;

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
    include: {
      items: {
        orderBy: { order: 'asc' },
      },
    },
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

  const columns = database.columns as Column[];
  const items = database.items as unknown as Item[];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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

      {/* Table View */}
      <DatabaseTableView
        databaseId={database.id}
        databaseSlug={database.slug}
        columns={columns}
        items={items}
        isAdmin={isAdmin}
        categorySlugPath={slugPath}
      />

      {/* Footer */}
      <footer className="mt-12 pt-8 border-t" style={{ borderColor: 'var(--card-border)' }}>
        <Link
          href={`/sikk/category/${slugPath.map(s => encodeURIComponent(s)).join('/')}`}
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
          {category.name}(으)로 돌아가기
        </Link>
      </footer>
    </div>
  );
}
