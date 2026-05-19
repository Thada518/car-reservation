import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const socketPath = process.env.DB_SOCKET || '';

export const pool = mysql.createPool({
  ...(socketPath
    ? { socketPath }
    : { host: process.env.DB_HOST || 'localhost', port: Number(process.env.DB_PORT) || 3306 }),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'car_reservation',
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4',
});

export async function testConnection() {
  const conn = await pool.getConnection();
  console.log('✅ Database connected');
  conn.release();
}
