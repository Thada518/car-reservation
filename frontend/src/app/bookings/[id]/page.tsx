'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppLayout from '@/components/Layout/AppLayout';
import { useAuth } from '@/lib/auth-context';
import api from '@/lib/api';
import { Booking } from '@/types';
import { formatDateTime, statusColor, statusLabel, vehicleTypeIcon, vehicleTypeLabel } from '@/lib/utils';
import { ArrowLeft, CheckCircle, XCircle, Ban, MapPin, Users, FileText, Clock } from 'lucide-react';

export default function BookingDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [showReject, setShowReject] = useState(false);

  const load = () => api.get(`/bookings/${id}`).then(r => setBooking(r.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, [id]);

  const handleApprove = async () => {
    setActionLoading('approve');
    try { await api.put(`/bookings/${id}/approve`); load(); } finally { setActionLoading(''); }
  };

  const handleReject = async () => {
    setActionLoading('reject');
    try { await api.put(`/bookings/${id}/reject`, { rejection_reason: rejectReason }); setShowReject(false); load(); } finally { setActionLoading(''); }
  };

  const handleCancel = async () => {
    if (!confirm('ยืนยันการยกเลิกการจอง?')) return;
    setActionLoading('cancel');
    try { await api.delete(`/bookings/${id}`); router.push('/bookings'); } finally { setActionLoading(''); }
  };

  if (loading) return <AppLayout requireAuth={false}><div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div></AppLayout>;
  if (!booking) return <AppLayout requireAuth={false}><p className="text-center text-slate-500 py-16">ไม่พบการจอง</p></AppLayout>;

  const canApprove = ['admin', 'approver'].includes(user?.role || '') && booking.status === 'pending';
  const canCancel = booking.status === 'pending' || (booking.status === 'approved' && (user?.role !== 'user' || booking.user_id === user.id));

  return (
    <AppLayout requireAuth={false}>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <ArrowLeft size={20} className="text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">รายละเอียดการจอง</h1>
            <p className="text-slate-500 text-sm">#CR{String(booking.id).padStart(4, '0')}</p>
          </div>
          <span className={`ml-auto text-sm px-3 py-1.5 rounded-full border font-medium ${statusColor[booking.status]}`}>
            {statusLabel[booking.status]}
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-3xl">
                {vehicleTypeIcon[booking.vehicle_type] || '🚗'}
              </div>
              <div>
                <p className="text-blue-100 text-sm">{vehicleTypeLabel[booking.vehicle_type]}</p>
                <h2 className="text-xl font-bold">{booking.vehicle_name}</h2>
                <p className="text-blue-200 text-sm">{booking.license_plate}</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <InfoItem icon={<Clock size={16} />} label="เริ่มต้น" value={formatDateTime(booking.start_datetime)} />
              <InfoItem icon={<Clock size={16} />} label="สิ้นสุด" value={formatDateTime(booking.end_datetime)} />
            </div>
            <InfoItem icon={<FileText size={16} />} label="วัตถุประสงค์" value={booking.purpose} />
            {booking.destination && <InfoItem icon={<MapPin size={16} />} label="ปลายทาง" value={booking.destination} />}
            <InfoItem icon={<Users size={16} />} label="ผู้โดยสาร" value={`${booking.passenger_count} คน`} />
            <InfoItem icon={<Users size={16} />} label="ผู้จอง" value={`${booking.user_name} ${booking.department ? `(${booking.department})` : ''}`} />
            {booking.approver_name && <InfoItem icon={<CheckCircle size={16} />} label="ผู้อนุมัติ" value={booking.approver_name} />}
            {booking.rejection_reason && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm font-medium text-red-700 mb-1">เหตุผลการปฏิเสธ</p>
                <p className="text-sm text-red-600">{booking.rejection_reason}</p>
              </div>
            )}
            {booking.notes && <InfoItem icon={<FileText size={16} />} label="หมายเหตุ" value={booking.notes} />}
          </div>
        </div>

        {showReject && (
          <div className="bg-white border border-red-200 rounded-xl p-5">
            <h3 className="font-medium text-slate-800 mb-3">เหตุผลการปฏิเสธ</h3>
            <textarea rows={3} value={rejectReason} onChange={e => setRejectReason(e.target.value)}
              placeholder="ระบุเหตุผล..."
              className="w-full border border-slate-400 rounded-lg px-3 py-2 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none mb-3" />
            <div className="flex gap-3">
              <button onClick={() => setShowReject(false)} className="flex-1 border border-slate-200 py-2 rounded-lg text-sm">ยกเลิก</button>
              <button onClick={handleReject} disabled={!!actionLoading}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm hover:bg-red-700 disabled:bg-red-300">
                {actionLoading === 'reject' ? 'กำลังดำเนินการ...' : 'ปฏิเสธ'}
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          {canApprove && !showReject && (
            <>
              <button onClick={handleApprove} disabled={!!actionLoading}
                className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-2.5 rounded-lg hover:bg-green-700 disabled:bg-green-300 text-sm font-medium">
                <CheckCircle size={16} />{actionLoading === 'approve' ? 'กำลังดำเนินการ...' : 'อนุมัติ'}
              </button>
              <button onClick={() => setShowReject(true)}
                className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white py-2.5 rounded-lg hover:bg-red-700 text-sm font-medium">
                <XCircle size={16} />ปฏิเสธ
              </button>
            </>
          )}
          {canCancel && !showReject && (
            <button onClick={handleCancel} disabled={!!actionLoading}
              className="flex items-center gap-2 border border-slate-200 text-slate-600 px-4 py-2.5 rounded-lg hover:bg-slate-50 text-sm font-medium">
              <Ban size={16} />ยกเลิกการจอง
            </button>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-slate-400 mt-0.5">{icon}</div>
      <div>
        <p className="text-xs text-slate-500 mb-0.5">{label}</p>
        <p className="text-sm font-medium text-slate-800">{value}</p>
      </div>
    </div>
  );
}
