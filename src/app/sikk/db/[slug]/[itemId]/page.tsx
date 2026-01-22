import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import DatabaseItemView from '@/components/sikk/DatabaseItemView';

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

  // Safely parse columns
  let columns: Column[] = [];
  try {
    const rawColumns = database.columns;
    if (Array.isArray(rawColumns)) {
      columns = rawColumns as Column[];
    } else if (typeof rawColumns === 'string') {
      columns = JSON.parse(rawColumns) as Column[];
    }
  } catch (e) {
    console.error('Failed to parse columns in metadata:', e);
  }

  const titleColumn = columns.find((c) => c.type === 'title');
  const data = (item.data || {}) as Record<string, unknown>;
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

  // Safely parse columns
  let columns: Column[] = [];
  try {
    const rawColumns = database.columns;
    if (Array.isArray(rawColumns)) {
      columns = rawColumns as Column[];
    } else if (typeof rawColumns === 'string') {
      columns = JSON.parse(rawColumns) as Column[];
    }
  } catch (e) {
    console.error('Failed to parse columns:', e);
  }

  const data = (item.data || {}) as Record<string, unknown>;

  return (
    <DatabaseItemView
      databaseId={database.id}
      databaseSlug={database.slug}
      databaseTitle={database.title}
      itemId={item.id}
      columns={columns}
      data={data}
      content={item.content}
      isAdmin={isAdmin}
    />
  );
}
