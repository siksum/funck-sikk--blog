import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function MyWorldLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 로컬 개발 시 인증 오류 무시
  let session = null;
  try {
    session = await auth();
  } catch {
    // 로컬 개발 환경에서 AUTH_SECRET 없을 때 무시
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Authentication failed');
    }
  }

  // 프로덕션에서만 인증 체크 (로컬 개발 시 항상 접근 가능)
  if (process.env.NODE_ENV === 'production' && !session?.user?.isAdmin) {
    redirect('/auth/signin?callbackUrl=/my-world');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-gray-900 dark:to-violet-950">
      <main className="p-4 lg:p-8">{children}</main>
    </div>
  );
}
