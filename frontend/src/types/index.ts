export interface User {
  id: number;
  employee_id?: string;
  username: string;
  full_name: string;
  email?: string;
  phone?: string;
  department?: string;
  role: 'admin' | 'approver' | 'user';
  is_active: boolean;
  created_at: string;
}

export interface Vehicle {
  id: number;
  name: string;
  license_plate: string;
  type: 'pickup' | 'van' | 'sedan';
  color?: string;
  capacity: number;
  description?: string;
  is_active: boolean;
  available?: boolean;
}

export interface Booking {
  id: number;
  vehicle_id: number;
  vehicle_name: string;
  license_plate: string;
  vehicle_type: string;
  user_id: number;
  user_name: string;
  department?: string;
  purpose: string;
  destination?: string;
  passenger_count: number;
  start_datetime: string;
  end_datetime: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed';
  approved_at?: string;
  approver_name?: string;
  rejection_reason?: string;
  notes?: string;
  created_at: string;
}

export interface DashboardStats {
  pending: number;
  approved: number;
  today: number;
  vehicles: number;
  users: number;
  recentBookings: Booking[];
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}
