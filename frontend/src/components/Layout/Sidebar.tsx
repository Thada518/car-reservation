'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Calendar, Car, Users, ClipboardList,
  CheckSquare, LogOut, ChevronRight, Settings, X
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'แดชบอร์ด', icon: LayoutDashboard, roles: ['admin', 'approver', 'user'] },
  { href: '/calendar', label: 'ปฏิทินการจอง', icon: Calendar, roles: ['admin', 'approver', 'user'] },
  { href: '/bookings', label: 'รายการจอง', icon: ClipboardList, roles: ['admin', 'approver', 'user'] },
  { href: '/bookings/new', label: 'จองรถ', icon: Car, roles: ['admin', 'approver', 'user'] },
  { href: '/pending', label: 'รออนุมัติ', icon: CheckSquare, roles: ['admin', 'approver'] },
  { href: '/admin/vehicles', label: 'จัดการรถ', icon: Settings, roles: ['admin'] },
  { href: '/admin/users', label: 'จัดการผู้ใช้', icon: Users, roles: ['admin'] },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const filtered = navItems.filter(item => user && item.roles.includes(user.role));

  const content = (
    <aside className="w-64 bg-slate-900 min-h-screen flex flex-col h-full">
      <div className="p-5 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center text-lg">🚗</div>
          <div>
            <h1 className="text-white font-bold text-sm leading-tight">ระบบจองรถ</h1>
            <p className="text-slate-400 text-xs">Car Reservation</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg">
            <X size={18} />
          </button>
        )}
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {filtered.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href ||
            (item.href !== '/dashboard' && item.href !== '/bookings' && pathname.startsWith(item.href)) ||
            (item.href === '/bookings' && (pathname === '/bookings' || /^\/bookings\/\d+$/.test(pathname)));
          return (
            <Link key={item.href} href={item.href} onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                active
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              )}>
              <Icon size={18} />
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight size={14} />}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-700">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {user?.full_name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.full_name}</p>
            <p className="text-slate-400 text-xs truncate">{user?.department || user?.role}</p>
          </div>
        </div>
        <button onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all text-sm">
          <LogOut size={16} />
          ออกจากระบบ
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-shrink-0">
        {content}
      </div>

      {/* Mobile/Tablet drawer */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <div className="relative z-10 flex flex-col w-64 shadow-2xl">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
