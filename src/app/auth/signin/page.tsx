'use client';

import { signIn, signOut, getProviders, useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

type Providers = Awaited<ReturnType<typeof getProviders>>;

function SignInContent() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const [providers, setProviders] = useState<Providers>(null);

  useEffect(() => {
    getProviders().then(setProviders);
  }, []);

  const hasGitHub = providers?.github;
  const hasGoogle = providers?.google;

  // Handle login - if already logged in, sign out first then sign in
  const handleSignIn = async (provider: string) => {
    if (session) {
      // Clear existing session completely before signing in with new account
      try {
        await fetch('/api/auth/signout-custom', {
          method: 'POST',
          credentials: 'include',
        });
      } catch (e) {
        console.error('Failed to clear session:', e);
      }
      // Sign out without redirect, then sign in
      await signOut({ redirect: false });
    }
    // Now sign in with the new provider
    signIn(provider, { callbackUrl });
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div style={{ color: 'var(--foreground)', opacity: 0.5 }}>로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
            {session ? '계정 전환' : '로그인'}
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
            {session ? '다른 계정으로 로그인하세요' : '소셜 계정으로 로그인하세요'}
          </p>
        </div>

        {/* Show current account if logged in */}
        {session && (
          <div
            className="p-4 rounded-lg border"
            style={{ borderColor: 'var(--card-border)', background: 'var(--card-bg)' }}
          >
            <p className="text-xs mb-2" style={{ color: 'var(--foreground)', opacity: 0.5 }}>
              현재 로그인된 계정
            </p>
            <div className="flex items-center gap-3">
              {session.user?.image && (
                <img
                  src={session.user.image}
                  alt=""
                  className="w-10 h-10 rounded-full"
                />
              )}
              <div>
                <p className="font-medium" style={{ color: 'var(--foreground)' }}>
                  {session.user?.name}
                </p>
                <p className="text-sm" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
                  {session.user?.email}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {hasGitHub && (
            <button
              onClick={() => handleSignIn('github')}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path
                  fillRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  clipRule="evenodd"
                />
              </svg>
              <span style={{ color: 'var(--foreground)' }}>
                {session ? 'GitHub 계정으로 전환' : 'GitHub로 계속하기'}
              </span>
            </button>
          )}

          {hasGoogle && (
            <button
              onClick={() => handleSignIn('google')}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span style={{ color: 'var(--foreground)' }}>
                {session ? 'Google 계정으로 전환' : 'Google로 계속하기'}
              </span>
            </button>
          )}

          {!providers && (
            <div className="text-center py-4" style={{ color: 'var(--foreground)', opacity: 0.5 }}>
              로딩 중...
            </div>
          )}

          {providers && !hasGitHub && !hasGoogle && (
            <div className="text-center py-4" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
              사용 가능한 로그인 방법이 없습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">로딩 중...</div>}>
      <SignInContent />
    </Suspense>
  );
}
