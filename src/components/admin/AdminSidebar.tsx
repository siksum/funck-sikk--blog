'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { signOutCompletely } from '@/lib/auth-client';

interface AdminSidebarProps {
  user: {
    name?: string | null;
    image?: string | null;
  };
}

const menuItems = [
  { href: '/admin', label: '대시보드', icon: '📊' },
  { href: '/admin/posts', label: '포스트 관리', icon: '📝' },
  { href: '/admin/new', label: '새 포스트', icon: '✏️' },
  { href: '/admin/comments', label: '댓글 관리', icon: '💬' },
  { href: '/admin/subscribers', label: '구독자 관리', icon: '📧' },
];

export default function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Get current page title
  const getCurrentPageTitle = () => {
    const currentItem = menuItems.find((item) => item.href === pathname);
    if (currentItem) return currentItem.label;
    if (pathname.startsWith('/admin/edit/')) return '포스트 수정';
    return '관리자';
  };

  // Close sidebar when route changes on mobile
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      {/* Mobile Header - positioned below blog header (h-16 = 64px) */}
      <div className="lg:hidden fixed top-16 left-0 right-0 z-40 bg-gray-900 text-white h-14 flex items-center px-3 border-b border-gray-700 shadow-lg">
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          aria-label="메뉴 열기"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="flex-1 flex items-center justify-center">
          <span className="text-sm font-medium">{getCurrentPageTitle()}</span>
        </div>
        <Link
          href="/"
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          aria-label="블로그로 이동"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </Link>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          w-64 bg-gray-900 text-white h-screen flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          lg:top-0
        `}
      >
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <div>
            <Link href="/" className="text-xl font-bold">
              func(sikk)
            </Link>
            <p className="text-sm text-gray-400 mt-1">관리자 패널</p>
          </div>
          {/* Mobile close button */}
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-2 hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="메뉴 닫기"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            {user.image && (
              <img
                src={user.image}
                alt={user.name || ''}
                className="w-10 h-10 rounded-full"
              />
            )}
            <div>
              <p className="font-medium">{user.name}</p>
              <p className="text-xs text-gray-400">관리자</p>
            </div>
          </div>
          <button
            onClick={() => signOutCompletely('/')}
            className="w-full px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            로그아웃
          </button>
        </div>
      </aside>
    </>
  );
}
