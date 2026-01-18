'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AnalyticsChart from '@/components/admin/AnalyticsChart';

interface DataPoint {
  date: string;
  count: number;
}

interface TopPost {
  slug: string;
  count: number;
}

interface Stats {
  today: number;
  yesterday: number;
  thisWeek: number;
  thisMonth: number;
  totalViews: number;
  daily: DataPoint[];
  weekly: DataPoint[];
  monthly: DataPoint[];
  topPosts: TopPost[];
}

type ViewMode = 'daily' | 'weekly' | 'monthly';
type RangeOption = '7days' | '30days' | '90days' | '1year' | 'custom';

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  const [rangeOption, setRangeOption] = useState<RangeOption>('30days');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const fetchStats = async () => {
    setLoading(true);
    try {
      let url = '/api/analytics/stats';
      const params = new URLSearchParams();

      if (rangeOption === 'custom' && customStart && customEnd) {
        params.set('start', customStart);
        params.set('end', customEnd);
      } else {
        params.set('range', rangeOption);
      }

      const res = await fetch(`${url}?${params.toString()}`);
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

  useEffect(() => {
    fetchStats();
  }, [rangeOption]);

  const handleCustomRangeApply = () => {
    if (customStart && customEnd) {
      fetchStats();
    }
  };

  const getChartData = () => {
    if (!stats) return [];
    switch (viewMode) {
      case 'daily':
        return stats.daily;
      case 'weekly':
        return stats.weekly;
      case 'monthly':
        return stats.monthly;
      default:
        return stats.daily;
    }
  };

  const getTrendIndicator = (current: number, previous: number) => {
    if (previous === 0) return null;
    const diff = current - previous;
    const percent = Math.round((diff / previous) * 100);
    if (diff > 0) {
      return <span className="text-green-500 text-sm ml-2">+{percent}%</span>;
    } else if (diff < 0) {
      return <span className="text-red-500 text-sm ml-2">{percent}%</span>;
    }
    return null;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
          대시보드
        </h1>
        <Link
          href="/admin/posts"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          포스트 관리
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">오늘 방문자</p>
          <div className="flex items-baseline">
            <p className="text-3xl font-bold mt-2" style={{ color: 'var(--foreground)' }}>
              {loading ? '-' : stats?.today ?? 0}
            </p>
            {stats && getTrendIndicator(stats.today, stats.yesterday)}
          </div>
          <p className="text-xs text-gray-400 mt-1">어제: {stats?.yesterday ?? 0}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">이번 주</p>
          <p className="text-3xl font-bold mt-2" style={{ color: 'var(--foreground)' }}>
            {loading ? '-' : stats?.thisWeek ?? 0}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">이번 달</p>
          <p className="text-3xl font-bold mt-2" style={{ color: 'var(--foreground)' }}>
            {loading ? '-' : stats?.thisMonth ?? 0}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">전체 페이지뷰</p>
          <p className="text-3xl font-bold mt-2" style={{ color: 'var(--foreground)' }}>
            {loading ? '-' : stats?.totalViews?.toLocaleString() ?? 0}
          </p>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
            방문자 추이
          </h2>

          <div className="flex flex-wrap gap-2">
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              {(['daily', 'weekly', 'monthly'] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    viewMode === mode
                      ? 'bg-white dark:bg-gray-600 shadow-sm'
                      : 'hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                  style={{ color: 'var(--foreground)' }}
                >
                  {mode === 'daily' ? '일별' : mode === 'weekly' ? '주별' : '월별'}
                </button>
              ))}
            </div>

            {/* Range Selector */}
            <select
              value={rangeOption}
              onChange={(e) => setRangeOption(e.target.value as RangeOption)}
              className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ color: 'var(--foreground)' }}
            >
              <option value="7days">최근 7일</option>
              <option value="30days">최근 30일</option>
              <option value="90days">최근 90일</option>
              <option value="1year">최근 1년</option>
              <option value="custom">기간 선택</option>
            </select>
          </div>
        </div>

        {/* Custom Date Range */}
        {rangeOption === 'custom' && (
          <div className="flex flex-wrap items-center gap-2 mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-3 py-1.5 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg"
              style={{ color: 'var(--foreground)' }}
            />
            <span className="text-gray-500">~</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-3 py-1.5 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg"
              style={{ color: 'var(--foreground)' }}
            />
            <button
              onClick={handleCustomRangeApply}
              className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              적용
            </button>
          </div>
        )}

        {/* Chart */}
        {loading ? (
          <div className="h-64 flex items-center justify-center text-gray-500">
            로딩 중...
          </div>
        ) : (
          <AnalyticsChart data={getChartData()} viewMode={viewMode} />
        )}
      </div>

      {/* Top Posts */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
          인기 포스트
        </h2>
        {loading ? (
          <div className="text-center text-gray-500 py-8">로딩 중...</div>
        ) : stats?.topPosts && stats.topPosts.length > 0 ? (
          <div className="space-y-3">
            {stats.topPosts.map((post, index) => (
              <div
                key={post.slug}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 flex items-center justify-center text-sm font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded">
                    {index + 1}
                  </span>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="text-sm hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    style={{ color: 'var(--foreground)' }}
                  >
                    {post.slug}
                  </Link>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {post.count}회
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">아직 데이터가 없습니다</div>
        )}
      </div>
    </div>
  );
}
