# GeoSurePath User Manual

Welcome to the **GeoSurePath** platform. This manual provides a role-based and feature-based breakdown of the system to ensure seamless navigation for both Administrators and End-Clients.

---

## 1. Client & Fleet Manager Role

The **Client Dashboard** is intended for end-users tracking their specific vehicles, managing their drivers, and monitoring fuel efficiency.

### A. Client Onboarding & Daily Operations
*   **Registration & Login:** Clients are registered in the master database with their personal information, but they log in using credentials securely provided by their Reseller or Super Admin (e.g., at `tracking.geosurepath.com/login`).
*   **Adding a New Device/Vehicle:** 
    1.  Ensure your GPS hardware is installed.
    2.  The key identifier is the **IMEI Number** combined with the active **Mobile Number (SIM)**. A single client can add and track *multiple* IMEI numbers (vehicles) simultaneously under one secure login.
    3.  Submit the IMEI and Mobile Number through the Client "Devices" panel to instantly bind the tracker to your account (verified by the central database).
*   **Reporting & Analytics:** 
    1.  Click the **Reports** tab from the left sidebar.
    2.  Select the **Date Range** and **Vehicle** you wish to analyze.
    3.  Generate automated reports for **Distance Traveled, Stops/Idling, Fuel Consumption,** and **Driver Behavior**.
    4.  Export reports to CSV or PDF for compliance and record-keeping.

### B. Live Map & Zero-Delay Tracking
*   **Zero-Delay Tracking:** Unlike other platforms, vehicles update instantly via WebSockets (less than 10ms latency). As long as the vehicle is moving, you will see a green pulsing icon next to its name.
*   **Map Layers:** In the bottom left corner of the map, click the "Layers" button to toggle between **Street View, Satellite View, Traffic Overlays,** and **Dark Mode**.
*   **Geographic Toolkit:** Next to the Layers button, use the toolkit to:
    *   **Measure Distance:** Click anywhere on the map to draw a line and instantly calculate the distance in **KM**.
    *   **Quick Geofence:** Draw custom zones directly on the live map without navigating to a separate settings page.
*   **Current Date & Status Widget:** The top-left corner displays the live system date and overall operational connection health to ensure you aren't looking at stale data.

### C. Alerts & Notifications
*   **Loud Audio Notifications:** If a critical event occurs (like an SOS Panic Button press or a Sudden Fuel Drop), a loud audible alarm will trigger automatically.
*   **Mute Toggle:** To mute the alarm, look at the very bottom of the left-hand navigation menu and click the **Muted** button (bell icon with a slash).
*   **On-Screen Banners:** Urgent alerts (e.g., "[URGENT] FUEL THEFT WARNING: (-45L) in 2 mins") will pop up as red, pulsing banners at the top of the screen.

### D. Feature-Specific Modules
*   **Fuel & CAN Diagnostics:** Navigate to the "Fuel & CAN" tab. Here you will see live area charts. Sudden drop logic evaluates if the tank loses volume too quickly (e.g., >10L in under 5 minutes), immediately firing a theft alert.
*   **AI Driver Scoring:** Uses harsh braking metrics, cornering G-force, and speed tracking to score drivers automatically from 0-100 to help reduce insurance premiums.
*   **Document Vault:** Store vehicle RCs, Insurance Policies, and Pollution certificates. Expiry dates update the badge to amber ("Expiring Soon") when a document is near expiration.

---

## 2. Super Admin & Reseller Role

The **Admin Dashboard** is strictly for platform owners to manage infrastructure, billing, and the complete reseller hierarchy.

### A. Master Feature Control (Feature Matrix) & Database Management
*   **Central Database Architecure:** All tables (Subscriptions, Vehicles, IMEIs, Notifications) are interconnected in the central SQL database. Admins dictate absolute access rules from the panel.
*   Instead of navigating between individual client settings, use the **Feature Matrix & Datatables Panel** under the "Full Control Setup" tab.
*   Instantly toggle global permissions (like Live Tracking, Alert Modules, or Eco-Scoring) for entire fleets or specific vehicles with true 1-Click control.

### B. System Health, Disaster Management & Automatic Backups
*   **System Health:** The platform detects issues with TCP queues or memory leaks. Click the **Fix All Issues (1-Click)** button to resolve background daemon stalls immediately.
*   **Daily Snapshots & Google Drive:** The database takes off-site snapshots every day. Daily backups are automatically encrypted, zipped, and securely stored in a designated **Google Drive specific folder** for seamless disaster recovery. Admins can manually click "Take Full Backup Now" before making huge master rule changes.

### C. Reseller White-Label Setup
*   **Theming Engine:** Allow your resellers to completely brand their platform. 
*   Admins can input a custom DNS URL (e.g., `tracking.reseller.com`), define specific Brand Hex Colors (which re-compiles the Vite frontend in real-time), and upload a custom Logo Image URL.

### D. RTO / Vahan Integration (AIS-140)
*   **Compliance Servers:** India mandates dual-IP forwarding for commercial vehicles.
*   Navigate to the **RTO / Vahan Connect** tab.
*   Enter the secondary forwarding IP and Port (e.g., specific BSNL government servers). The platform natively handles sending location packets to both tracking.geosurepath.com and the specified Vahan IP simultaneously. 
*   *Note: Vehicles fitted with approved hardware will show an "AIS-140" badge in the client sidebar.*

### E. Advanced Billing Setup
*   Monitor Monthly Recurring Revenue in **INR (₹)**. 
*   View all active subscriptions and pending invoices seamlessly. 
*   Admins can click "+ Create Invoice" to automatically bill sub-clients for their tracking subscriptions dynamically based on active hardware counts.
