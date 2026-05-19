import { Request, Response } from 'express';
import { pool } from '../config/database';

export async function getVehicles(_req: Request, res: Response) {
  const [rows] = await pool.query(
    'SELECT * FROM vehicles WHERE is_active = TRUE ORDER BY type, name'
  ) as any[];
  return res.json(rows);
}

export async function getVehicle(req: Request, res: Response) {
  const [rows] = await pool.query('SELECT * FROM vehicles WHERE id = ?', [req.params.id]) as any[];
  if (!rows[0]) return res.status(404).json({ message: 'ไม่พบรถ' });
  return res.json(rows[0]);
}

export async function createVehicle(req: Request, res: Response) {
  const { name, license_plate, type, color, capacity, description } = req.body;
  if (!name || !license_plate || !type) {
    return res.status(400).json({ message: 'กรุณากรอกข้อมูลที่จำเป็น' });
  }
  const [result] = await pool.query(
    'INSERT INTO vehicles (name, license_plate, type, color, capacity, description) VALUES (?,?,?,?,?,?)',
    [name, license_plate, type, color || null, capacity || 5, description || null]
  ) as any[];
  return res.status(201).json({ id: result.insertId, message: 'เพิ่มรถสำเร็จ' });
}

export async function updateVehicle(req: Request, res: Response) {
  const { name, license_plate, type, color, capacity, description, is_active } = req.body;
  const fields: string[] = [];
  const values: any[] = [];
  if (name) { fields.push('name = ?'); values.push(name); }
  if (license_plate) { fields.push('license_plate = ?'); values.push(license_plate); }
  if (type) { fields.push('type = ?'); values.push(type); }
  if (color !== undefined) { fields.push('color = ?'); values.push(color); }
  if (capacity !== undefined) { fields.push('capacity = ?'); values.push(capacity); }
  if (description !== undefined) { fields.push('description = ?'); values.push(description); }
  if (is_active !== undefined) { fields.push('is_active = ?'); values.push(is_active); }
  if (!fields.length) return res.status(400).json({ message: 'ไม่มีข้อมูลที่ต้องการแก้ไข' });
  values.push(req.params.id);
  await pool.query(`UPDATE vehicles SET ${fields.join(', ')} WHERE id = ?`, values);
  return res.json({ message: 'อัปเดตรถสำเร็จ' });
}

export async function deleteVehicle(req: Request, res: Response) {
  await pool.query('UPDATE vehicles SET is_active = FALSE WHERE id = ?', [req.params.id]);
  return res.json({ message: 'ลบรถสำเร็จ' });
}

export async function getVehicleAvailability(req: Request, res: Response) {
  const { start, end } = req.query;
  if (!start || !end) return res.status(400).json({ message: 'กรุณาระบุช่วงเวลา' });
  const [booked] = await pool.query(
    `SELECT DISTINCT vehicle_id FROM bookings
     WHERE status IN ('pending','approved')
     AND NOT (end_datetime <= ? OR start_datetime >= ?)`,
    [start, end]
  ) as any[];
  const bookedIds = booked.map((b: any) => b.vehicle_id);
  const [vehicles] = await pool.query('SELECT * FROM vehicles WHERE is_active = TRUE') as any[];
  return res.json((vehicles as any[]).map((v: any) => ({ ...v, available: !bookedIds.includes(v.id) })));
}
