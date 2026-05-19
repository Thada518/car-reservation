import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO } from 'date-fns';
import { th } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateTime(dateStr: string) {
  return format(parseISO(dateStr), 'dd MMM yyyy HH:mm', { locale: th });
}

export function formatDate(dateStr: string) {
  return format(parseISO(dateStr), 'dd MMM yyyy', { locale: th });
}

export function formatTime(dateStr: string) {
  return format(parseISO(dateStr), 'HH:mm');
}

export const statusLabel: Record<string, string> = {
  pending: 'รอดำเนินการ',
  approved: 'อนุมัติแล้ว',
  rejected: 'ปฏิเสธ',
  cancelled: 'ยกเลิก',
  completed: 'เสร็จสิ้น',
};

export const statusColor: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  approved: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
  cancelled: 'bg-gray-100 text-gray-600 border-gray-200',
  completed: 'bg-blue-100 text-blue-800 border-blue-200',
};

export const vehicleTypeLabel: Record<string, string> = {
  pickup: 'รถกระบะ',
  van: 'รถตู้',
  sedan: 'รถเก๋ง',
};

export const vehicleTypeIcon: Record<string, string> = {
  pickup: '🛻',
  van: '🚐',
  sedan: '🚗',
};

export const roleLabel: Record<string, string> = {
  admin: 'ผู้ดูแลระบบ',
  approver: 'ผู้อนุมัติ',
  user: 'พนักงาน',
};
