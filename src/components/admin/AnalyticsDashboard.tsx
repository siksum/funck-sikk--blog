'use client';

import { useState, useEffect } from 'react';

interface DailyVisit {
  date: string;
  count: number;
}

interface TopPost {
  slug: string;
  count: number;
}

interface Stats {
  today: number;
  last30Days: DailyVisit[];
  topPosts: TopPost[];
  totalViews: number;
}

export default function AnalyticsDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/analytics/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-gray-500">통계를 불러오는 중...</div>;
  }

  if (!stats) {
    return <div className="text-red-500">통계를 불러올 수 없습니다.</div>;
  }

  const maxCount = Math.max(...stats.last30Days.map((d) => d.count), 1);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">오늘 방문자</p>
          <p className="text-3xl font-bold mt-2" style={{ color: 'var(--foreground)' }}>
            {stats.today}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">30일 총 방문</p>
          <p className="text-3xl font-bold mt-2" style={{ color: 'var(--foreground)' }}>
            {stats.last30Days.reduce((sum, d) => sum + d.count, 0)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">전체 페이지뷰</p>
          <p className="text-3xl font-bold mt-2" style={{ color: 'var(--foreground)' }}>
            {stats.totalViews}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
          최근 30일 방문자 추이
        </h3>
        <div className="h-48 flex items-end gap-1">
          {stats.last30Days.map((day, i) => {
            const height = (day.count / maxCount) * 100;
            const date = new Date(day.date);
            return (
              <div
                key={i}
                className="flex-1 group relative"
                title={`${date.toLocaleDateString('ko-KR')}: ${day.count}명`}
              >
                <div
                  className="bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                  style={{ height: `${Math.max(height, 2)}%` }}
                />
                <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-10">
                  {date.toLocaleDateString('ko-KR')}: {day.count}명
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Posts */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
          인기 포스트 (30일)
        </h3>
        {stats.topPosts.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">아직 데이터가 없습니다.</p>
        ) : (
          <ul className="space-y-3">
            {stats.topPosts.map((post, i) => (
              <li
                key={post.slug}
                className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
              >
                <span className="flex items-center gap-3">
                  <span className="text-sm text-gray-400">{i + 1}</span>
                  <a
                    href={`/blog/${post.slug}`}
                    target="_blank"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {post.slug}
                  </a>
                </span>
                <span className="text-sm text-gray-500">{post.count}회</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
