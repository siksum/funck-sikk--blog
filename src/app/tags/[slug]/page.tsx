import { notFound } from 'next/navigation';
import PostList from '@/components/post/PostList';
import { getPostsByTag, getAllTags } from '@/lib/posts';

interface TagPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: TagPageProps) {
  const { slug } = await params;
  const tagName = decodeURIComponent(slug);

  return {
    title: `#${tagName} | func(sikk)`,
    description: `${tagName} 태그가 포함된 포스트 목록`,
  };
}

export async function generateStaticParams() {
  const tags = getAllTags();

  return tags.map((tag) => ({
    slug: encodeURIComponent(tag.name),
  }));
}

export default async function TagPage({ params }: TagPageProps) {
  const { slug } = await params;
  const tagName = decodeURIComponent(slug);
  const posts = getPostsByTag(tagName);

  if (posts.length === 0) {
    notFound();
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <a
          href="/tags"
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline mb-2 inline-block"
        >
          ← 태그 목록
        </a>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          #{tagName}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          {posts.length}개의 포스트
        </p>
      </div>

      <PostList posts={posts} />
    </div>
  );
}
