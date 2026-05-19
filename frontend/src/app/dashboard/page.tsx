'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/Layout/AppLayout';
import api from '@/lib/api';
import { DashboardStats } from '@/types';
import { formatDateTime, statusColor, statusLabel, vehicleTypeIcon } from '@/lib/utils';
import { Car, Users, Clock, CheckCircle, Calendar, Plus, TrendingUp } from 'lucide-react';

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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">แดชบอร์ด</h1>
            <p className="text-slate-500 text-sm mt-1">ภาพรวมการจองรถยนต์</p>
          </div>
          <Link href="/bookings/new"
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm">
            <Plus size={16} />
            จองรถ
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'รออนุมัติ', value: stats?.pending, icon: Clock, color: 'bg-amber-50 text-amber-600 border-amber-100', iconBg: 'bg-amber-100' },
            { label: 'อนุมัติแล้ว', value: stats?.approved, icon: CheckCircle, color: 'bg-green-50 text-green-600 border-green-100', iconBg: 'bg-green-100' },
            { label: 'จองวันนี้', value: stats?.today, icon: Calendar, color: 'bg-blue-50 text-blue-600 border-blue-100', iconBg: 'bg-blue-100' },
            { label: 'รถทั้งหมด', value: stats?.vehicles, icon: Car, color: 'bg-purple-50 text-purple-600 border-purple-100', iconBg: 'bg-purple-100' },
          ].map(({ label, value, icon: Icon, color, iconBg }) => (
            <div key={label} className={`bg-white border rounded-xl p-5 shadow-sm ${color}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium opacity-70 mb-1">{label}</p>
                  <p className="text-3xl font-bold">{value ?? '-'}</p>
                </div>
                <div className={`w-12 h-12 ${iconBg} rounded-xl flex items-center justify-center`}>
                  <Icon size={22} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                <TrendingUp size={18} className="text-blue-500" />
                การจองล่าสุด
              </h2>
              <Link href="/bookings" className="text-blue-600 text-sm hover:underline">ดูทั้งหมด</Link>
            </div>
            <div className="divide-y divide-slate-50">
              {stats?.recentBookings.length === 0 && (
                <p className="text-slate-400 text-sm text-center py-8">ยังไม่มีการจอง</p>
              )}
              {stats?.recentBookings.map(b => (
                <Link key={b.id} href={`/bookings/${b.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-lg">
                    {vehicleTypeIcon[b.vehicle_type] || '🚗'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{b.purpose}</p>
                    <p className="text-xs text-slate-500">{b.vehicle_name} · {b.user_name}</p>
                    <p className="text-xs text-slate-400">{formatDateTime(b.start_datetime)}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full border font-medium ${statusColor[b.status]}`}>
                    {statusLabel[b.status]}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                <Car size={18} className="text-blue-500" />
                ลิงค์ด่วน
              </h2>
            </div>
            <div className="p-5 grid grid-cols-2 gap-3">
              {[
                { href: '/bookings/new', icon: '📋', label: 'จองรถ', desc: 'สร้างการจองใหม่' },
                { href: '/calendar', icon: '📅', label: 'ปฏิทิน', desc: 'ดูตารางการจอง' },
                { href: '/bookings', icon: '📑', label: 'รายการจอง', desc: 'ดูการจองทั้งหมด' },
                { href: '/pending', icon: '⏳', label: 'รออนุมัติ', desc: 'จัดการคำขอ' },
              ].map(({ href, icon, label, desc }) => (
                <Link key={href} href={href}
                  className="flex flex-col items-center gap-2 p-4 bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-200 rounded-xl transition-all text-center">
                  <span className="text-2xl">{icon}</span>
                  <span className="text-sm font-medium text-slate-700">{label}</span>
                  <span className="text-xs text-slate-400">{desc}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
