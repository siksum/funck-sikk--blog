'use client';

import { useState } from 'react';

export default function SubscribeShortcut() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus('loading');

    try {
      const res = await fetch('/api/subscribe/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        setMessage(data.message || '구독해 주셔서 감사합니다!');
        setEmail('');
      } else {
        setStatus('error');
        setMessage(data.error || '오류가 발생했습니다.');
      }
    } catch {
      setStatus('error');
      setMessage('네트워크 오류가 발생했습니다.');
    }
  };

  return (
    <div
      className="relative rounded-2xl py-12 px-8 md:py-14 md:px-10 overflow-hidden transition-all duration-300
        backdrop-blur-xl
        border border-gray-200 dark:border-violet-500/60
        shadow-lg shadow-gray-200/50 dark:shadow-[0_0_25px_rgba(139,92,246,0.4),_inset_0_0_30px_rgba(139,92,246,0.05)]"
      style={{ background: 'var(--card-bg)' }}
    >
      {/* Subtle gradient overlay */}
      <div
        className="absolute inset-0 opacity-20 dark:opacity-30 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 80% 20%, var(--neon-purple-glow) 0%, transparent 50%), radial-gradient(ellipse at 20% 80%, var(--neon-pink-glow) 0%, transparent 50%)',
        }}
      />

      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-violet-300 dark:border-violet-400 rounded-tl-xl opacity-60 dark:opacity-80" />
      <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-pink-300 dark:border-pink-400 rounded-tr-xl opacity-60 dark:opacity-80" />
      <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-pink-300 dark:border-pink-400 rounded-bl-xl opacity-60 dark:opacity-80" />
      <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-violet-300 dark:border-violet-400 rounded-br-xl opacity-60 dark:opacity-80" />

      {/* Grid lines */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.05] dark:opacity-[0.08]"
        style={{
          backgroundImage: 'linear-gradient(var(--neon-purple) 1px, transparent 1px), linear-gradient(90deg, var(--neon-purple) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        {/* Content */}
        <div className="text-left flex-1">
          <h3 className="text-2xl md:text-3xl font-bold mb-3 flex items-center justify-start gap-3">
            {/* Icon */}
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center
                bg-violet-100 dark:bg-violet-500/25
                border border-violet-200 dark:border-violet-400/40"
              style={{ boxShadow: '0 0 15px var(--neon-purple-glow)' }}
            >
              <svg
                className="w-6 h-6 text-violet-600 dark:text-violet-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <span style={{ color: 'var(--foreground)' }}>
              Newsletter
            </span>
          </h3>
          <p className="text-base max-w-md" style={{ color: 'var(--foreground-muted)' }}>
            새로운 포스트가 올라오면 이메일로 알려드려요.
            <br />
            스팸 없이, 유익한 콘텐츠만 보내드립니다.
          </p>
        </div>

        {/* Subscribe Form */}
        <div className="w-full md:w-auto">
          {status === 'success' ? (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 py-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-medium">{message}</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 min-w-[240px] px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                style={{
                  background: 'var(--card-bg)',
                  borderColor: 'var(--card-border)',
                  color: 'var(--foreground)',
                }}
                disabled={status === 'loading'}
                required
              />
              <button
                type="submit"
                disabled={status === 'loading' || !email.trim()}
                className="px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-500 text-white rounded-xl text-sm font-medium hover:from-violet-700 hover:to-indigo-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {status === 'loading' ? '구독 중...' : '구독하기'}
              </button>
            </form>
          )}
          {status === 'error' && (
            <p className="text-sm text-red-500 mt-2">{message}</p>
          )}
        </div>
      </div>
    </div>
  );
}
