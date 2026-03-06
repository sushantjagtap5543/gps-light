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

## 🚀 Automated Production Deployment (AWS Lightsail / Ubuntu)

Deploying the entire GeoSurePath stack (PostgreSQL, PostGIS, Redis, Node.js Backend, TCP Socket Server, Vite Frontend, PM2, Nginx) is now fully automated via a single master script.

### Prerequisites
1. Fresh **Ubuntu 22.04 or 24.04** server (AWS Lightsail $10/mo plan recommended).
2. Ports configured in your firewall:
   - **80** (HTTP / Nginx)
   - **443** (HTTPS / Optional for SSL)
   - **5023** (TCP Server for GPS Trackers)

### 1-Click Installation
1. SSH into your production server.
2. Clone this repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/geo-sure-path.git
   cd geo-sure-path
   ```
3. Run the automated install script:
   ```bash
   chmod +x install.sh
   ./install.sh
   ```

> **What the script does organically:**
> - **[0/9]** Cleans up any stalled processes/directories from previous runs.
> - **[1/9 - 4/9]** Installs Node.js v20, Redis, PostgreSQL, and PostGIS natively.
> - **[4.5/9]** Creates the `gps_admin` DB user, attaches PostGIS rules, and auto-loads `database/schema.sql`.
> - **[5/9 - 7/9]** Installs all `npm` modules across the frontend, backend, and tcp server, then compiles Vite.
> - **[8/9]** Binds the processes to `pm2` daemons (API, TCP, and SPA React server) so they restore on reboot.
> - **[9/9]** Generates a daily CRON backup script for the PostgreSQL database (`02:00 AM`).

### Connecting Domain & HTTPS
Once the install completes and the PM2 React server runs on Port `3000`:
1. Use Nginx as a reverse proxy linking Port 80 to Port 3000.
2. Run Certbot for free SSL:
   ```bash
   sudo apt install certbot python3-certbot-nginx -y
   sudo certbot --nginx -d tracking.yourdomain.com
   ```

---

## 📜 Development Commands
To work on this repository locally:

```bash
cd frontend
npm install
npm run dev
```
