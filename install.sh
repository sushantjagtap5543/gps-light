#!/bin/bash

# GeoSurePath Master Installation Script
# This script handles end-to-end installation of all prerequisites, database setup,
# and application deployment on an Ubuntu system (AWS Lightsail recommended).
# Increased timeouts and strict sequential execution ensure stability.

set -e # Exit immediately if a command exits with a non-zero status

echo "=========================================================="
echo " Starting GeoSurePath Master Installation & Deployment... "
echo "=========================================================="

# 0. Clean Existing Deployments
echo "[0/9] Cleaning up old deployments, processes, and build files..."
if command -v pm2 &> /dev/null; then
    pm2 delete all || true
    pm2 save --force || true
fi
rm -rf tcp-server/node_modules backend/node_modules frontend/node_modules frontend/dist

# 1. System Updates & Essential Tools
echo "[1/8] Updating system packages and installing curl, git, ufw..."
sudo apt-get update -y
sudo apt-get upgrade -y
sudo apt-get install -y curl git ufw build-essential

# 2. Install Node.js (LTS)
echo "[2/9] Installing Node.js (v20 LTS)..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
echo "Node.js version: $(node -v)"
echo "npm version: $(npm -v)"

# 3. Install Redis Server
echo "[3/8] Installing Redis Server..."
sudo apt-get install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server

# 4. Install PostgreSQL & PostGIS
echo "[4/9] Installing PostgreSQL and PostGIS..."
sudo apt-get install -y postgresql postgresql-contrib postgis
sudo systemctl enable postgresql
sudo systemctl start postgresql

echo "[4.5/9] Securing DB and setting up schema (Waiting 10 seconds for DB init)..."
sleep 10
sudo -u postgres psql -c "CREATE USER gps_admin WITH PASSWORD 'gps_strong_password';" || true
sudo -u postgres psql -c "CREATE DATABASE gps_saas OWNER gps_admin;" || true
sudo -u postgres psql -d gps_saas -c "CREATE EXTENSION IF NOT EXISTS postgis;"
sudo -u postgres psql -d gps_saas -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"

# Apply Schema (Assuming script is run from project root)
if [ -f "database/schema.sql" ]; then
    echo "Applying database schema..."
    sudo -u postgres psql -d gps_saas -f database/schema.sql
else
    echo "WARNING: database/schema.sql not found. You will need to apply it manually."
fi

# 5. Install PM2 globally
echo "[5/9] Installing PM2 and build tools globally..."
sudo npm install -g pm2 npm-run-all
# Increase npm timeout to prevent hanging on slow connections
npm config set fetch-retry-maxtimeout 1200000

# 6. Build & Setup Backend and TCP Server
echo "[6/9] Installing dependencies for Backend and TCP Server..."

cd tcp-server
rm -rf node_modules
npm install --fetch-timeout=600000
cd ../backend
rm -rf node_modules
npm install --fetch-timeout=600000
cd ..

# 7. Build Frontend
echo "[7/9] Installing and Building Frontend (React/Vite)..."
cd frontend
rm -rf node_modules dist
npm install --fetch-timeout=600000
npm run build
cd ..

# 8. Setup Nginx & PM2 Daemons
echo "[8/9] Installing Nginx and mapping Daemons..."
sudo apt-get install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx

# Start Node processes
pm2 start backend/src/app.js --name "geosurepath-api"
TCP_PORT=5023 pm2 start tcp-server/src/server.js --name "geosurepath-tcp"

# Serve frontend using PM2
pm2 serve frontend/dist 3000 --name "geosurepath-frontend" --spa

pm2 save
pm2 startup | sudo bash

# 9. Setup Daily Autobackup
echo "[9/9] Setting up daily autobackup for PostgreSQL..."
sudo mkdir -p /var/backups/gps_saas
sudo chown postgres:postgres /var/backups/gps_saas

sudo bash -c 'cat << '\''EOF'\'' > /usr/local/bin/gps_db_backup.sh
#!/bin/bash
BACKUP_DIR="/var/backups/gps_saas"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
sudo -u postgres pg_dump -d gps_saas -F c -f "$BACKUP_DIR/db_backup_$TIMESTAMP.dump"
# Keep only last 7 days of backups
find $BACKUP_DIR -type f -name "*.dump" -mtime +7 -delete
EOF'

sudo chmod +x /usr/local/bin/gps_db_backup.sh

# Add to root crontab to run daily at 2 AM
(sudo crontab -l 2>/dev/null | grep -v "gps_db_backup.sh"; echo "0 2 * * * /usr/local/bin/gps_db_backup.sh") | sudo crontab -

echo "=========================================================="
echo " Installation Complete! "
echo " Services Running:"
echo " - PostgreSQL (5432)"
echo " - Redis (6379)"
echo " - TCP Server (5023)"
echo " - API Server (8080)"
echo " - Frontend app (3000)"
echo " - Daily DB Backup Job Scheduled (02:00 AM)"
echo " Please configure Nginx reverse proxy to expose PORT 3000 to 80."
echo "=========================================================="
