'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';

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

  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <Link href="/" className="text-xl font-bold">
          func(sikk)
        </Link>
        <p className="text-sm text-gray-400 mt-1">관리자 패널</p>
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
          onClick={() => signOut({ callbackUrl: '/' })}
          className="w-full px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
        >
          로그아웃
        </button>
      </div>
    </aside>
  );
}
