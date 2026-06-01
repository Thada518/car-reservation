'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react';

const pageTitles: Record<string, string> = {
  '/dashboard': 'แดชบอร์ด',
  '/calendar': 'ปฏิทินการจอง',
  '/bookings': 'รายการจอง',
  '/bookings/new': 'จองรถ',
  '/pending': 'รออนุมัติ',
  '/admin/vehicles': 'จัดการรถ',
  '/admin/users': 'จัดการผู้ใช้',
};

export default function AppLayout({ children, requireAuth = true }: { children: React.ReactNode; requireAuth?: boolean }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !user && requireAuth) router.replace('/login');
  }, [user, isLoading, router, requireAuth]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (!user && requireAuth) return null;

  const title = Object.entries(pageTitles).find(([key]) =>
    key === pathname || (key !== '/dashboard' && key !== '/bookings' && pathname.startsWith(key))
  )?.[1] ?? 'ระบบจองรถ';

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar for mobile/tablet */}
        <header className="lg:hidden sticky top-0 z-40 bg-white border-b border-slate-200 flex items-center gap-3 px-4 py-3 shadow-sm">
          <button onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <Menu size={20} className="text-slate-700" />
          </button>
          <div className="flex items-center gap-2 flex-1">
            <span className="text-lg">🚗</span>
            <span className="font-semibold text-slate-800 text-sm">{title}</span>
          </div>
          {user ? (
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
              {user.full_name.charAt(0)}
            </div>
          ) : (
            <Link href="/login" className="text-xs font-medium text-blue-600 hover:underline">
              เข้าสู่ระบบ
            </Link>
          )}
        </header>

        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto p-4 md:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
