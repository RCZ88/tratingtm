import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth/authOptions';
import { AdminNav } from '@/components/admin/AdminNav';

/**
 * Admin Layout
 * 
 * Layout for all admin pages. Includes navigation and checks authentication.
 */

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // Don't redirect on login page
  // The middleware will handle auth protection for other routes

  return (
    <div className="min-h-screen bg-background text-foreground">
      {session && <AdminNav user={{ email: session.user.email, role: session.user.role }} />}
      <main className="p-4 lg:p-8">
        {children}
      </main>
    </div>
  );
}
