'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/Layout/AppLayout';
import api from '@/lib/api';
import { Booking } from '@/types';
import { formatDateTime, statusColor, statusLabel, vehicleTypeIcon } from '@/lib/utils';
import { Plus, Search, ChevronRight, ChevronLeft } from 'lucide-react';

const PAGE_SIZE = 30;

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchBookings = useCallback(async (p: number, q: string, s: string) => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page: p, limit: PAGE_SIZE };
      if (s) params.status = s;
      if (q) params.search = q;
      const r = await api.get('/bookings', { params });
      setBookings(r.data.data);
      setTotal(r.data.total);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings(page, search, statusFilter);
  }, [page, search, statusFilter, fetchBookings]);

  const handleSearchChange = (val: string) => {
    setSearchInput(val);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setSearch(val);
      setPage(1);
    }, 350);
  };

  const handleStatusChange = (val: string) => {
    setStatusFilter(val);
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <AppLayout requireAuth={false}>
      <div className="space-y-4 md:space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900">รายการจอง</h1>
            <p className="text-slate-500 text-xs md:text-sm mt-0.5">
              ประวัติการจองรถทั้งหมด{total > 0 && ` (${total.toLocaleString()} รายการ)`}
            </p>
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
            <input type="text" placeholder="ค้นหา..." value={searchInput}
              onChange={e => handleSearchChange(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-400 rounded-lg bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={statusFilter} onChange={e => handleStatusChange(e.target.value)}
            className="px-2 md:px-3 py-2 border border-slate-400 rounded-lg bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-0">
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
          ) : bookings.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-3xl mb-2">📋</p>
              <p className="text-slate-500 text-sm">ไม่พบรายการจอง</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {bookings.map(b => (
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

        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              หน้า {page} จาก {totalPages}
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <ChevronLeft size={15} className="text-slate-600" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                const p = start + i;
                return (
                  <button key={p} onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors
                      ${p === page ? 'bg-blue-600 text-white' : 'border border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <ChevronRight size={15} className="text-slate-600" />
              </button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
