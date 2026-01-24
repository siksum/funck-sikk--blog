'use client';

import { useState, useEffect } from 'react';

interface EmailSubscription {
  id: string;
  email: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  lastNotified: string | null;
}

interface PushSubscription {
  id: string;
  endpoint: string;
  userId: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  } | null;
}

interface SubscribersData {
  email: EmailSubscription[];
  push: PushSubscription[];
  pushCount: number;
}

export default function AdminSubscribersPage() {
  const [data, setData] = useState<SubscribersData | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

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

  const handleDelete = async (id: string, type: 'email' | 'push') => {
    if (!confirm(`이 ${type === 'email' ? '이메일' : '푸시'} 구독자를 삭제하시겠습니까?`)) {
      return;
    }

    setDeleting(id);
    try {
      const res = await fetch('/api/admin/subscribers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, type }),
      });

      if (res.ok) {
        fetchSubscribers();
      } else {
        alert('삭제에 실패했습니다.');
      }
    } catch {
      alert('삭제 중 오류가 발생했습니다.');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return <div className="text-gray-500">구독자 정보를 불러오는 중...</div>;
  }

  if (!data) {
    return <div className="text-red-500">구독자 정보를 불러올 수 없습니다.</div>;
  }

  const verifiedCount = data.email.filter((s) => s.isVerified).length;
  const activeEmailCount = data.email.filter((s) => s.isActive).length;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        구독자 관리
      </h1>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">이메일 구독자</p>
          <p className="text-3xl font-bold mt-2 text-gray-900 dark:text-white">
            {activeEmailCount}
          </p>
          <p className="text-xs text-gray-400 mt-1">활성 구독</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">인증 완료</p>
          <p className="text-3xl font-bold mt-2 text-green-600 dark:text-green-400">
            {verifiedCount}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">인증 대기</p>
          <p className="text-3xl font-bold mt-2 text-yellow-600 dark:text-yellow-400">
            {data.email.length - verifiedCount}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">푸시 구독자</p>
          <p className="text-3xl font-bold mt-2 text-violet-600 dark:text-violet-400">
            {data.pushCount}
          </p>
        </div>
      </div>

      {/* Email Subscribers List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
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
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {data.email.map((sub) => (
                  <tr key={sub.id}>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                      {sub.email}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            sub.isVerified
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          }`}
                        >
                          {sub.isVerified ? '인증됨' : '대기중'}
                        </span>
                        {!sub.isActive && (
                          <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                            비활성
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(sub.createdAt).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {sub.lastNotified
                        ? new Date(sub.lastNotified).toLocaleDateString('ko-KR')
                        : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDelete(sub.id, 'email')}
                        disabled={deleting === sub.id}
                        className="text-red-500 hover:text-red-700 text-sm disabled:opacity-50"
                      >
                        {deleting === sub.id ? '삭제중...' : '삭제'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Push Subscribers List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            푸시 알림 구독자 목록
          </h2>
        </div>
        {data.push.length === 0 ? (
          <p className="p-4 text-gray-500">아직 푸시 구독자가 없습니다.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300">
                    사용자
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300">
                    이메일
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300">
                    구독일
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300">
                    엔드포인트
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {data.push.map((sub) => (
                  <tr key={sub.id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {sub.user?.image ? (
                          <img
                            src={sub.user.image}
                            alt=""
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900 flex items-center justify-center">
                            <svg className="w-4 h-4 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                        )}
                        <span className="text-sm text-gray-900 dark:text-white">
                          {sub.user?.name || '알 수 없음'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {sub.user?.email || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(sub.createdAt).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400 max-w-[200px] truncate" title={sub.endpoint}>
                      {sub.endpoint.substring(0, 50)}...
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDelete(sub.id, 'push')}
                        disabled={deleting === sub.id}
                        className="text-red-500 hover:text-red-700 text-sm disabled:opacity-50"
                      >
                        {deleting === sub.id ? '삭제중...' : '삭제'}
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
