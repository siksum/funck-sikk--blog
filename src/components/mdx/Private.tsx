'use client';

import { useSession } from 'next-auth/react';
import { ReactNode } from 'react';

interface PrivateProps {
  children: ReactNode;
}

export default function Private({ children }: PrivateProps) {
  const { data: session } = useSession();
  const isAdmin = session?.user?.isAdmin;

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="my-4 p-4 rounded-lg border-2 border-dashed border-amber-400 dark:border-amber-500 bg-amber-50 dark:bg-amber-500/10">
      <div className="flex items-center gap-2 mb-2 text-amber-600 dark:text-amber-400 text-sm font-medium">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        Private Note
      </div>
      <div className="text-sm" style={{ color: 'var(--foreground)' }}>
        {children}
      </div>
    </div>
  );
}
