#!/bin/bash
echo "Setting up car_reservation database..."
sudo mysql < /home/itokinco/api/car_reservation/database/schema.sql
echo "✅ Database setup complete!"

# Update backend .env with correct MySQL credentials (no password for root via socket)
cat > /home/itokinco/api/car_reservation/backend/.env << 'EOF'
PORT=4050
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=car_reservation
JWT_SECRET=car_reservation_jwt_secret_2024_itokin
JWT_EXPIRES_IN=24h
NODE_ENV=development
EOF
echo "✅ .env configured"
