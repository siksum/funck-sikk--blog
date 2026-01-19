'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function PageTracker() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  useEffect(() => {
    // Wait for session to load before tracking
    if (status === 'loading') {
      return;
    }

    // Skip tracking for admin users
    if (session?.user?.isAdmin) {
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
