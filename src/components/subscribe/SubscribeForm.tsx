'use client';

import { useState } from 'react';
import { useSession, signIn } from 'next-auth/react';

export default function SubscribeForm() {
  const { data: session, status: sessionStatus } = useSession();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubscribe = async () => {
    if (!session?.user?.email) return;

    setStatus('loading');

    try {
      const res = await fetch('/api/subscribe/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: session.user.email }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        setMessage(data.message || '확인 이메일을 전송했습니다.');
      } else {
        setStatus('error');
        setMessage(data.error || '구독 처리 중 오류가 발생했습니다.');
      }
    } catch {
      setStatus('error');
      setMessage('네트워크 오류가 발생했습니다.');
    }
  };

  return (
    <div
      className="rounded-2xl backdrop-blur-xl border p-5"
      style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
    >
      <h3 className="text-lg font-semibold mb-2 sidebar-title">
        새 포스트 알림 받기
      </h3>
      <p className="text-sm mb-4 sidebar-text-muted">
        새로운 포스트가 올라오면 알림을 받아보세요
      </p>

      {status === 'success' ? (
        <div className="flex items-center gap-2 text-green-600 dark:text-green-400 py-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-sm font-medium">{message}</span>
        </div>
      ) : sessionStatus === 'loading' ? (
        <div className="py-2 text-sm sidebar-text-muted">로딩 중...</div>
      ) : session?.user?.email ? (
        <div className="space-y-2">
          <p className="text-xs sidebar-text-muted truncate">{session.user.email}</p>
          <button
            onClick={handleSubscribe}
            disabled={status === 'loading'}
            className="w-full px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            {status === 'loading' ? '구독 중...' : '구독하기'}
          </button>
        </div>
      ) : (
        <button
          onClick={() => signIn()}
          className="w-full px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors text-sm font-medium"
        >
          로그인 후 구독하기
        </button>
      )}

      {status === 'error' && (
        <p className="text-sm mt-3 text-red-600">{message}</p>
      )}
    </div>
  );
}
