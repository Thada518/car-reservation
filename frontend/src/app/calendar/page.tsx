'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/Layout/AppLayout';
import { useAuth } from '@/lib/auth-context';
import api from '@/lib/api';
import { Vehicle, Booking } from '@/types';
import { ChevronLeft, ChevronRight, Plus, X, AlertCircle } from 'lucide-react';
import { vehicleTypeIcon } from '@/lib/utils';

const START_HOUR = 7;
const END_HOUR = 19;
const SLOT_HEIGHT = 32;

const DAY_TH = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
const DAY_SHORT = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
const MONTHS_TH = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];

const TIME_SLOTS: string[] = [];
for (let h = START_HOUR; h < END_HOUR; h++) {
  TIME_SLOTS.push(`${String(h).padStart(2, '0')}:00`);
  TIME_SLOTS.push(`${String(h).padStart(2, '0')}:30`);
}
const TOTAL_HEIGHT = TIME_SLOTS.length * SLOT_HEIGHT;

const STATUS_STYLE: Record<string, string> = {
  approved: 'bg-green-700 border-green-800 text-white',
  pending: 'bg-orange-500 border-orange-600 text-white',
  completed: 'bg-blue-600 border-blue-700 text-white',
  rejected: 'bg-red-400 border-red-500 text-white',
  cancelled: 'bg-gray-400 border-gray-500 text-white',
};

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function getTop(datetime: string): number {
  const d = new Date(datetime);
  const minutes = d.getHours() * 60 + d.getMinutes() - START_HOUR * 60;
  return Math.max(0, (minutes / 30) * SLOT_HEIGHT);
}

function getHeight(start: string, end: string): number {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(SLOT_HEIGHT * 0.75, (ms / 1800000) * SLOT_HEIGHT);
}

function slotToLocal(dateStr: string, slotIndex: number): string {
  const h = Math.floor(slotIndex / 2) + START_HOUR;
  const m = slotIndex % 2 === 0 ? '00' : '30';
  return `${dateStr}T${String(h).padStart(2, '0')}:${m}`;
}

