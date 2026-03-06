require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const { Pool } = require('pg');
const redis = require('redis');
const twilio = require('twilio');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// Twilio Client Setup
const twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID || 'AC_mock',
    process.env.TWILIO_AUTH_TOKEN || 'auth_mock'
);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Needed for Twilio Webhooks

// Postgres Connection Pool
const pool = new Pool({
    user: process.env.POSTGRES_USER || 'gps_admin',
    password: process.env.POSTGRES_PASSWORD || 'gps_strong_password',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.POSTGRES_DB || 'gps_saas',
    port: 5432,
});

// Redis Client
const redisClient = redis.createClient({
    url: `redis://${process.env.REDIS_HOST || 'localhost'}:6379`,
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));
redisClient.connect()
    .then(() => console.log('Connected to Redis'))
    .catch((err) => console.error('Redis Connection Error during startup:', err));

// WebSocket
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Real clients will authenticate before joining a room
    socket.on('join_room', (roomId) => {
        socket.join(roomId);
        console.log(`Socket ${socket.id} joined room ${roomId}`);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Basic Health Endpoint
app.get('/api/v1/health', (req, res) => {
    res.json({ status: 'OK', message: 'SaaS Platform Backend is running.' });
});

// --- REST API ENDPOINTS ---

// 1. Client Registration
app.post('/api/register', async (req, res) => {
    const { firstName, lastName, email, imei } = req.body;
    try {
        // Mock role fetching, usually you'd lookup the CLIENT role id
        const clientRoleResult = await pool.query("SELECT id FROM roles WHERE name = 'CLIENT'");
        const roleId = clientRoleResult.rows[0]?.id || null;

        const result = await pool.query(
            "INSERT INTO users (role_id, name, email, password_hash) VALUES ($1, $2, $3, 'mockhash') RETURNING id, name, email",
            [roleId, `${firstName} ${lastName}`, email]
        );
        res.json({ status: 'SUCCESS', user: result.rows[0] });
    } catch (err) {
        console.error('Registration Error:', err);
        res.status(500).json({ status: 'ERROR', message: 'Registration failed.' });
    }
});

// 2. Add Device to Inventory (Admin)
app.post('/api/inventory', async (req, res) => {
    const { imei, sim, status } = req.body;
    try {
        const isAssigned = status !== 'Unassigned';
        const result = await pool.query(
            "INSERT INTO device_inventory (imei, sim_number, is_assigned) VALUES ($1, $2, $3) RETURNING *",
            [imei, sim, isAssigned]
        );
        res.json({ status: 'SUCCESS', device: result.rows[0] });
    } catch (err) {
        console.error('Inventory Error:', err);
        res.status(500).json({ status: 'ERROR', message: 'Failed to add to inventory.' });
    }
});

// 3. Fetch Devices
app.get('/api/devices', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM device_inventory ORDER BY added_at DESC");
        res.json({ status: 'SUCCESS', devices: result.rows });
    } catch (err) {
        res.status(500).json({ status: 'ERROR', message: 'Failed to fetch devices.' });
    }
});

// 4. Save Geofence / Route
app.post('/api/geofences', async (req, res) => {
    const { name, fenceType, coordinates } = req.body;
    try {
        // Constructing a basic PostGIS geometry string from coordinates
        // Assuming coordinates is an array of [lat, lng] pairs for POLYGON
        let geomString = '';
        if (fenceType === 'POLYGON') {
            const points = coordinates.map(c => `${c[1]} ${c[0]}`).join(', ');
            geomString = `ST_GeomFromText('POLYGON((${points}))', 4326)`;
        } else if (fenceType === 'CIRCLE') {
            // For simplicity, store as point with radius in attributes, or use ST_Buffer
            geomString = `ST_Buffer(ST_GeomFromText('POINT(${coordinates[1]} ${coordinates[0]})', 4326)::geography, ${coordinates[2]})::geometry`;
        }

        if (!geomString) {
            return res.status(400).json({ status: 'ERROR', message: 'Unsupported geom. Mock saving.' });
        }

        const query = `INSERT INTO geofences (name, fence_type, geom) VALUES ($1, $2, ${geomString}) RETURNING id, name, fence_type`;
        const result = await pool.query(query, [name, fenceType]);
        res.json({ status: 'SUCCESS', geofence: result.rows[0] });
    } catch (err) {
        console.error('Geofence Error:', err);
        // Fallback for missing PostGIS or invalid geometries during testing
        res.status(500).json({ status: 'ERROR', message: 'Failed to save geofence (Ensure PostGIS is active).' });
    }
});

