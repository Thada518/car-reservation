'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/Layout/AppLayout';
import api from '@/lib/api';
import { Booking } from '@/types';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday, isSameDay, parseISO } from 'date-fns';
import { th } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { statusColor, vehicleTypeIcon } from '@/lib/utils';

const MONTHS_TH = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
const DAYS_TH = ['อา','จ','อ','พ','พฤ','ศ','ส'];

export default function CalendarPage() {
  const [current, setCurrent] = useState(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Booking[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    setLoading(true);
    const start = format(startOfMonth(current), 'yyyy-MM-dd');
    const end = format(endOfMonth(current), 'yyyy-MM-dd') + 'T23:59:59';
    api.get('/bookings/calendar', { params: { start, end } })
      .then(r => setBookings(r.data))
      .finally(() => setLoading(false));
  }, [current]);

  const calStart = startOfWeek(startOfMonth(current), { weekStartsOn: 0 });
  const calEnd = endOfWeek(endOfMonth(current), { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const getBookingsForDay = (day: Date) =>
    bookings.filter(b => isSameDay(parseISO(b.start_datetime), day));

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    setSelected(getBookingsForDay(day));
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">ปฏิทินการจอง</h1>
            <p className="text-slate-500 text-sm mt-1">ดูตารางการจองรถแต่ละวัน</p>
          </div>
          <Link href="/bookings/new"
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
            <Plus size={16} />จองรถ
          </Link>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-slate-100">
            <button onClick={() => setCurrent(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <ChevronLeft size={20} className="text-slate-600" />
            </button>
            <h2 className="text-lg font-semibold text-slate-800">
              {MONTHS_TH[current.getMonth()]} {current.getFullYear() + 543}
            </h2>
            <button onClick={() => setCurrent(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <ChevronRight size={20} className="text-slate-600" />
            </button>
          </div>

          <div className="grid grid-cols-7 border-b border-slate-100">
            {DAYS_TH.map(d => (
              <div key={d} className="text-center text-xs font-semibold text-slate-500 py-3">{d}</div>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-48"><div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : (
            <div className="grid grid-cols-7">
              {days.map((day, i) => {
                const dayBookings = getBookingsForDay(day);
                const inMonth = isSameMonth(day, current);
                const today = isToday(day);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                return (
                  <div key={i} onClick={() => handleDayClick(day)}
                    className={`min-h-24 p-2 border-b border-r border-slate-100 cursor-pointer transition-colors
                      ${!inMonth ? 'bg-slate-50/50' : 'hover:bg-blue-50/50'}
                      ${isSelected ? 'bg-blue-50 ring-2 ring-inset ring-blue-500' : ''}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm mb-1 font-medium
                      ${today ? 'bg-blue-600 text-white' : !inMonth ? 'text-slate-300' : 'text-slate-700'}`}>
                      {format(day, 'd')}
                    </div>
                    <div className="space-y-0.5">
                      {dayBookings.slice(0, 2).map(b => (
                        <div key={b.id} className={`text-xs px-1.5 py-0.5 rounded truncate ${statusColor[b.status]}`}>
                          {vehicleTypeIcon[b.vehicle_type]} {b.vehicle_name.replace('รถ', '').trim()}
                        </div>
                      ))}
                      {dayBookings.length > 2 && (
                        <div className="text-xs text-slate-400 pl-1">+{dayBookings.length - 2} อื่นๆ</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {selectedDate && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
            <h3 className="font-semibold text-slate-800 mb-4">
              การจองวันที่ {format(selectedDate, 'd MMMM yyyy', { locale: th })}
            </h3>
            {selected.length === 0 ? (
              <p className="text-slate-400 text-sm">ไม่มีการจองในวันนี้</p>
            ) : (
              <div className="space-y-3">
                {selected.map(b => (
                  <Link key={b.id} href={`/bookings/${b.id}`}
                    className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-200 rounded-lg transition-all">
                    <span className="text-xl">{vehicleTypeIcon[b.vehicle_type]}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{b.purpose}</p>
                      <p className="text-xs text-slate-500">{b.vehicle_name} · {format(parseISO(b.start_datetime), 'HH:mm')}–{format(parseISO(b.end_datetime), 'HH:mm')}</p>
                      <p className="text-xs text-slate-400">{b.user_name}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColor[b.status]}`}>{b.status}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
