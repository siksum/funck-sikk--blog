'use client';

import { useState, useEffect } from 'react';

interface EmailSubscription {
  id: string;
  email: string;
  isVerified: boolean;
  createdAt: string;
  lastNotified: string | null;
}

interface SubscribersData {
  email: EmailSubscription[];
  pushCount: number;
}

export default function AdminSubscribersPage() {
  const [data, setData] = useState<SubscribersData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const fetchSubscribers = async () => {
    try {
      const res = await fetch('/api/admin/subscribers');
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (error) {
      console.error('Failed to fetch subscribers:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-gray-500">구독자 정보를 불러오는 중...</div>;
  }

  if (!data) {
    return <div className="text-red-500">구독자 정보를 불러올 수 없습니다.</div>;
  }

  const verifiedCount = data.email.filter((s) => s.isVerified).length;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--foreground)' }}>
        구독자 관리
      </h1>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">이메일 구독자</p>
          <p className="text-3xl font-bold mt-2" style={{ color: 'var(--foreground)' }}>
            {verifiedCount}
          </p>
          <p className="text-xs text-gray-400 mt-1">인증 완료</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">인증 대기</p>
          <p className="text-3xl font-bold mt-2" style={{ color: 'var(--foreground)' }}>
            {data.email.length - verifiedCount}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">푸시 구독자</p>
          <p className="text-3xl font-bold mt-2" style={{ color: 'var(--foreground)' }}>
            {data.pushCount}
          </p>
        </div>
      </div>

      {/* Email Subscribers List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
            이메일 구독자 목록
          </h2>
        </div>
        {data.email.length === 0 ? (
          <p className="p-4 text-gray-500">아직 구독자가 없습니다.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300">
                    이메일
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300">
                    상태
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300">
                    구독일
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300">
                    마지막 알림
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {data.email.map((sub) => (
                  <tr key={sub.id}>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--foreground)' }}>
                      {sub.email}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          sub.isVerified
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        }`}
                      >
                        {sub.isVerified ? '인증됨' : '대기중'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(sub.createdAt).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {sub.lastNotified
                        ? new Date(sub.lastNotified).toLocaleDateString('ko-KR')
                        : '-'}
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
