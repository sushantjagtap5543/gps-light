# GeoSurePath

GeoSurePath is a next-generation GPS Tracking and Fleet SaaS Platform designed exclusively for high-speed metrics, AI-driven driver scoring, and complete reseller (white-label) hierarchy management.

![GeoSurePath Logo](./logo.png)

## Overview
Built with reactivity in mind, **GeoSurePath** replaces legacy 30-second API polling with genuine Zero-Delay WebSocket tracing to guarantee real-time visibility for commercial logistics operations.

### Key Features
*   **Zero-Delay Real-Time Map:** Seamless live vehicle plotting.
*   **Full Multi-Tenant Reseller Platform:** White label the entire interface (DNS, brand colors, logo) at an administrative level.
*   **Integrated Map Toolkit:** Draw Geofences *directly* on the live map canvas, measure distances, toggle Satellite/Dark/Street/Traffic layers.
*   **AIS-140 Compliance Ready:** Built-in Vahan/BSNL Server dual-IP forwarding configurations.
*   **Intelligent Immobilizer Check:** Engine cut-offs natively blocked if the vehicle's speed is dangerously high.

---

## 🚀 Deployment Guide: GitHub & AWS Lightsail

This guide will walk you through deploying the GeoSurePath frontend and preparing the infrastructure using an AWS Lightsail instance (Ubuntu/Node.js).

### Step 1: Pushing to GitHub
1. Initialize your local directory as a Git repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit for GeoSurePath"
   ```
2. Create a new repository on GitHub.
3. Link and push your local code:
   ```bash
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/geo-sure-path.git
   git push -u origin main
   ```

### Step 2: Provisioning AWS Lightsail
1. Log into your **AWS Console** and navigate to **Lightsail**.
2. Click **Create instance**.
3. Select **Linux/Unix** platform and choose the **Node.js** blueprint (or Ubuntu 22.04 if you prefer a clean slate).
4. Choose an instance plan (e.g., $5 to $10/month plan is sufficient for the frontend).
5. Name your instance `geosurepath-prod` and click **Create instance**.

### Step 3: Server Configuration & Deployment
1. Connect to your Lightsail instance via the browser-based SSH terminal.
2. Clone your repository onto the server:
   ```bash
   git clone https://github.com/YOUR_USERNAME/geo-sure-path.git
   cd geo-sure-path/frontend
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Build the production React/Vite app:
   ```bash
   npm run build
   ```
5. Install `pm2` and `serve` to daemonize the application:
   ```bash
   sudo npm install -g pm2 serve
   pm2 start serve --name "geosurepath" -- -s dist -l 80
   pm2 startup
   pm2 save
   ```
   *Note: Using port 80 requires elevated privileges or reverse proxy setups like Nginx. The easiest production setup is installing Nginx, configuring the root to `/home/ubuntu/geo-sure-path/frontend/dist`, and setting up SSL.*

### Step 4: Setting up Nginx + SSL (Recommended)
1. Install Nginx:
   ```bash
   sudo apt update && sudo apt install nginx -y
   ```
2. Create an Nginx config file (`/etc/nginx/sites-available/geosurepath`):
   ```nginx
   server {
       listen 80;
       server_name tracking.geosurepath.com; # Replace with your domain
       root /home/ubuntu/geo-sure-path/frontend/dist;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }
   }
   ```
3. Link the config and restart:
   ```bash
   sudo ln -s /etc/nginx/sites-available/geosurepath /etc/nginx/sites-enabled/
   sudo systemctl restart nginx
   ```
4. Generate Free SSL Certificate via Certbot:
   ```bash
   sudo apt install certbot python3-certbot-nginx -y
   sudo certbot --nginx -d tracking.geosurepath.com
   ```

Your platform should now be live and secure!

---

## 📜 Development Commands
To work on this repository locally:

```bash
cd frontend
npm install
npm run dev
```
