import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import MyWorldSidebar from '@/components/my-world/MyWorldSidebar';

const isDev = process.env.NODE_ENV === 'development';

export default async function MyWorldLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // 프로덕션에서만 인증 체크 (로컬 개발 시 항상 접근 가능)
  if (process.env.NODE_ENV === 'production' && !session?.user?.isAdmin) {
    redirect('/auth/signin?callbackUrl=/my-world');
  }

  const user = session?.user ?? { name: 'Dev User', image: null };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-gray-900 dark:to-violet-950">
      <MyWorldSidebar user={user} />
      <main className="p-4 lg:p-8 pt-[136px] lg:pt-8 lg:ml-64">{children}</main>
    </div>
  );
}