// 5. Fetch Today's KPIs
app.get('/api/stats', async (req, res) => {
    try {
        // Mock robust aggregated stats, replacing with real queries when devices are connected
        const totalDevices = await pool.query("SELECT COUNT(*) FROM device_inventory");
        res.json({
            status: 'SUCCESS',
            stats: {
                totalFleet: parseInt(totalDevices.rows[0].count) || 12,
                movingNow: 8,
                distanceToday: 482,
                avgEcoScore: 94
            }
        });
    } catch (err) {
        res.status(500).json({ status: 'ERROR', message: 'Failed to fetch stats.' });
    }
}
});

// 5a. Fetch Live Fleet (From Redis HASH)
app.get('/api/fleet', async (req, res) => {
    try {
        const keys = await redisClient.keys('live:*');
        const fleet = [];
        for (const key of keys) {
            const data = await redisClient.hGetAll(key);
            fleet.push({
                id: data.imei,
                name: `Device ${data.imei.slice(-6)}`,
                type: 'car',
                status: parseInt(data.speed) > 2 ? 'moving' : 'idle',
                speed: parseInt(data.speed) || 0,
                heading: parseInt(data.heading) || 0,
                lat: parseFloat(data.lat),
                lng: parseFloat(data.lng),
                lastUpdate: parseInt(data.last_update) || Date.now()
            });
        }
        res.json({ status: 'SUCCESS', fleet });
    } catch (err) {
        console.error('Fleet API Error:', err);
        res.status(500).json({ status: 'ERROR', message: 'Failed to fetch fleet.' });
    }
});

// 5b. Fetch Alerts
app.get('/api/alerts', async (req, res) => {
    try {
        // Mock returning empty alerts for testing until DB linkage
        res.json({ status: 'SUCCESS', alerts: [] });
    } catch (err) {
        res.status(500).json({ status: 'ERROR', message: 'Failed to fetch alerts.' });
    }
});

// 5c. Fetch History Playback
app.get('/api/history', async (req, res) => {
    const { imei, date, from, to } = req.query;
    try {
        // Query PostGIS data based on date ranges (mock for now as table structure requires review)
        res.json({ status: 'SUCCESS', points: [] });
    } catch (err) {
        res.status(500).json({ status: 'ERROR', message: 'Failed to fetch history.' });
    }
});

// 6. Send SMS Command
app.post('/api/commands/sms', async (req, res) => {
    const { deviceId, commandType } = req.body;
    try {
        // Look up the device and its sim number
        // (In a real app, query `devices` JOIN `device_inventory`)
        // For testing, hardcoding the user's specific IMEI details
        const simNumber = '5754280844707'; // User's requested M2M number

        // Protocol Mapping (e.g., GT06 format)
        let smsBody = '';
        if (commandType === 'CUT_ENGINE') smsBody = 'RELAY,1#';
        else if (commandType === 'RESTORE_ENGINE') smsBody = 'RELAY,0#';
        else smsBody = commandType; // Raw command

        console.log(`Sending SMS to ${simNumber}: ${smsBody}`);

        // In production, this fires the actual Twilio API
        // const message = await twilioClient.messages.create({
        //     body: smsBody,
        //     from: process.env.TWILIO_PHONE_NUMBER,
        //     to: `+${simNumber}` // Ensure E.164 format
        // });

        // Simulating success
        res.json({ status: 'SUCCESS', message: 'SMS Command Dispatched', command: smsBody, sid: 'SM_MockId123' });
    } catch (err) {
        console.error('SMS Command Error:', err);
        res.status(500).json({ status: 'ERROR', message: 'Failed to dispatch SMS command.' });
    }
});

// 7. Twilio Webhook (Receive SMS Reply from Device)
app.post('/api/webhooks/sms', async (req, res) => {
    // Twilio sends application/x-www-form-urlencoded
    const { From, Body } = req.body;
    console.log(`Received SMS from ${From}: ${Body}`);

    // Push real-time acknowledgment to frontend via WebSockets
    io.emit('sms_acknowledgment', { from: From, body: Body, timestamp: new Date() });

    // Twilio expects an empty TwiML response
    res.type('text/xml').send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
});

// Start Server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`Backend API Server running on port ${PORT}`);
});
