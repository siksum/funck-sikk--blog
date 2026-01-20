import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';

const isDev = process.env.NODE_ENV === 'development';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!isDev && !session?.user?.isAdmin) {
    redirect('/auth/signin?callbackUrl=/admin');
  }

  const user = session?.user ?? { name: 'Dev Admin', image: null };

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <AdminSidebar user={user} />
      <main className="flex-1 p-4 lg:p-8 overflow-auto pt-[136px] lg:pt-8">{children}</main>
    </div>
  );
}
