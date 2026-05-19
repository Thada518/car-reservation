'use client';
import { useEffect, useState } from 'react';
import AppLayout from '@/components/Layout/AppLayout';
import api from '@/lib/api';
import { Vehicle } from '@/types';
import { vehicleTypeIcon, vehicleTypeLabel } from '@/lib/utils';
import { Plus, Pencil, Trash2 } from 'lucide-react';

const EMPTY_FORM = { name: '', license_plate: '', type: 'pickup' as Vehicle['type'], color: '', capacity: '5', description: '' };

export default function AdminVehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    api.get('/vehicles').then(r => setVehicles(r.data)).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setError(''); setShowForm(true); };
  const openEdit = (v: Vehicle) => {
    setEditing(v);
    setForm({ name: v.name, license_plate: v.license_plate, type: v.type, color: v.color || '', capacity: String(v.capacity), description: v.description || '' });
    setError('');
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = { ...form, capacity: Number(form.capacity) };
      if (editing) { await api.put(`/vehicles/${editing.id}`, payload); }
      else { await api.post('/vehicles', payload); }
      setShowForm(false);
      load();
    } catch (err: any) { setError(err.response?.data?.message || 'เกิดข้อผิดพลาด'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (v: Vehicle) => {
    if (!confirm(`ยืนยันการลบรถ "${v.name}"?`)) return;
    await api.delete(`/vehicles/${v.id}`);
    load();
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">จัดการรถ</h1>
            <p className="text-slate-500 text-sm mt-1">เพิ่ม ลบ และแก้ไขข้อมูลรถยนต์</p>
          </div>
          <button onClick={openCreate}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
            <Plus size={16} />เพิ่มรถ
          </button>
        </div>

        {showForm && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <h2 className="font-semibold text-slate-800 mb-4">{editing ? 'แก้ไขรถ' : 'เพิ่มรถใหม่'}</h2>
            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2 mb-4">{error}</div>}
            <form onSubmit={handleSave} className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ชื่อรถ *</label>
                <input type="text" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ทะเบียนรถ *</label>
                <input type="text" required value={form.license_plate} onChange={e => setForm(f => ({ ...f, license_plate: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ประเภทรถ *</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as Vehicle['type'] }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  <option value="pickup">รถกระบะ</option>
                  <option value="van">รถตู้</option>
                  <option value="sedan">รถเก๋ง</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">สี</label>
                <input type="text" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">จำนวนที่นั่ง</label>
                <input type="number" min="1" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">คำอธิบาย</label>
                <input type="text" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="col-span-2 flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 border border-slate-200 text-slate-600 py-2 rounded-lg text-sm">ยกเลิก</button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700 disabled:bg-blue-300">
                  {saving ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loading ? (
            <div className="col-span-2 flex items-center justify-center h-48"><div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : vehicles.map(v => (
            <div key={v.id} className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 flex items-center gap-4">
              <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center text-3xl flex-shrink-0">
                {vehicleTypeIcon[v.type]}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-800">{v.name}</h3>
                <p className="text-sm text-slate-500">{v.license_plate} · {vehicleTypeLabel[v.type]}</p>
                {v.color && <p className="text-xs text-slate-400">สี{v.color} · {v.capacity} ที่นั่ง</p>}
                {v.description && <p className="text-xs text-slate-400 truncate">{v.description}</p>}
              </div>
              <div className="flex flex-col gap-2 flex-shrink-0">
                <button onClick={() => openEdit(v)} className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg"><Pencil size={16} /></button>
                <button onClick={() => handleDelete(v)} className="p-2 hover:bg-red-50 text-red-500 rounded-lg"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
