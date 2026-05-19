'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/Layout/AppLayout';
import api from '@/lib/api';
import { Vehicle } from '@/types';
import { vehicleTypeIcon, vehicleTypeLabel } from '@/lib/utils';
import { format } from 'date-fns';
import { AlertCircle, CheckCircle } from 'lucide-react';

export default function NewBookingPage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [form, setForm] = useState({
    vehicle_id: '',
    purpose: '',
    destination: '',
    passenger_count: '1',
    start_datetime: '',
    end_datetime: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [checkingAvail, setCheckingAvail] = useState(false);
  const [availability, setAvailability] = useState<Vehicle[]>([]);

  useEffect(() => {
    api.get('/vehicles').then(r => setVehicles(r.data));
  }, []);

  const checkAvailability = async () => {
    if (!form.start_datetime || !form.end_datetime) return;
    setCheckingAvail(true);
    try {
      const r = await api.get('/vehicles/availability', {
        params: { start: form.start_datetime, end: form.end_datetime }
      });
      setAvailability(r.data);
    } finally {
      setCheckingAvail(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/bookings', {
        ...form,
        vehicle_id: Number(form.vehicle_id),
        passenger_count: Number(form.passenger_count),
      });
      setSuccess('จองรถสำเร็จ! รอการอนุมัติจากผู้จัดการ');
      setTimeout(() => router.push('/bookings'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  const now = format(new Date(), "yyyy-MM-dd'T'HH:mm");

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">จองรถ</h1>
          <p className="text-slate-500 text-sm mt-1">กรอกรายละเอียดการจองรถ</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            <AlertCircle size={16} />{error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm">
            <CheckCircle size={16} />{success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">วันเวลาเริ่มต้น *</label>
              <input type="datetime-local" required min={now}
                value={form.start_datetime}
                onChange={e => setForm(f => ({ ...f, start_datetime: e.target.value }))}
                onBlur={checkAvailability}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">วันเวลาสิ้นสุด *</label>
              <input type="datetime-local" required min={form.start_datetime || now}
                value={form.end_datetime}
                onChange={e => setForm(f => ({ ...f, end_datetime: e.target.value }))}
                onBlur={checkAvailability}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">เลือกรถ *</label>
            {checkingAvail && <p className="text-xs text-blue-500 mb-2">กำลังตรวจสอบการว่าง...</p>}
            <div className="grid grid-cols-2 gap-3">
              {(availability.length > 0 ? availability : vehicles).map(v => {
                const avail = availability.length > 0 ? v.available : true;
                return (
                  <button key={v.id} type="button"
                    disabled={!avail}
                    onClick={() => avail && setForm(f => ({ ...f, vehicle_id: String(v.id) }))}
                    className={`flex items-center gap-3 p-3 border-2 rounded-xl text-left transition-all text-sm
                      ${!avail ? 'opacity-40 cursor-not-allowed bg-slate-50 border-slate-200' :
                        form.vehicle_id === String(v.id)
                          ? 'border-blue-500 bg-blue-50 text-blue-800'
                          : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50'}`}>
                    <span className="text-2xl">{vehicleTypeIcon[v.type]}</span>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{v.name}</p>
                      <p className="text-xs text-slate-500">{v.license_plate} · {vehicleTypeLabel[v.type]}</p>
                      {!avail && <p className="text-xs text-red-500">ไม่ว่าง</p>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">วัตถุประสงค์ *</label>
            <input type="text" required placeholder="เช่น ติดต่องาน, ประชุม..."
              value={form.purpose}
              onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">ปลายทาง</label>
              <input type="text" placeholder="ระบุสถานที่"
                value={form.destination}
                onChange={e => setForm(f => ({ ...f, destination: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">จำนวนผู้โดยสาร</label>
              <input type="number" min="1" max="20"
                value={form.passenger_count}
                onChange={e => setForm(f => ({ ...f, passenger_count: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">หมายเหตุ</label>
            <textarea rows={3} placeholder="รายละเอียดเพิ่มเติม..."
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => router.back()}
              className="flex-1 border border-slate-200 text-slate-600 py-2.5 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium">
              ยกเลิก
            </button>
            <button type="submit" disabled={loading || !form.vehicle_id}
              className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors text-sm font-medium">
              {loading ? 'กำลังส่ง...' : 'ยืนยันการจอง'}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
