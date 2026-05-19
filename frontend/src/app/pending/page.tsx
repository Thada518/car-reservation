'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/Layout/AppLayout';
import api from '@/lib/api';
import { Booking } from '@/types';
import { formatDateTime, vehicleTypeIcon } from '@/lib/utils';
import { CheckCircle, XCircle, ChevronRight, Clock } from 'lucide-react';

export default function PendingPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<number | null>(null);

  const load = () => {
    api.get('/bookings', { params: { status: 'pending' } }).then(r => setBookings(r.data)).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const approve = async (id: number) => {
    setActing(id);
    try { await api.put(`/bookings/${id}/approve`); load(); } finally { setActing(null); }
  };

  const reject = async (id: number) => {
    const reason = prompt('ระบุเหตุผลการปฏิเสธ:');
    if (reason === null) return;
    setActing(id);
    try { await api.put(`/bookings/${id}/reject`, { rejection_reason: reason }); load(); } finally { setActing(null); }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">รายการรออนุมัติ</h1>
          <p className="text-slate-500 text-sm mt-1">จัดการคำขอจองรถที่รอดำเนินการ</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-48"><div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-16">
              <Clock size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500">ไม่มีรายการรอดำเนินการ</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {bookings.map(b => (
                <div key={b.id} className="flex items-center gap-4 p-4">
                  <div className="w-11 h-11 bg-amber-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                    {vehicleTypeIcon[b.vehicle_type] || '🚗'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{b.purpose}</p>
                    <p className="text-xs text-slate-600">{b.vehicle_name} · {b.license_plate}</p>
                    <p className="text-xs text-slate-400">{formatDateTime(b.start_datetime)} – {formatDateTime(b.end_datetime)}</p>
                    <p className="text-xs text-slate-500 mt-0.5">ผู้จอง: <span className="font-medium">{b.user_name}</span> {b.department && `(${b.department})`}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => approve(b.id)} disabled={acting === b.id}
                      className="flex items-center gap-1 bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 disabled:bg-green-300 text-xs font-medium">
                      <CheckCircle size={14} />อนุมัติ
                    </button>
                    <button onClick={() => reject(b.id)} disabled={acting === b.id}
                      className="flex items-center gap-1 bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 disabled:bg-red-300 text-xs font-medium">
                      <XCircle size={14} />ปฏิเสธ
                    </button>
                    <Link href={`/bookings/${b.id}`} className="p-1.5 hover:bg-slate-100 rounded-lg">
                      <ChevronRight size={16} className="text-slate-400" />
                    </Link>
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
