'use client';

import { useState } from 'react';
import PushToggle from './PushToggle';

export default function SubscribeForm() {
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
        setMessage(data.message || '확인 이메일을 전송했습니다.');
        setEmail('');
      } else {
        setStatus('error');
        setMessage(data.error || '구독 처리 중 오류가 발생했습니다.');
      }
    } catch (error) {
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

      <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="이메일 주소"
          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
          style={{
            background: 'var(--card-bg)',
            borderColor: 'var(--card-border)',
            color: 'var(--foreground)',
          }}
          disabled={status === 'loading'}
        />
        <button
          type="submit"
          disabled={status === 'loading' || !email.trim()}
          className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {status === 'loading' ? '...' : '구독'}
        </button>
      </form>

      {status !== 'idle' && (
        <p
          className={`text-sm ${status === 'success' ? 'text-green-600' : status === 'error' ? 'text-red-600' : ''}`}
        >
          {message}
        </p>
      )}

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <PushToggle />
      </div>
    </div>
  );
}
