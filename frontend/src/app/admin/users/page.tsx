'use client';
import { useEffect, useState } from 'react';
import AppLayout from '@/components/Layout/AppLayout';
import api from '@/lib/api';
import { User } from '@/types';
import { roleLabel } from '@/lib/utils';
import { Plus, Pencil, Trash2, Shield, UserCheck, User as UserIcon, Search } from 'lucide-react';

const roleIcon = { admin: <Shield size={14} />, approver: <UserCheck size={14} />, user: <UserIcon size={14} /> };
const roleColor = { admin: 'bg-purple-100 text-purple-700', approver: 'bg-blue-100 text-blue-700', user: 'bg-slate-100 text-slate-600' };

const EMPTY_FORM = { employee_id: '', username: '', password: '', full_name: '', email: '', phone: '', department: '', role: 'user' as User['role'] };

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => api.get('/users').then(r => setUsers(r.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setError(''); setShowForm(true); };
  const openEdit = (u: User) => {
    setEditing(u);
    setForm({ employee_id: u.employee_id || '', username: u.username, password: '', full_name: u.full_name, email: u.email || '', phone: u.phone || '', department: u.department || '', role: u.role });
    setError('');
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload: any = { ...form };
      if (!payload.password) delete payload.password;
      if (editing) { await api.put(`/users/${editing.id}`, payload); }
      else { await api.post('/users', payload); }
      setShowForm(false);
      load();
    } catch (err: any) { setError(err.response?.data?.message || 'เกิดข้อผิดพลาด'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (u: User) => {
    if (!confirm(`ยืนยันการลบผู้ใช้ "${u.full_name}"?`)) return;
    await api.delete(`/users/${u.id}`);
    load();
  };

  const filtered = users.filter(u => !search || u.full_name.includes(search) || u.username.includes(search) || (u.department || '').includes(search));

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">จัดการผู้ใช้</h1>
            <p className="text-slate-500 text-sm mt-1">เพิ่ม ลบ และจัดการสิทธิ์ผู้ใช้</p>
          </div>
          <button onClick={openCreate}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
            <Plus size={16} />เพิ่มผู้ใช้
          </button>
        </div>

        {showForm && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <h2 className="font-semibold text-slate-800 mb-4">{editing ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้ใหม่'}</h2>
            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2 mb-4">{error}</div>}
            <form onSubmit={handleSave} className="grid grid-cols-2 gap-4">
              {[
                { key: 'employee_id', label: 'รหัสพนักงาน', type: 'text', required: false },
                { key: 'username', label: 'ชื่อผู้ใช้', type: 'text', required: !editing },
                { key: 'full_name', label: 'ชื่อ-นามสกุล', type: 'text', required: true },
                { key: 'password', label: editing ? 'รหัสผ่านใหม่ (เว้นว่างไม่เปลี่ยน)' : 'รหัสผ่าน', type: 'password', required: !editing },
                { key: 'email', label: 'อีเมล', type: 'email', required: false },
                { key: 'phone', label: 'เบอร์โทร', type: 'text', required: false },
                { key: 'department', label: 'แผนก', type: 'text', required: false },
              ].map(({ key, label, type, required }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
                  <input type={type} required={required}
                    value={(form as any)[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">สิทธิ์</label>
                <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as User['role'] }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  <option value="user">พนักงาน</option>
                  <option value="approver">ผู้อนุมัติ</option>
                  <option value="admin">ผู้ดูแลระบบ</option>
                </select>
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

        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="ค้นหาผู้ใช้..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['รหัสพนักงาน','ชื่อ-นามสกุล','ชื่อผู้ใช้','แผนก','สิทธิ์','สถานะ','จัดการ'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-600 px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8 text-slate-400">กำลังโหลด...</td></tr>
              ) : filtered.map(u => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-500">{u.employee_id || '-'}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{u.full_name}</td>
                  <td className="px-4 py-3 text-slate-600">{u.username}</td>
                  <td className="px-4 py-3 text-slate-500">{u.department || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${roleColor[u.role]}`}>
                      {roleIcon[u.role]}{roleLabel[u.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                      {u.is_active ? 'ใช้งาน' : 'ปิดใช้งาน'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(u)} className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg"><Pencil size={14} /></button>
                      <button onClick={() => handleDelete(u)} className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
