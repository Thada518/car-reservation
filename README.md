# ระบบจองรถ (Car Reservation System)

ระบบจองรถยนต์สำหรับองค์กร พัฒนาด้วย Node.js + Next.js + MySQL

## Tech Stack
- **Backend**: Node.js + Express + TypeScript (Port 4050)
- **Frontend**: Next.js 15 + Tailwind CSS (Port 3050)
- **Database**: MySQL/MariaDB
- **Process Manager**: PM2

## รถที่ให้บริการ
| รถ | ทะเบียน | ประเภท |
|---|---|---|
| กระบะ คันที่ 1 | 1ฒฬ-6401 | Pickup |
| กระบะ คันที่ 2 | 1ฒอ-257 | Pickup |
| รถตู้ | ฮง-8907 | Van |
| รถเก๋ง | 3กฉ-3916 | Sedan |

## สิทธิ์ผู้ใช้
- **Admin (ธุรการ)**: จัดการผู้ใช้, จัดการรถ, อนุมัติการจอง
- **Approver (ผู้อนุมัติ)**: อนุมัติ/ปฏิเสธการจอง
- **User (พนักงาน)**: จองรถ, ดูการจองของตน

## การติดตั้ง

### 1. ตั้งค่าฐานข้อมูล
```bash
sudo mysql < /tmp/setup_car_db.sql
sudo mysql car_reservation < database/schema.sql
```

### 2. ติดตั้ง Dependencies
```bash
cd backend && npm install
cd ../frontend && npm install
```

### 3. เริ่มต้นด้วย PM2
```bash
cd /home/itokinco/api/car_reservation
pm2 start ecosystem.config.js
pm2 save
```

## บัญชีเริ่มต้น
| ชื่อผู้ใช้ | รหัสผ่าน | สิทธิ์ |
|---|---|---|
| admin | password | Admin |
| approver1 | password | Approver |

> ⚠️ กรุณาเปลี่ยนรหัสผ่านหลังติดตั้ง

## URL
- Frontend: http://localhost:3050
- API: http://localhost:4050/api
- Health Check: http://localhost:4050/api/health
