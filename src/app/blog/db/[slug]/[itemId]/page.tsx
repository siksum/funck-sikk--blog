import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import BlogDatabaseItemView from '@/components/blog/BlogDatabaseItemView';

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

  const database = await prisma.blogDatabase.findUnique({
    where: { slug },
    select: { title: true, columns: true },
  });

  if (!database) {
    return { title: 'Not Found' };
  }

  const item = await prisma.blogDatabaseItem.findFirst({
    where: { id: itemId, database: { slug } },
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
    title: `${title} | ${database.title} | Blog`,
  };
}

export default async function DatabaseItemPage({ params }: DatabaseItemPageProps) {
  const { slug, itemId } = await params;

  const database = await prisma.blogDatabase.findUnique({
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

  const item = await prisma.blogDatabaseItem.findFirst({
    where: { id: itemId, databaseId: database.id },
  });

  if (!item) {
    notFound();
  }

  const columns = database.columns as unknown as Column[];
  const data = item.data as Record<string, unknown>;

  return (
    <BlogDatabaseItemView
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
