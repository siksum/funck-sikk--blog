import { getSikkPostBySlug } from '@/lib/sikk';
import { notFound } from 'next/navigation';
import SikkPostEditor from '@/components/admin/SikkPostEditor';
import Link from 'next/link';

interface EditSikkPostPageProps {
  params: Promise<{ slug: string }>;
}

export default async function EditSikkPostPage({ params }: EditSikkPostPageProps) {
  const { slug } = await params;
  const post = getSikkPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/admin/sikk"
          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          ← 목록으로
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Sikk 포스트 수정
        </h1>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <SikkPostEditor
          initialData={{
            slug: post.slug,
            title: post.title,
            description: post.description,
            category: post.category,
            tags: post.tags,
            content: post.content,
            date: post.date,
            isPublic: post.isPublic,
          }}
          isEdit
        />
      </div>
    </div>
  );
}