function addHour(datetimeLocal: string): string {
  const d = new Date(datetimeLocal);
  d.setHours(d.getHours() + 1);
  return `${toDateStr(d)}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// ─── Mini Calendar ───────────────────────────────────────────────
function MiniCalendar({ year, month, selected, today, onSelect }: {
  year: number; month: number; selected: Date; today: Date; onSelect: (d: Date) => void;
}) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="text-[11px] select-none">
      <div className="text-center font-semibold text-slate-600 mb-1 whitespace-nowrap">
        {MONTHS_TH[month]} {year + 543}
      </div>
      <div className="grid grid-cols-7">
        {DAY_SHORT.map(d => (
          <div key={d} className="w-7 text-center text-slate-400 font-medium pb-0.5">{d}</div>
        ))}
        {cells.map((day, i) => {
          if (!day) return <div key={i} className="w-7 h-6" />;
          const date = new Date(year, month, day);
          const isSel = isSameDay(date, selected);
          const isTod = isSameDay(date, today);
          return (
            <button key={i} onClick={() => onSelect(date)}
              className={`w-7 h-6 rounded-full flex items-center justify-center transition-colors
                ${isSel ? 'bg-red-500 text-white font-bold' :
                  isTod ? 'border border-red-500 text-red-600 font-bold' :
                  'text-slate-700 hover:bg-slate-100'}`}>
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Booking Modal ───────────────────────────────────────────────
function BookingModal({ vehicle, startLocal, onClose, onSuccess }: {
  vehicle: Vehicle;
  startLocal: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    purpose: '',
    destination: '',
    passenger_count: '1',
    end_datetime: addHour(startLocal),
    notes: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/bookings', {
        vehicle_id: vehicle.id,
        purpose: form.purpose,
        destination: form.destination || undefined,
        passenger_count: Number(form.passenger_count),
        start_datetime: startLocal + ':00',
        end_datetime: form.end_datetime + ':00',
        notes: form.notes || undefined,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'เกิดข้อผิดพลาด');
    } finally {
      setSubmitting(false);
    }
  };

  const startDisplay = new Date(startLocal).toLocaleTimeString('th', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{vehicleTypeIcon[vehicle.type] || '🚗'}</span>
            <div>
              <p className="font-semibold text-slate-900 text-sm">{vehicle.name}</p>
              <p className="text-xs text-slate-500">{vehicle.license_plate} · เริ่ม {startDisplay}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-xs">
              <AlertCircle size={14} className="flex-shrink-0" />{error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">วันเวลาสิ้นสุด *</label>
            <input type="datetime-local" required
              value={form.end_datetime}
              min={startLocal}
              onChange={e => setForm(f => ({ ...f, end_datetime: e.target.value }))}
              className="w-full border border-slate-400 rounded-lg px-3 py-2 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">วัตถุประสงค์ *</label>
            <input type="text" required placeholder="เช่น ติดต่องาน, ประชุม..."
              value={form.purpose}
              onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))}
              autoFocus
              className="w-full border border-slate-400 rounded-lg px-3 py-2 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">ปลายทาง</label>
              <input type="text" placeholder="สถานที่"
                value={form.destination}
                onChange={e => setForm(f => ({ ...f, destination: e.target.value }))}
                className="w-full border border-slate-400 rounded-lg px-3 py-2 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">จำนวนผู้โดยสาร</label>
              <input type="number" min="1" max="20"
                value={form.passenger_count}
                onChange={e => setForm(f => ({ ...f, passenger_count: e.target.value }))}
                className="w-full border border-slate-400 rounded-lg px-3 py-2 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">หมายเหตุ</label>
            <textarea rows={2} placeholder="รายละเอียดเพิ่มเติม..."
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="w-full border border-slate-400 rounded-lg px-3 py-2 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 border border-slate-200 text-slate-600 py-2.5 rounded-lg hover:bg-slate-50 text-sm font-medium transition-colors">
              ยกเลิก
            </button>
            <button type="submit" disabled={submitting}
              className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 text-sm font-medium transition-colors">
              {submitting ? 'กำลังส่ง...' : 'ยืนยันการจอง'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────
export default function CalendarPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [selected, setSelected] = useState(() => new Date());
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<{ vehicle: Vehicle; startLocal: string } | null>(null);
  const today = new Date();

  useEffect(() => {
    api.get('/vehicles')
      .then(r => setVehicles((r.data as Vehicle[]).filter(v => v.is_active)));
  }, []);

  const fetchTimeline = useCallback((date: Date) => {
    setLoading(true);
    api.get('/bookings/timeline', { params: { date: toDateStr(date) } })
      .then(r => setBookings(r.data))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchTimeline(selected); }, [selected, fetchTimeline]);

  const goDay = (delta: number) => {
    const d = new Date(selected);
    d.setDate(d.getDate() + delta);
    setSelected(d);
  };

  const thaiHeader = () => {
    const y = selected.getFullYear() + 543;
    return `${DAY_TH[selected.getDay()]} ${selected.getDate()} ${MONTHS_TH[selected.getMonth()]} ${y}`;
  };

  const bookingsFor = (vid: number) => bookings.filter(b => b.vehicle_id === vid);

  const handleSlotClick = (vehicle: Vehicle, slotIndex: number) => {
    if (!user) { router.push('/login'); return; }
    const startLocal = slotToLocal(toDateStr(selected), slotIndex);
    setModal({ vehicle, startLocal });
  };

  const miniMonths = [-1, 0, 1].map(offset => {
    const d = new Date(selected.getFullYear(), selected.getMonth() + offset, 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const NavRow = () => (
    <div className="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden text-sm font-medium">
      <button onClick={() => goDay(-1)}
        className="flex items-center gap-1 px-4 py-2 text-slate-600 hover:bg-slate-50 border-r border-slate-200 transition-colors">
        <ChevronLeft size={15} /> ก่อนหน้า
      </button>
      <span className="flex-1 text-center text-slate-500 py-2 cursor-default">วันที่</span>
      <button onClick={() => goDay(1)}
        className="flex items-center gap-1 px-4 py-2 text-slate-600 hover:bg-slate-50 border-l border-slate-200 transition-colors">
        ถัดไป <ChevronRight size={15} />
      </button>
    </div>
  );

  return (
    <AppLayout requireAuth={false}>
      <div className="space-y-3">

        {/* Top bar */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">ตารางการจองรถ</h1>
            <p className="text-slate-500 text-sm">คลิกช่องว่างเพื่อจองรถ</p>
          </div>
          <Link href="/bookings/new"
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
            <Plus size={16} /> จองรถ
          </Link>
        </div>

        {/* Mini calendars */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-3">
          <div className="flex gap-5 overflow-x-auto pb-1 justify-end">
            {miniMonths.map(({ year, month }) => (
              <MiniCalendar key={`${year}-${month}`}
                year={year} month={month}
                selected={selected} today={today}
                onSelect={setSelected} />
            ))}
          </div>
        </div>

        {/* Date heading */}
        <div className="text-center text-lg font-bold text-slate-800">{thaiHeader()}</div>

        {/* Nav top */}
        <NavRow />

        {/* Timeline grid */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-7 h-7 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="min-w-[600px]">
              {/* Vehicle header */}
              <div className="flex bg-slate-700 text-white sticky top-0 z-20">
                <div className="w-16 flex-shrink-0 border-r border-slate-600 flex items-center justify-center text-xs font-bold py-3">
                  เวลา
                </div>
                {vehicles.map(v => (
                  <div key={v.id}
                    className="flex-1 border-r border-slate-600 last:border-r-0 text-center py-2 px-1">
                    <div className="text-sm font-semibold leading-tight">{v.name}</div>
                    <div className="text-xs text-slate-300 mt-0.5">
                      [{v.license_plate}] ({v.capacity})
                    </div>
                  </div>
                ))}
              </div>

              {/* Body */}
              <div className="flex" style={{ height: TOTAL_HEIGHT }}>
                {/* Time axis */}
                <div className="w-16 flex-shrink-0 border-r border-slate-200">
                  {TIME_SLOTS.map((t, i) => (
                    <div key={t}
                      style={{ height: SLOT_HEIGHT }}
                      className={`flex items-center justify-center text-[11px] border-b
                        ${i % 2 === 0 ? 'text-slate-600 border-slate-200 font-medium' : 'text-slate-400 border-slate-100'}`}>
                      {t}
                    </div>
                  ))}
                </div>

                {/* Vehicle columns */}
                {vehicles.map(v => (
                  <div key={v.id} className="flex-1 relative border-r border-slate-200 last:border-r-0">
                    {/* Clickable grid slots */}
                    {TIME_SLOTS.map((t, i) => (
                      <div key={t}
                        style={{ height: SLOT_HEIGHT }}
                        onClick={() => handleSlotClick(v, i)}
                        className={`border-b cursor-pointer transition-colors group ${i % 2 === 0
                          ? 'bg-white border-slate-200 hover:bg-blue-50'
                          : 'bg-slate-50/60 border-slate-100 hover:bg-blue-50'}`}>
                        <span className="hidden group-hover:flex items-center justify-center h-full text-[10px] text-blue-400 select-none">
                          + จอง {t}
                        </span>
                      </div>
                    ))}

                    {/* Booking blocks */}
                    {bookingsFor(v.id).map(b => {
                      const top = getTop(b.start_datetime);
                      const height = getHeight(b.start_datetime, b.end_datetime);
                      const cls = STATUS_STYLE[b.status] ?? STATUS_STYLE.pending;
                      const startTime = new Date(b.start_datetime).toLocaleTimeString('th', { hour: '2-digit', minute: '2-digit' });
                      const endTime = new Date(b.end_datetime).toLocaleTimeString('th', { hour: '2-digit', minute: '2-digit' });
                      return (
                        <Link key={b.id} href={`/bookings/${b.id}`}
                          onClick={e => e.stopPropagation()}
                          className={`absolute inset-x-0.5 rounded border overflow-hidden ${cls} hover:brightness-110 transition-all z-10 flex flex-col px-1.5 py-0.5`}
                          style={{ top, height: Math.max(height, 18) }}
                          title={`${b.purpose} | ${b.user_name} | ${startTime}–${endTime}`}>
                          <span className="text-[11px] font-semibold leading-tight truncate">{b.purpose}</span>
                          {height >= SLOT_HEIGHT * 1.5 && (
                            <span className="text-[10px] opacity-80 truncate leading-tight">{b.user_name}</span>
                          )}
                          {height >= SLOT_HEIGHT * 2.5 && b.destination && (
                            <span className="text-[10px] opacity-75 truncate leading-tight">{b.destination}</span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Nav bottom */}
        <NavRow />

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-xs text-slate-600 px-1">
          {[
            { cls: 'bg-green-700', label: 'อนุมัติแล้ว' },
            { cls: 'bg-orange-500', label: 'รออนุมัติ' },
            { cls: 'bg-blue-600', label: 'เสร็จสิ้น' },
            { cls: 'bg-gray-400', label: 'ยกเลิก/ปฏิเสธ' },
          ].map(({ cls, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className={`w-3.5 h-3.5 rounded-sm ${cls}`} />
              {label}
            </div>
          ))}
        </div>

      </div>

      {/* Booking modal */}
      {modal && (
        <BookingModal
          vehicle={modal.vehicle}
          startLocal={modal.startLocal}
          onClose={() => setModal(null)}
          onSuccess={() => { setModal(null); fetchTimeline(selected); }}
        />
      )}
    </AppLayout>
  );
}
