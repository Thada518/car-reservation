CREATE DATABASE IF NOT EXISTS car_reservation CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE car_reservation;

CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  employee_id VARCHAR(20) UNIQUE,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100),
  phone VARCHAR(20),
  department VARCHAR(100),
  role ENUM('admin','approver','user') DEFAULT 'user',
  is_active BOOLEAN DEFAULT TRUE,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vehicles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  license_plate VARCHAR(20) UNIQUE NOT NULL,
  type ENUM('pickup','van','sedan') NOT NULL,
  color VARCHAR(50),
  capacity INT DEFAULT 5,
  description TEXT,
  image_url VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bookings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  vehicle_id INT NOT NULL,
  user_id INT NOT NULL,
  purpose VARCHAR(255) NOT NULL,
  destination VARCHAR(255),
  passenger_count INT DEFAULT 1,
  start_datetime DATETIME NOT NULL,
  end_datetime DATETIME NOT NULL,
  status ENUM('pending','approved','rejected','cancelled','completed') DEFAULT 'pending',
  approved_by INT,
  approved_at TIMESTAMP NULL,
  rejection_reason TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Seed admin user (password: password)
INSERT INTO users (employee_id, username, password_hash, full_name, email, department, role) VALUES
('EMP001', 'admin', '$2a$10$Jl61HuMt6v.jRY0fRz2CTOoypLCdFH7EuWfJb1BptexWQXHQJgj9G', 'ผู้ดูแลระบบ', 'admin@company.com', 'ธุรการ', 'admin'),
('EMP002', 'approver1', '$2a$10$Jl61HuMt6v.jRY0fRz2CTOoypLCdFH7EuWfJb1BptexWQXHQJgj9G', 'ผู้อนุมัติ 1', 'approver1@company.com', 'ธุรการ', 'approver');

-- Seed vehicles
INSERT INTO vehicles (name, license_plate, type, color, capacity, description) VALUES
('กระบะ คันที่ 1', '1ฒฬ-6401', 'pickup', 'ขาว', 5, 'รถกระบะ หมายเลขทะเบียน 1ฒฬ-6401'),
('กระบะ คันที่ 2', '1ฒอ-257', 'pickup', 'เงิน', 5, 'รถกระบะ หมายเลขทะเบียน 1ฒอ-257'),
('รถตู้', 'ฮง-8907', 'van', 'ขาว', 12, 'รถตู้ หมายเลขทะเบียน ฮง-8907'),
('รถเก๋ง', '3กฉ-3916', 'sedan', 'ดำ', 5, 'รถเก๋ง หมายเลขทะเบียน 3กฉ-3916');
