import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../config/database';
import { AuthRequest } from '../middleware/auth';

export async function getUsers(_req: Request, res: Response) {
  const [rows] = await pool.query(
    'SELECT id, employee_id, username, full_name, email, phone, department, role, is_active, created_at FROM users ORDER BY created_at DESC'
  ) as any[];
  return res.json(rows);
}

export async function getUser(req: Request, res: Response) {
  const [rows] = await pool.query(
    'SELECT id, employee_id, username, full_name, email, phone, department, role, is_active, created_at FROM users WHERE id = ?',
    [req.params.id]
  ) as any[];
  if (!rows[0]) return res.status(404).json({ message: 'ไม่พบผู้ใช้' });
  return res.json(rows[0]);
}

export async function createUser(req: AuthRequest, res: Response) {
  const { employee_id, username, password, full_name, email, phone, department, role } = req.body;
  if (!username || !password || !full_name) {
    return res.status(400).json({ message: 'กรุณากรอกข้อมูลที่จำเป็น' });
  }
  const hash = await bcrypt.hash(password, 10);
  const [result] = await pool.query(
    'INSERT INTO users (employee_id, username, password_hash, full_name, email, phone, department, role, created_by) VALUES (?,?,?,?,?,?,?,?,?)',
    [employee_id || null, username, hash, full_name, email || null, phone || null, department || null, role || 'user', req.user!.id]
  ) as any[];
  return res.status(201).json({ id: result.insertId, message: 'สร้างผู้ใช้สำเร็จ' });
}

export async function updateUser(req: AuthRequest, res: Response) {
  const { employee_id, full_name, email, phone, department, role, is_active, password } = req.body;
  const fields: string[] = [];
  const values: any[] = [];

  if (employee_id !== undefined) { fields.push('employee_id = ?'); values.push(employee_id); }
  if (full_name) { fields.push('full_name = ?'); values.push(full_name); }
  if (email !== undefined) { fields.push('email = ?'); values.push(email); }
  if (phone !== undefined) { fields.push('phone = ?'); values.push(phone); }
  if (department !== undefined) { fields.push('department = ?'); values.push(department); }
  if (role) { fields.push('role = ?'); values.push(role); }
  if (is_active !== undefined) { fields.push('is_active = ?'); values.push(is_active); }
  if (password) { fields.push('password_hash = ?'); values.push(await bcrypt.hash(password, 10)); }

  if (!fields.length) return res.status(400).json({ message: 'ไม่มีข้อมูลที่ต้องการแก้ไข' });

  values.push(req.params.id);
  await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
  return res.json({ message: 'อัปเดตผู้ใช้สำเร็จ' });
}

export async function deleteUser(req: AuthRequest, res: Response) {
  if (Number(req.params.id) === req.user!.id) {
    return res.status(400).json({ message: 'ไม่สามารถลบบัญชีตัวเองได้' });
  }
  await pool.query('UPDATE users SET is_active = FALSE WHERE id = ?', [req.params.id]);
  return res.json({ message: 'ลบผู้ใช้สำเร็จ' });
}
