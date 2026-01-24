'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePushSubscription } from '@/hooks/usePushSubscription';

export default function FooterClient() {
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith('/admin');
  const { isSubscribed, isSupported, isLoading, subscribe, unsubscribe } = usePushSubscription();

  const handleNotificationToggle = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  };

  return (
    <footer
      className={`border-t ${isAdminPage ? 'lg:ml-64' : ''}`}
      style={{ borderColor: 'var(--card-border)' }}
    >
      <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About */}
          <div>
            <h3 className="text-lg font-semibold mb-4">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-violet-500 dark:from-violet-300 dark:to-violet-400">
                func
              </span>
              <span style={{ color: 'var(--foreground)' }}>(</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-500 dark:from-indigo-300 dark:to-violet-300">
                sikk
              </span>
              <span style={{ color: 'var(--foreground)' }}>)</span>
            </h3>
            <p style={{ color: 'var(--foreground-muted)' }}>
              A personal blog about development, technology, and more.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
              Links
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/blog"
                  className="footer-link transition-colors"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="footer-link transition-colors"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/subscribe"
                  className="footer-link transition-colors"
                >
                  Subscribe
                </Link>
              </li>
            </ul>
          </div>

          {/* Social & Notifications */}
          <div>
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
              Connect
            </h3>
            <div className="flex space-x-4 items-center">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-link transition-colors"
                aria-label="GitHub"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-link transition-colors"
                aria-label="Twitter"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              {isSupported && !isLoading && (
                <button
                  onClick={handleNotificationToggle}
                  className="footer-link transition-colors relative"
                  aria-label={isSubscribed ? '알림 해제' : '알림 구독'}
                  title={isSubscribed ? '알림 해제' : '알림 구독'}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                  {isSubscribed && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full" />
                  )}
                </button>
              )}
            </div>
            {isSupported && !isLoading && (
              <p className="mt-2 text-xs" style={{ color: 'var(--foreground-muted)' }}>
                {isSubscribed ? '알림이 활성화되어 있습니다' : '알림을 구독하세요'}
              </p>
            )}
          </div>
        </div>

        <div className="mt-8 pt-8 border-t" style={{ borderColor: 'var(--card-border)' }}>
          <p className="text-center" style={{ color: 'var(--foreground-muted)' }}>
            &copy; {new Date().getFullYear()} func(sikk). All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
