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

interface RecentVisitor {
  path: string;
  slug: string | null;
  referer: string;
  rawReferer: string | null;
  browser: string;
  device: string;
  createdAt: string;
}

interface RefererStat {
  source: string;
  count: number;
}

interface TopPage {
  path: string;
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
  recentVisitors: RecentVisitor[];
  referers: RefererStat[];
  topPages: TopPage[];
}

type ViewMode = 'daily' | 'weekly' | 'monthly';
type RangeOption = '7days' | '30days' | '90days' | '1year' | 'custom';

const ITEMS_PER_PAGE = {
  referers: 5,
  topPages: 5,
  topPosts: 5,
  recentVisitors: 10,
};

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  const [rangeOption, setRangeOption] = useState<RangeOption>('30days');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Pagination states
  const [refererPage, setRefererPage] = useState(1);
  const [topPagesPage, setTopPagesPage] = useState(1);
  const [topPostsPage, setTopPostsPage] = useState(1);
  const [visitorsPage, setVisitorsPage] = useState(1);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      if (rangeOption === 'custom' && customStart && customEnd) {
        params.set('start', customStart);
        params.set('end', customEnd);
      } else {
        params.set('range', rangeOption);
      }

      const res = await fetch(`/api/analytics/stats?${params.toString()}`);
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

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    return date.toLocaleDateString('ko-KR');
  };

  const getBrowserIcon = (browser: string) => {
    switch (browser) {
      case 'Chrome': return '🌐';
      case 'Safari': return '🧭';
      case 'Firefox': return '🦊';
      case 'Edge': return '🔷';
      default: return '��';
    }
  };

  const getDeviceIcon = (device: string) => {
    switch (device) {
      case 'Mobile': return '📱';
      case 'Tablet': return '📲';
      default: return '💻';
    }
  };

  const getRefererIcon = (source: string) => {
    switch (source) {
      case 'Google': return '🔍';
      case 'Naver': return '🇳';
      case 'Daum': return '🇩';
      case 'GitHub': return '🐙';
      case 'Twitter/X': return '🐦';
      case 'Facebook': return '📘';
      case 'LinkedIn': return '💼';
      case 'Direct': return '🔗';
      default: return '🌐';
    }
  };

  // Pagination helper
  const paginate = <T,>(items: T[], page: number, perPage: number) => {
    const start = (page - 1) * perPage;
    const end = start + perPage;
    return items.slice(start, end);
  };

  const getTotalPages = (totalItems: number, perPage: number) => {
    return Math.ceil(totalItems / perPage);
  };

  // Pagination component
  const Pagination = ({
    currentPage,
    totalPages,
    onPageChange,
  }: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  }) => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1 text-sm rounded-md bg-gray-100 dark:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-gray-900 dark:text-white"
        >
          이전
        </button>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {currentPage} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 text-sm rounded-md bg-gray-100 dark:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-gray-900 dark:text-white"
        >
          다음
        </button>
      </div>
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
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
            <p className="text-3xl font-bold mt-2 text-gray-900 dark:text-white">
              {loading ? '-' : stats?.today ?? 0}
            </p>
            {stats && getTrendIndicator(stats.today, stats.yesterday)}
          </div>
          <p className="text-xs text-gray-400 mt-1">어제: {stats?.yesterday ?? 0}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">이번 주</p>
          <p className="text-3xl font-bold mt-2 text-gray-900 dark:text-white">
            {loading ? '-' : stats?.thisWeek ?? 0}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">이번 달</p>
          <p className="text-3xl font-bold mt-2 text-gray-900 dark:text-white">
            {loading ? '-' : stats?.thisMonth ?? 0}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">전체 방문자</p>
          <p className="text-3xl font-bold mt-2 text-gray-900 dark:text-white">
            {loading ? '-' : stats?.totalViews?.toLocaleString() ?? 0}
          </p>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            방문자 추이
          </h2>

          <div className="flex flex-wrap gap-2">
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              {(['daily', 'weekly', 'monthly'] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1 text-sm rounded-md transition-colors text-gray-900 dark:text-white ${
                    viewMode === mode
                      ? 'bg-white dark:bg-gray-600 shadow-sm'
                      : 'hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {mode === 'daily' ? '일별' : mode === 'weekly' ? '주별' : '월별'}
                </button>
              ))}
            </div>

            {/* Range Selector */}
            <select
              value={rangeOption}
              onChange={(e) => setRangeOption(e.target.value as RangeOption)}
              className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
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
              className="px-3 py-1.5 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
            />
            <span className="text-gray-500">~</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-3 py-1.5 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
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

      {/* Two Column Layout for Referers and Top Pages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Referer Stats */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            유입 경로
            {stats?.referers && stats.referers.length > 0 && (
              <span className="text-sm font-normal text-gray-500 ml-2">({stats.referers.length}개)</span>
            )}
          </h2>
          {loading ? (
            <div className="text-center text-gray-500 py-8">로딩 중...</div>
          ) : stats?.referers && stats.referers.length > 0 ? (
            <>
              <div className="space-y-3">
                {paginate(stats.referers, refererPage, ITEMS_PER_PAGE.referers).map((ref, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{getRefererIcon(ref.source)}</span>
                      <span className="text-sm text-gray-900 dark:text-white">
                        {ref.source}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {ref.count}회
                    </span>
                  </div>
                ))}
              </div>
              <Pagination
                currentPage={refererPage}
                totalPages={getTotalPages(stats.referers.length, ITEMS_PER_PAGE.referers)}
                onPageChange={setRefererPage}
              />
            </>
          ) : (
            <div className="text-center text-gray-500 py-8">아직 데이터가 없습니다</div>
          )}
        </div>

        {/* Top Pages */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            인기 페이지
            {stats?.topPages && stats.topPages.length > 0 && (
              <span className="text-sm font-normal text-gray-500 ml-2">({stats.topPages.length}개)</span>
            )}
          </h2>
          {loading ? (
            <div className="text-center text-gray-500 py-8">로딩 중...</div>
          ) : stats?.topPages && stats.topPages.length > 0 ? (
            <>
              <div className="space-y-3">
                {paginate(stats.topPages, topPagesPage, ITEMS_PER_PAGE.topPages).map((page, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 flex items-center justify-center text-sm font-medium bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded">
                        {(topPagesPage - 1) * ITEMS_PER_PAGE.topPages + index + 1}
                      </span>
                      <span className="text-sm truncate max-w-[200px] text-gray-900 dark:text-white">
                        {page.path}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {page.count}회
                    </span>
                  </div>
                ))}
              </div>
              <Pagination
                currentPage={topPagesPage}
                totalPages={getTotalPages(stats.topPages.length, ITEMS_PER_PAGE.topPages)}
                onPageChange={setTopPagesPage}
              />
            </>
          ) : (
            <div className="text-center text-gray-500 py-8">아직 데이터가 없습니다</div>
          )}
        </div>
      </div>

      {/* Top Posts */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          인기 포스트
          {stats?.topPosts && stats.topPosts.length > 0 && (
            <span className="text-sm font-normal text-gray-500 ml-2">({stats.topPosts.length}개)</span>
          )}
        </h2>
        {loading ? (
          <div className="text-center text-gray-500 py-8">로딩 중...</div>
        ) : stats?.topPosts && stats.topPosts.length > 0 ? (
          <>
            <div className="space-y-3">
              {paginate(stats.topPosts, topPostsPage, ITEMS_PER_PAGE.topPosts).map((post, index) => (
                <div
                  key={post.slug}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 flex items-center justify-center text-sm font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded">
                      {(topPostsPage - 1) * ITEMS_PER_PAGE.topPosts + index + 1}
                    </span>
                    <Link
                      href={`/blog/${post.slug}`}
                      className="text-sm hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-gray-900 dark:text-white"
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
            <Pagination
              currentPage={topPostsPage}
              totalPages={getTotalPages(stats.topPosts.length, ITEMS_PER_PAGE.topPosts)}
              onPageChange={setTopPostsPage}
            />
          </>
        ) : (
          <div className="text-center text-gray-500 py-8">아직 데이터가 없습니다</div>
        )}
      </div>

      {/* Recent Visitors */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          최근 방문자
          {stats?.recentVisitors && stats.recentVisitors.length > 0 && (
            <span className="text-sm font-normal text-gray-500 ml-2">({stats.recentVisitors.length}개)</span>
          )}
        </h2>
        {loading ? (
          <div className="text-center text-gray-500 py-8">로딩 중...</div>
        ) : stats?.recentVisitors && stats.recentVisitors.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-2 font-medium text-gray-500 dark:text-gray-400">시간</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-500 dark:text-gray-400">페이지</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-500 dark:text-gray-400">유입</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-500 dark:text-gray-400">브라우저</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-500 dark:text-gray-400">기기</th>
                  </tr>
                </thead>
                <tbody>
                  {paginate(stats.recentVisitors, visitorsPage, ITEMS_PER_PAGE.recentVisitors).map((visitor, index) => (
                    <tr
                      key={index}
                      className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30"
                    >
                      <td className="py-3 px-2 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {formatTime(visitor.createdAt)}
                      </td>
                      <td className="py-3 px-2 text-gray-900 dark:text-white">
                        <span className="truncate max-w-[200px] block" title={visitor.path}>
                          {visitor.path}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <span
                          className="inline-flex items-center gap-1 text-gray-600 dark:text-gray-300"
                          title={visitor.rawReferer || 'Direct'}
                        >
                          {getRefererIcon(visitor.referer)} {visitor.referer}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <span className="inline-flex items-center gap-1 text-gray-600 dark:text-gray-300">
                          {getBrowserIcon(visitor.browser)} {visitor.browser}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <span className="inline-flex items-center gap-1 text-gray-600 dark:text-gray-300">
                          {getDeviceIcon(visitor.device)} {visitor.device}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={visitorsPage}
              totalPages={getTotalPages(stats.recentVisitors.length, ITEMS_PER_PAGE.recentVisitors)}
              onPageChange={setVisitorsPage}
            />
          </>
        ) : (
          <div className="text-center text-gray-500 py-8">아직 데이터가 없습니다</div>
        )}
      </div>
    </div>
  );
}
