'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function SubscribePage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    setErrorMessage('');

    try {
      const res = await fetch('/api/subscribe/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        setEmail('');
      } else {
        setStatus('error');
        setErrorMessage(data.error || '구독 처리 중 오류가 발생했습니다.');
      }
    } catch {
      setStatus('error');
      setErrorMessage('네트워크 오류가 발생했습니다.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4">
      <div className="max-w-lg w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-3" style={{ color: 'var(--foreground)' }}>
            뉴스레터 구독
          </h1>
          <p className="text-lg" style={{ color: 'var(--foreground-muted)' }}>
            새로운 포스트가 올라오면 이메일로 알려드려요!
          </p>
        </div>

        {/* Subscription Form */}
        <div
          className="rounded-2xl border p-8"
          style={{
            background: 'var(--card-bg)',
            borderColor: 'var(--card-border)',
          }}
        >
          {status === 'success' ? (
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 mb-4">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                구독이 완료되었습니다!
              </h2>
              <p className="mb-6" style={{ color: 'var(--foreground-muted)' }}>
                새로운 포스트가 올라오면 이메일로 알려드릴게요.
              </p>
              <Link
                href="/blog"
                className="inline-flex items-center px-6 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
              >
                블로그 둘러보기
              </Link>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                    이메일 주소
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 rounded-lg border text-base focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    style={{
                      background: 'var(--background)',
                      borderColor: 'var(--card-border)',
                      color: 'var(--foreground)',
                    }}
                    required
                  />
                </div>

                {status === 'error' && (
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{errorMessage}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-500 text-white rounded-lg font-medium hover:from-violet-700 hover:to-indigo-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {status === 'loading' ? '구독 중...' : '구독하기'}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t" style={{ borderColor: 'var(--card-border)' }}>
                <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--foreground)' }}>
                  구독하시면 다음 내용을 받아보실 수 있어요:
                </h3>
                <ul className="space-y-2 text-sm" style={{ color: 'var(--foreground-muted)' }}>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    새로운 블로그 포스트 알림
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    개발 및 보안 관련 팁
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    스팸 없이 유용한 콘텐츠만 전달
                  </li>
                </ul>
              </div>
            </>
          )}
        </div>

        {/* Back link */}
        <div className="text-center mt-6">
          <Link
            href="/blog"
            className="text-sm hover:underline"
            style={{ color: 'var(--foreground-muted)' }}
          >
            블로그로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
