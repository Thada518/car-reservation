'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/Layout/AppLayout';
import api from '@/lib/api';
import { Booking } from '@/types';
import { formatDateTime, vehicleTypeIcon } from '@/lib/utils';
import { CheckCircle, XCircle, ChevronRight, Clock, MessageSquare } from 'lucide-react';

export default function PendingPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<number | null>(null);
  const [comments, setComments] = useState<Record<number, string>>({});

  const load = () => {
    api.get('/bookings', { params: { status: 'pending' } }).then(r => setBookings(r.data)).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const approve = async (id: number) => {
    setActing(id);
    try {
      await api.put(`/bookings/${id}/approve`, { comment: comments[id] || undefined });
      load();
    } finally { setActing(null); }
  };

  const reject = async (id: number) => {
    setActing(id);
    try {
      await api.put(`/bookings/${id}/reject`, { comment: comments[id] || undefined });
      load();
    } finally { setActing(null); }
  };

  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-5">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">รายการรออนุมัติ</h1>
          <p className="text-slate-500 text-xs md:text-sm mt-0.5">จัดการคำขอจองรถที่รอดำเนินการ</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-12">
              <Clock size={36} className="mx-auto text-slate-300 mb-2" />
              <p className="text-slate-500 text-sm">ไม่มีรายการรอดำเนินการ</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {bookings.map(b => (
                <div key={b.id} className="p-3 md:p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-lg flex-shrink-0 mt-0.5">
                      {vehicleTypeIcon[b.vehicle_type] || '🚗'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{b.purpose}</p>
                      <p className="text-xs text-slate-600">{b.vehicle_name} · {b.license_plate}</p>
                      <p className="text-xs text-slate-400">{formatDateTime(b.start_datetime)} – {formatDateTime(b.end_datetime)}</p>
                      <p className="text-xs text-slate-500 mt-0.5">ผู้จอง: <span className="font-medium">{b.user_name}</span>{b.department && ` (${b.department})`}</p>
                    </div>
                    <Link href={`/bookings/${b.id}`} className="p-1.5 hover:bg-slate-100 rounded-lg flex-shrink-0">
                      <ChevronRight size={15} className="text-slate-400" />
                    </Link>
                  </div>

                  <div className="mt-3">
                    <label className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mb-1">
                      <MessageSquare size={12} />
                      หมายเหตุ / เหตุผล (ถ้ามี)
                    </label>
                    <textarea
                      rows={2}
                      value={comments[b.id] ?? ''}
                      onChange={e => setComments(prev => ({ ...prev, [b.id]: e.target.value }))}
                      placeholder="เพิ่มหมายเหตุหรือเหตุผลสำหรับการอนุมัติ/ปฏิเสธ..."
                      className="w-full text-xs text-slate-900 bg-white border border-slate-300 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-slate-400"
                    />
                  </div>

                  <div className="flex gap-2 mt-2">
                    <button onClick={() => approve(b.id)} disabled={acting === b.id}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 disabled:bg-green-300 text-xs font-medium transition-colors">
                      <CheckCircle size={14} />อนุมัติ
                    </button>
                    <button onClick={() => reject(b.id)} disabled={acting === b.id}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 disabled:bg-red-300 text-xs font-medium transition-colors">
                      <XCircle size={14} />ปฏิเสธ
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
