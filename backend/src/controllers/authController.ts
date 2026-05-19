import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database';
import { AuthRequest } from '../middleware/auth';

export async function login(req: Request, res: Response) {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' });
  }
  const [rows] = await pool.query(
    'SELECT * FROM users WHERE username = ? AND is_active = TRUE',
    [username]
  ) as any[];

  const user = rows[0];
  if (!user) return res.status(401).json({ message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role, full_name: user.full_name },
    process.env.JWT_SECRET!,
    { expiresIn: '24h' }
  );

  return res.json({
    token,
    user: { id: user.id, username: user.username, full_name: user.full_name, role: user.role, email: user.email, department: user.department }
  });
}

export async function getMe(req: AuthRequest, res: Response) {
  const [rows] = await pool.query(
    'SELECT id, employee_id, username, full_name, email, phone, department, role, is_active, created_at FROM users WHERE id = ?',
    [req.user!.id]
  ) as any[];
  return res.json(rows[0]);
}

export async function changePassword(req: AuthRequest, res: Response) {
  const { current_password, new_password } = req.body;
  const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.user!.id]) as any[];
  const user = rows[0];
  const valid = await bcrypt.compare(current_password, user.password_hash);
  if (!valid) return res.status(400).json({ message: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' });
  const hash = await bcrypt.hash(new_password, 10);
  await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.user!.id]);
  return res.json({ message: 'เปลี่ยนรหัสผ่านสำเร็จ' });
}
