'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function PageTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const slug = pathname.startsWith('/blog/')
      ? pathname.replace('/blog/', '')
      : null;

    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: pathname, slug }),
    }).catch(console.error);
  }, [pathname]);

  return null;
}
