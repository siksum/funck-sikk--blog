'use client';

import { useState } from 'react';

export default function NewsletterCTA() {
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
    <div
      className="rounded-xl border p-6 my-8"
      style={{
        background: 'var(--card-bg)',
        borderColor: 'var(--card-border)'
      }}
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--foreground)' }}>
            뉴스레터 구독하기
          </h3>
          <p className="text-sm mb-4" style={{ color: 'var(--foreground-muted)' }}>
            새로운 포스트가 올라오면 이메일로 알려드려요!
          </p>

          {status === 'success' ? (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm font-medium">구독해 주셔서 감사합니다!</span>
            </div>
          ) : status === 'error' ? (
            <div>
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium">{errorMessage}</span>
              </div>
              <button
                onClick={() => setStatus('idle')}
                className="text-sm text-violet-600 dark:text-violet-400 hover:underline"
              >
                다시 시도
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 px-4 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                style={{
                  background: 'var(--card-bg)',
                  borderColor: 'var(--card-border)',
                  color: 'var(--foreground)',
                }}
                required
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-500 text-white rounded-lg text-sm font-medium hover:from-violet-700 hover:to-indigo-600 transition-all disabled:opacity-50"
              >
                {status === 'loading' ? '...' : '구독'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
