import { Request, Response } from 'express';
import { pool } from '../config/database';
import { AuthRequest } from '../middleware/auth';

const bookingSelect = `
  b.id, b.purpose, b.destination, b.passenger_count,
  b.start_datetime, b.end_datetime, b.status, b.notes,
  b.rejection_reason, b.approved_at, b.created_at,
  u.id as user_id, u.full_name as user_name, u.department,
  v.id as vehicle_id, v.name as vehicle_name, v.license_plate, v.type as vehicle_type,
  a.full_name as approver_name
`;

export async function getBookings(req: AuthRequest, res: Response) {
  const { start, end, status, vehicle_id, user_id, search, page, limit } = req.query;
  const conditions: string[] = ['1=1'];
  const values: any[] = [];

  if (start) { conditions.push('b.start_datetime >= ?'); values.push(start); }
  if (end) { conditions.push('b.end_datetime <= ?'); values.push(end); }
  if (status) { conditions.push('b.status = ?'); values.push(status); }
  if (vehicle_id) { conditions.push('b.vehicle_id = ?'); values.push(vehicle_id); }
  if (search) {
    conditions.push('(b.purpose LIKE ? OR v.name LIKE ? OR u.full_name LIKE ?)');
    const like = `%${search}%`;
    values.push(like, like, like);
  }

  if (req.user?.role === 'user') {
    conditions.push('b.user_id = ?');
    values.push(req.user.id);
  } else if (user_id) {
    conditions.push('b.user_id = ?');
    values.push(user_id);
  }

  const pageNum = Math.max(1, parseInt(page as string) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(limit as string) || 30));
  const offset = (pageNum - 1) * pageSize;
  const where = conditions.join(' AND ');

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) as total FROM bookings b
     JOIN users u ON b.user_id = u.id
     JOIN vehicles v ON b.vehicle_id = v.id
     LEFT JOIN users a ON b.approved_by = a.id
     WHERE ${where}`,
    values
  ) as any[];

  const [rows] = await pool.query(
    `SELECT ${bookingSelect}
     FROM bookings b
     JOIN users u ON b.user_id = u.id
     JOIN vehicles v ON b.vehicle_id = v.id
     LEFT JOIN users a ON b.approved_by = a.id
     WHERE ${where}
     ORDER BY b.start_datetime DESC
     LIMIT ? OFFSET ?`,
    [...values, pageSize, offset]
  ) as any[];

  return res.json({ data: rows, total, page: pageNum, limit: pageSize });
}

export async function getBooking(req: AuthRequest, res: Response) {
  const [rows] = await pool.query(
    `SELECT ${bookingSelect}
     FROM bookings b
     JOIN users u ON b.user_id = u.id
     JOIN vehicles v ON b.vehicle_id = v.id
     LEFT JOIN users a ON b.approved_by = a.id
     WHERE b.id = ?`,
    [req.params.id]
  ) as any[];
  if (!rows[0]) return res.status(404).json({ message: 'ไม่พบการจอง' });
  const booking = rows[0];
  if (req.user?.role === 'user' && booking.user_id !== req.user.id) {
    return res.status(403).json({ message: 'ไม่มีสิทธิ์เข้าถึง' });
  }
  return res.json(booking);
}

export async function createBooking(req: AuthRequest, res: Response) {
  const { vehicle_id, purpose, destination, passenger_count, start_datetime, end_datetime, notes } = req.body;
  if (!vehicle_id || !purpose || !start_datetime || !end_datetime) {
    return res.status(400).json({ message: 'กรุณากรอกข้อมูลที่จำเป็น' });
  }
  if (new Date(start_datetime) >= new Date(end_datetime)) {
    return res.status(400).json({ message: 'เวลาเริ่มต้นต้องน้อยกว่าเวลาสิ้นสุด' });
  }

  const [conflict] = await pool.query(
    `SELECT id FROM bookings WHERE vehicle_id = ? AND status IN ('pending','approved')
     AND NOT (end_datetime <= ? OR start_datetime >= ?)`,
    [vehicle_id, start_datetime, end_datetime]
  ) as any[];
  if ((conflict as any[]).length > 0) {
    return res.status(409).json({ message: 'รถคันนี้มีการจองในช่วงเวลาดังกล่าวแล้ว' });
  }

  const [result] = await pool.query(
    'INSERT INTO bookings (vehicle_id, user_id, purpose, destination, passenger_count, start_datetime, end_datetime, notes) VALUES (?,?,?,?,?,?,?,?)',
    [vehicle_id, req.user!.id, purpose, destination || null, passenger_count || 1, start_datetime, end_datetime, notes || null]
  ) as any[];
  return res.status(201).json({ id: (result as any).insertId, message: 'จองรถสำเร็จ รอการอนุมัติ' });
}

export async function updateBooking(req: AuthRequest, res: Response) {
  const [rows] = await pool.query('SELECT * FROM bookings WHERE id = ?', [req.params.id]) as any[];
  const booking = rows[0];
  if (!booking) return res.status(404).json({ message: 'ไม่พบการจอง' });
  if (req.user!.role === 'user' && booking.user_id !== req.user!.id) {
    return res.status(403).json({ message: 'ไม่มีสิทธิ์แก้ไข' });
  }
  if (booking.status !== 'pending') {
    return res.status(400).json({ message: 'ไม่สามารถแก้ไขการจองที่ดำเนินการแล้ว' });
  }

  const { vehicle_id, purpose, destination, passenger_count, start_datetime, end_datetime, notes } = req.body;
  await pool.query(
    `UPDATE bookings SET vehicle_id=COALESCE(?,vehicle_id), purpose=COALESCE(?,purpose),
     destination=COALESCE(?,destination), passenger_count=COALESCE(?,passenger_count),
     start_datetime=COALESCE(?,start_datetime), end_datetime=COALESCE(?,end_datetime),
     notes=COALESCE(?,notes) WHERE id = ?`,
    [vehicle_id, purpose, destination, passenger_count, start_datetime, end_datetime, notes, req.params.id]
  );
  return res.json({ message: 'อัปเดตการจองสำเร็จ' });
}

export async function cancelBooking(req: AuthRequest, res: Response) {
  const [rows] = await pool.query('SELECT * FROM bookings WHERE id = ?', [req.params.id]) as any[];
  const booking = rows[0];
  if (!booking) return res.status(404).json({ message: 'ไม่พบการจอง' });
  if (req.user!.role === 'user' && booking.user_id !== req.user!.id) {
    return res.status(403).json({ message: 'ไม่มีสิทธิ์ยกเลิก' });
  }
  if (!['pending', 'approved'].includes(booking.status)) {
    return res.status(400).json({ message: 'ไม่สามารถยกเลิกการจองนี้ได้' });
  }
  await pool.query('UPDATE bookings SET status = ? WHERE id = ?', ['cancelled', req.params.id]);
  return res.json({ message: 'ยกเลิกการจองสำเร็จ' });
}

export async function approveBooking(req: AuthRequest, res: Response) {
  const { comment } = req.body;
  const [rows] = await pool.query('SELECT * FROM bookings WHERE id = ?', [req.params.id]) as any[];
  const booking = rows[0];
  if (!booking) return res.status(404).json({ message: 'ไม่พบการจอง' });
  if (booking.status !== 'pending') {
    return res.status(400).json({ message: 'การจองนี้ไม่ได้อยู่ในสถานะรอดำเนินการ' });
  }
  await pool.query(
    'UPDATE bookings SET status = ?, approved_by = ?, approved_at = NOW(), notes = COALESCE(?, notes) WHERE id = ?',
    ['approved', req.user!.id, comment || null, req.params.id]
  );
  return res.json({ message: 'อนุมัติการจองสำเร็จ' });
}

export async function unapproveBooking(req: AuthRequest, res: Response) {
  const [rows] = await pool.query('SELECT * FROM bookings WHERE id = ?', [req.params.id]) as any[];
  const booking = rows[0];
  if (!booking) return res.status(404).json({ message: 'ไม่พบการจอง' });
  if (booking.status !== 'approved') {
    return res.status(400).json({ message: 'การจองนี้ไม่ได้อยู่ในสถานะอนุมัติแล้ว' });
  }
  await pool.query(
    'UPDATE bookings SET status = ?, approved_by = NULL, approved_at = NULL WHERE id = ?',
    ['pending', req.params.id]
  );
  return res.json({ message: 'ยกเลิกการอนุมัติสำเร็จ' });
}

export async function rejectBooking(req: AuthRequest, res: Response) {
  const { rejection_reason, comment } = req.body;
  const [rows] = await pool.query('SELECT * FROM bookings WHERE id = ?', [req.params.id]) as any[];
  const booking = rows[0];
  if (!booking) return res.status(404).json({ message: 'ไม่พบการจอง' });
  if (booking.status !== 'pending') {
    return res.status(400).json({ message: 'การจองนี้ไม่ได้อยู่ในสถานะรอดำเนินการ' });
  }
  await pool.query(
    'UPDATE bookings SET status = ?, approved_by = ?, approved_at = NOW(), rejection_reason = ? WHERE id = ?',
    ['rejected', req.user!.id, comment || rejection_reason || null, req.params.id]
  );
  return res.json({ message: 'ปฏิเสธการจองสำเร็จ' });
}

export async function getCalendarBookings(req: AuthRequest, res: Response) {
  const { start, end } = req.query;
  if (!start || !end) return res.status(400).json({ message: 'กรุณาระบุช่วงเวลา' });
  const conditions = ['b.start_datetime < ? AND b.end_datetime > ?', "b.status IN ('pending','approved','completed')"];
  const values: any[] = [end, start];
  if (req.user!.role === 'user') {
    conditions.push('b.user_id = ?');
    values.push(req.user!.id);
  }
  const [rows] = await pool.query(
    `SELECT b.id, b.purpose, b.start_datetime, b.end_datetime, b.status,
     v.name as vehicle_name, v.license_plate, v.type as vehicle_type,
     u.full_name as user_name, u.department
     FROM bookings b
     JOIN vehicles v ON b.vehicle_id = v.id
     JOIN users u ON b.user_id = u.id
     WHERE ${conditions.join(' AND ')}
     ORDER BY b.start_datetime`,
    values
  ) as any[];
  return res.json(rows);
}

export async function getTimelineBookings(req: AuthRequest, res: Response) {
  const { date } = req.query;
  if (!date) return res.status(400).json({ message: 'กรุณาระบุวันที่' });
  const start = `${date}T00:00:00`;
  const end = `${date}T23:59:59`;
  const [rows] = await pool.query(
    `SELECT b.id, b.vehicle_id, b.user_id, b.purpose, b.destination, b.passenger_count,
     b.start_datetime, b.end_datetime, b.status,
     v.name as vehicle_name, v.license_plate, v.type as vehicle_type, v.capacity,
     u.full_name as user_name, u.department
     FROM bookings b
     JOIN vehicles v ON b.vehicle_id = v.id
     JOIN users u ON b.user_id = u.id
     WHERE b.start_datetime < ? AND b.end_datetime > ?
     AND b.status IN ('pending','approved','completed')
     ORDER BY b.start_datetime`,
    [end, start]
  ) as any[];
  return res.json(rows);
}

export async function getDashboardStats(req: AuthRequest, res: Response) {
  const [pending] = await pool.query("SELECT COUNT(*) as count FROM bookings WHERE status = 'pending'") as any[];
  const [approved] = await pool.query("SELECT COUNT(*) as count FROM bookings WHERE status = 'approved'") as any[];
  const [today] = await pool.query(
    "SELECT COUNT(*) as count FROM bookings WHERE DATE(start_datetime) = CURDATE() AND status = 'approved'"
  ) as any[];
  const [vehicles] = await pool.query("SELECT COUNT(*) as count FROM vehicles WHERE is_active = TRUE") as any[];
  const [users] = await pool.query("SELECT COUNT(*) as count FROM users WHERE is_active = TRUE") as any[];
  const [recentBookings] = await pool.query(
    `SELECT b.id, b.purpose, b.start_datetime, b.end_datetime, b.status,
     v.name as vehicle_name, v.license_plate, u.full_name as user_name
     FROM bookings b JOIN vehicles v ON b.vehicle_id = v.id JOIN users u ON b.user_id = u.id
     ORDER BY b.created_at DESC LIMIT 5`
  ) as any[];
  return res.json({
    pending: pending[0].count,
    approved: approved[0].count,
    today: today[0].count,
    vehicles: vehicles[0].count,
    users: users[0].count,
    recentBookings
  });
}
