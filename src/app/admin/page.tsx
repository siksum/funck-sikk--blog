'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Post {
  slug: string;
  title: string;
  description: string;
  date: string;
  category: string;
  tags: string[];
}

interface Stats {
  today: number;
  totalViews: number;
}

export default function AdminPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifySlug, setNotifySlug] = useState<string | null>(null);
  const [notifyStatus, setNotifyStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const fetchData = async () => {
    try {
      const [postsRes, statsRes] = await Promise.all([
        fetch('/api/posts'),
        fetch('/api/analytics/stats'),
      ]);

      const postsData = await postsRes.json();
      setPosts(postsData);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (slug: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/posts/${slug}`, { method: 'DELETE' });
      if (response.ok) {
        setPosts(posts.filter((p) => p.slug !== slug));
      }
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
  };

  const handleNotify = async (post: Post) => {
    setNotifySlug(post.slug);
    setNotifyStatus('sending');

    try {
      const res = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: post.title,
          slug: post.slug,
          description: post.description,
        }),
      });

      if (res.ok) {
        setNotifyStatus('success');
      } else {
        setNotifyStatus('error');
      }
    } catch {
      setNotifyStatus('error');
    }

    setTimeout(() => {
      setNotifySlug(null);
      setNotifyStatus('idle');
    }, 3000);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
          대시보드
        </h1>
        <Link
          href="/admin/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          새 포스트 작성
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">전체 포스트</p>
          <p className="text-3xl font-bold mt-2" style={{ color: 'var(--foreground)' }}>
            {posts.length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">오늘 방문자</p>
          <p className="text-3xl font-bold mt-2" style={{ color: 'var(--foreground)' }}>
            {stats?.today ?? '-'}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">전체 페이지뷰</p>
          <p className="text-3xl font-bold mt-2" style={{ color: 'var(--foreground)' }}>
            {stats?.totalViews ?? '-'}
          </p>
        </div>
      </div>

      {/* Posts Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
            포스트 관리
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">로딩 중...</div>
        ) : posts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">포스트가 없습니다.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    제목
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    카테고리
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    날짜
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {posts.map((post) => (
                  <tr key={post.slug}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                        {post.title}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {post.slug}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded">
                        {post.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {post.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <Link
                        href={`/blog/${post.slug}`}
                        className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                      >
                        보기
                      </Link>
                      <Link
                        href={`/admin/edit/${post.slug}`}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        수정
                      </Link>
                      <button
                        onClick={() => handleNotify(post)}
                        disabled={notifySlug === post.slug}
                        className={`${
                          notifySlug === post.slug
                            ? notifyStatus === 'success'
                              ? 'text-green-600'
                              : notifyStatus === 'error'
                              ? 'text-red-600'
                              : 'text-gray-400'
                            : 'text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300'
                        }`}
                      >
                        {notifySlug === post.slug
                          ? notifyStatus === 'sending'
                            ? '전송중...'
                            : notifyStatus === 'success'
                            ? '완료!'
                            : notifyStatus === 'error'
                            ? '실패'
                            : '알림'
                          : '알림'}
                      </button>
                      <button
                        onClick={() => handleDelete(post.slug)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
