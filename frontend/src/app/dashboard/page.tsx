'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/Layout/AppLayout';
import api from '@/lib/api';
import { DashboardStats } from '@/types';
import { formatDateTime, statusColor, statusLabel, vehicleTypeIcon } from '@/lib/utils';
import { Car, Clock, CheckCircle, Calendar, Plus, TrendingUp } from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/bookings/stats').then(r => setStats(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <AppLayout>
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </AppLayout>
  );

  return (
    <AppLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900">แดชบอร์ด</h1>
            <p className="text-slate-500 text-xs md:text-sm mt-0.5">ภาพรวมการจองรถยนต์</p>
          </div>
          <Link href="/bookings/new"
            className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 md:px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm">
            <Plus size={16} />
            <span className="hidden sm:inline">จองรถ</span>
          </Link>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {[
            { label: 'รออนุมัติ', value: stats?.pending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100', iconBg: 'bg-amber-100' },
            { label: 'อนุมัติแล้ว', value: stats?.approved, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50 border-green-100', iconBg: 'bg-green-100' },
            { label: 'จองวันนี้', value: stats?.today, icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100', iconBg: 'bg-blue-100' },
            { label: 'รถทั้งหมด', value: stats?.vehicles, icon: Car, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-100', iconBg: 'bg-purple-100' },
          ].map(({ label, value, icon: Icon, color, bg, iconBg }) => (
            <div key={label} className={`bg-white border rounded-xl p-4 md:p-5 shadow-sm ${bg}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-xs font-medium mb-1 ${color} opacity-70`}>{label}</p>
                  <p className={`text-2xl md:text-3xl font-bold ${color}`}>{value ?? '-'}</p>
                </div>
                <div className={`w-10 h-10 md:w-12 md:h-12 ${iconBg} rounded-xl flex items-center justify-center ${color}`}>
                  <Icon size={20} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Recent bookings */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
            <div className="flex items-center justify-between p-4 md:p-5 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800 flex items-center gap-2 text-sm md:text-base">
                <TrendingUp size={16} className="text-blue-500" />
                การจองล่าสุด
              </h2>
              <Link href="/bookings" className="text-blue-600 text-xs md:text-sm hover:underline">ดูทั้งหมด</Link>
            </div>
            <div className="divide-y divide-slate-50">
              {stats?.recentBookings.length === 0 && (
                <p className="text-slate-400 text-sm text-center py-8">ยังไม่มีการจอง</p>
              )}
              {stats?.recentBookings.map(b => (
                <Link key={b.id} href={`/bookings/${b.id}`}
                  className="flex items-center gap-3 p-3 md:p-4 hover:bg-slate-50 transition-colors">
                  <div className="w-9 h-9 md:w-10 md:h-10 bg-slate-100 rounded-xl flex items-center justify-center text-base md:text-lg flex-shrink-0">
                    {vehicleTypeIcon[b.vehicle_type] || '🚗'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{b.purpose}</p>
                    <p className="text-xs text-slate-500 truncate">{b.vehicle_name} · {b.user_name}</p>
                    <p className="text-xs text-slate-400">{formatDateTime(b.start_datetime)}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium flex-shrink-0 ${statusColor[b.status]}`}>
                    {statusLabel[b.status]}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
            <div className="flex items-center p-4 md:p-5 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800 flex items-center gap-2 text-sm md:text-base">
                <Car size={16} className="text-blue-500" />
                ลิงค์ด่วน
              </h2>
            </div>
            <div className="p-4 md:p-5 grid grid-cols-2 gap-3">
              {[
                { href: '/bookings/new', icon: '📋', label: 'จองรถ', desc: 'สร้างการจองใหม่' },
                { href: '/calendar', icon: '📅', label: 'ปฏิทิน', desc: 'ดูตารางการจอง' },
                { href: '/bookings', icon: '📑', label: 'รายการจอง', desc: 'ดูการจองทั้งหมด' },
                { href: '/pending', icon: '⏳', label: 'รออนุมัติ', desc: 'จัดการคำขอ' },
              ].map(({ href, icon, label, desc }) => (
                <Link key={href} href={href}
                  className="flex flex-col items-center gap-1.5 p-3 md:p-4 bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-200 rounded-xl transition-all text-center">
                  <span className="text-xl md:text-2xl">{icon}</span>
                  <span className="text-xs md:text-sm font-medium text-slate-700">{label}</span>
                  <span className="text-xs text-slate-400 hidden sm:block">{desc}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
