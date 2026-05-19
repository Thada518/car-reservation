import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: { id: number; username: string; role: string; full_name: string };
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'ไม่มี Token กรุณาเข้าสู่ระบบ' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as AuthRequest['user'];
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: 'Token ไม่ถูกต้องหรือหมดอายุ' });
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'ต้องการสิทธิ์ Admin' });
  }
  next();
}

export function requireApprover(req: AuthRequest, res: Response, next: NextFunction) {
  if (!['admin', 'approver'].includes(req.user?.role || '')) {
    return res.status(403).json({ message: 'ต้องการสิทธิ์ Admin หรือ Approver' });
  }
  next();
}
