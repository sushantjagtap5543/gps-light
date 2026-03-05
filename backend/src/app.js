require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const { Pool } = require('pg');
const redis = require('redis');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

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

// Start Server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`Backend API Server running on port ${PORT}`);
});
