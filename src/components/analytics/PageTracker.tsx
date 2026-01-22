'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';

// Admin emails that should not be tracked
const ADMIN_EMAILS = ['sikk@sikk.kr', 'namyoung0718@gmail.com'];
const ADMIN_MARKER_KEY = 'blog_admin_no_track';

export default function PageTracker() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  useEffect(() => {
    // Wait for session to load before tracking
    if (status === 'loading') {
      return;
    }

    // Check if this browser is marked as admin (persists across sessions)
    const isMarkedAsAdmin = typeof window !== 'undefined' && localStorage.getItem(ADMIN_MARKER_KEY) === 'true';

    // If user is admin, mark this browser permanently
    const isCurrentAdmin = session?.user?.isAdmin ||
      (session?.user?.email && ADMIN_EMAILS.includes(session.user.email));

    if (isCurrentAdmin && typeof window !== 'undefined') {
      localStorage.setItem(ADMIN_MARKER_KEY, 'true');
    }

    // Skip tracking for admin users (by isAdmin flag)
    if (session?.user?.isAdmin) {
      return;
    }

    // Skip tracking for admin users (by email)
    if (session?.user?.email && ADMIN_EMAILS.includes(session.user.email)) {
      return;
    }

    // Skip tracking if this browser was previously marked as admin
    if (isMarkedAsAdmin) {
      return;
    }

    // Skip tracking for admin paths
    if (pathname.startsWith('/admin')) {
      return;
    }

    const slug = pathname.startsWith('/blog/')
      ? pathname.replace('/blog/', '')
      : null;

    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: pathname, slug }),
    }).catch(console.error);
  }, [pathname, session, status]);

  return null;
}
