'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import PostEditor from '@/components/admin/PostEditor';

interface EditPostPageProps {
  params: Promise<{ slug: string }>;
}

export default function EditPostPage({ params }: EditPostPageProps) {
  const { slug } = use(params);
  const [post, setPost] = useState<{
    slug: string;
    title: string;
    description: string;
    category: string;
    tags: string[];
    content: string;
    date: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await fetch(`/api/posts/${slug}`);
        if (response.ok) {
          const data = await response.json();
          setPost(data);
        } else {
          setError('포스트를 찾을 수 없습니다.');
        }
      } catch (err) {
        setError('포스트를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <p className="text-center text-gray-600 dark:text-gray-400">로딩 중...</p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <p className="text-center text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/admin"
          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          ← 목록으로
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          포스트 수정
        </h1>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <PostEditor initialData={post} isEdit />
      </div>
    </div>
  );
}
