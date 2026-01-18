'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';
import { NavItem, Post } from '@/types';
import ThemeToggle from '@/components/ui/ThemeToggle';
import SearchModal from '@/components/search/SearchModal';

const navigation: NavItem[] = [
  {
    label: 'Blog',
    href: '/blog',
  },
  {
    label: 'Categories',
    href: '/categories',
  },
  {
    label: 'Tags',
    href: '/tags',
  },
  {
    label: 'About',
    href: '/about',
  },
];

interface HeaderClientProps {
  posts: Post[];
}

export default function HeaderClient({ posts }: HeaderClientProps) {
  const { data: session } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-50 backdrop-blur-xl border-b transition-all"
      style={{
        background: 'var(--card-bg)',
        borderColor: 'var(--card-border)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <span className="text-xl font-bold">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-pink-500 dark:from-pink-400 dark:to-pink-500 group-hover:from-pink-500 group-hover:to-rose-500 transition-all">
                func
              </span>
              <span style={{ color: 'var(--foreground)' }}>(</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-pink-500 dark:from-cyan-400 dark:to-pink-400 group-hover:from-cyan-500 group-hover:to-pink-500 transition-all">
                sikk
              </span>
              <span style={{ color: 'var(--foreground)' }}>)</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="relative text-sm font-medium transition-colors hover:text-pink-600 dark:hover:text-pink-400"
                style={{ color: 'var(--foreground-muted)' }}
              >
                {item.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-pink-500 to-cyan-500 transition-all duration-300 group-hover:w-full hover:w-full" />
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-3">
            {/* Search Button */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2 rounded-lg transition-all hover:bg-pink-100 dark:hover:bg-pink-500/10 hover:text-pink-600 dark:hover:text-pink-400"
              style={{ color: 'var(--foreground-muted)' }}
              aria-label="Search"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* User Menu */}
            {session ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 rounded-full ring-2 ring-transparent hover:ring-pink-400/50 transition-all"
                >
                  {session.user?.image ? (
                    <img
                      src={session.user.image}
                      alt={session.user.name || ''}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-cyan-400" />
                  )}
                </button>
                {isUserMenuOpen && (
                  <div
                    className="absolute right-0 mt-2 w-48 rounded-xl shadow-xl py-1 z-50 backdrop-blur-xl border"
                    style={{
                      background: 'var(--card-bg)',
                      borderColor: 'var(--card-border)',
                    }}
                  >
                    <div className="px-4 py-2 border-b" style={{ borderColor: 'var(--card-border)' }}>
                      <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                        {session.user?.name}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>{session.user?.email}</p>
                    </div>
                    {session.user?.isAdmin && (
                      <Link
                        href="/admin"
                        className="block px-4 py-2 text-sm transition-colors hover:bg-pink-100 dark:hover:bg-pink-500/10 hover:text-pink-600 dark:hover:text-pink-400"
                        style={{ color: 'var(--foreground-muted)' }}
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        관리자 페이지
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        signOut();
                      }}
                      className="block w-full text-left px-4 py-2 text-sm transition-colors hover:bg-pink-100 dark:hover:bg-pink-500/10 hover:text-pink-600 dark:hover:text-pink-400"
                      style={{ color: 'var(--foreground-muted)' }}
                    >
                      로그아웃
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => signIn()}
                className="text-sm font-medium px-4 py-2 rounded-lg transition-all hover:bg-pink-100 dark:hover:bg-pink-500/10 hover:text-pink-600 dark:hover:text-pink-400"
                style={{ color: 'var(--foreground-muted)' }}
              >
                로그인
              </button>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg transition-all hover:bg-pink-100 dark:hover:bg-pink-500/10 hover:text-pink-600 dark:hover:text-pink-400"
              style={{ color: 'var(--foreground-muted)' }}
              aria-label="Toggle menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden py-4 border-t" style={{ borderColor: 'var(--card-border)' }}>
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block py-3 px-2 rounded-lg transition-all hover:bg-pink-100 dark:hover:bg-pink-500/10 hover:text-pink-600 dark:hover:text-pink-400"
                style={{ color: 'var(--foreground-muted)' }}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}
      </div>

      {/* Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        posts={posts}
      />
    </header>
  );
}
