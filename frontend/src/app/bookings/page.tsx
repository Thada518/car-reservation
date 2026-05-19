'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/Layout/AppLayout';
import api from '@/lib/api';
import { Booking } from '@/types';
import { formatDateTime, statusColor, statusLabel, vehicleTypeIcon } from '@/lib/utils';
import { Plus, Search, ChevronRight } from 'lucide-react';

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const params: Record<string, string> = {};
    if (statusFilter) params.status = statusFilter;
    api.get('/bookings', { params }).then(r => setBookings(r.data)).finally(() => setLoading(false));
  }, [statusFilter]);

  const filtered = bookings.filter(b =>
    !search || b.purpose.toLowerCase().includes(search.toLowerCase()) ||
    b.vehicle_name.toLowerCase().includes(search.toLowerCase()) ||
    b.user_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900">รายการจอง</h1>
            <p className="text-slate-500 text-xs md:text-sm mt-0.5">ประวัติการจองรถทั้งหมด</p>
          </div>
          <Link href="/bookings/new"
            className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 md:px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
            <Plus size={16} />
            <span className="hidden sm:inline">จองรถ</span>
          </Link>
        </div>

        <div className="flex gap-2 md:gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="ค้นหา..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-400 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-2 md:px-3 py-2 border border-slate-400 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-0">
            <option value="">ทุกสถานะ</option>
            <option value="pending">รอดำเนินการ</option>
            <option value="approved">อนุมัติแล้ว</option>
            <option value="rejected">ปฏิเสธ</option>
            <option value="cancelled">ยกเลิก</option>
          </select>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-3xl mb-2">📋</p>
              <p className="text-slate-500 text-sm">ไม่พบรายการจอง</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filtered.map(b => (
                <Link key={b.id} href={`/bookings/${b.id}`}
                  className="flex items-center gap-3 p-3 md:p-4 hover:bg-slate-50 transition-colors">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-lg flex-shrink-0">
                    {vehicleTypeIcon[b.vehicle_type] || '🚗'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-slate-800 truncate flex-1 min-w-0">{b.purpose}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium flex-shrink-0 ${statusColor[b.status]}`}>
                        {statusLabel[b.status]}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate">{b.vehicle_name} · {b.license_plate}</p>
                    <p className="text-xs text-slate-400">{formatDateTime(b.start_datetime)}</p>
                    <p className="text-xs text-slate-500 sm:hidden">{b.user_name}</p>
                  </div>
                  <div className="hidden sm:block text-right flex-shrink-0">
                    <p className="text-xs font-medium text-slate-600">{b.user_name}</p>
                    <p className="text-xs text-slate-400">{b.department || ''}</p>
                  </div>
                  <ChevronRight size={15} className="text-slate-300 flex-shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
