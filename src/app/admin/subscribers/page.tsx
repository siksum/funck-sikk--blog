'use client';

import { useState, useEffect } from 'react';

interface EmailSubscription {
  id: string;
  email: string;
  isVerified: boolean;
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
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailContent, setEmailContent] = useState('');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ sent: number; failed: number; total: number } | null>(null);

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

  const handleSendEmail = async () => {
    if (!emailSubject.trim() || !emailContent.trim()) {
      alert('제목과 내용을 입력해주세요.');
      return;
    }

    setSending(true);
    setSendResult(null);

    try {
      const res = await fetch('/api/admin/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: emailSubject,
          content: emailContent,
        }),
      });

      const result = await res.json();

      if (res.ok) {
        setSendResult({ sent: result.sent, failed: result.failed, total: result.total });
        fetchSubscribers(); // Refresh to update lastNotified
      } else {
        alert(result.error || '이메일 발송에 실패했습니다.');
      }
    } catch {
      alert('이메일 발송 중 오류가 발생했습니다.');
    } finally {
      setSending(false);
    }
  };

  const closeModal = () => {
    setShowEmailModal(false);
    setEmailSubject('');
    setEmailContent('');
    setSendResult(null);
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          구독자 관리
        </h1>
        {verifiedCount > 0 && (
          <button
            onClick={() => setShowEmailModal(true)}
            className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            이메일 보내기
          </button>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">이메일 구독자</p>
          <p className="text-3xl font-bold mt-2 text-gray-900 dark:text-white">
            {data.email.length}
          </p>
          <p className="text-xs text-gray-400 mt-1">전체 구독</p>
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
          <p className="text-xs text-gray-500 mt-1">
            푸시 알림은 로그인한 사용자만 구독할 수 있습니다.
          </p>
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

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  이메일 보내기
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                인증된 구독자 {verifiedCount}명에게 이메일을 보냅니다.
              </p>
            </div>

            {sendResult ? (
              <div className="p-6">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                    <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    이메일 발송 완료
                  </h3>
                  <p className="text-gray-500">
                    {sendResult.sent}명에게 성공적으로 발송되었습니다.
                    {sendResult.failed > 0 && ` (${sendResult.failed}건 실패)`}
                  </p>
                  <button
                    onClick={closeModal}
                    className="mt-6 px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
                  >
                    닫기
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    제목
                  </label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="이메일 제목을 입력하세요"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    내용
                  </label>
                  <textarea
                    value={emailContent}
                    onChange={(e) => setEmailContent(e.target.value)}
                    placeholder="이메일 내용을 입력하세요"
                    rows={10}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={closeModal}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSendEmail}
                    disabled={sending || !emailSubject.trim() || !emailContent.trim()}
                    className="flex-1 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {sending ? (
                      <>
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        발송 중...
                      </>
                    ) : (
                      '이메일 보내기'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
