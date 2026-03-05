require('dotenv').config();
const net = require('net');
const redis = require('redis');
const GT06Parser = require('./parsers/gt06');

const PORT = process.env.TCP_PORT || 5023;

// Connect to Redis for Queue and Live Tracking updates
const redisClient = redis.createClient({
    url: `redis://${process.env.REDIS_HOST || 'localhost'}:6379`,
});

redisClient.on('error', (err) => console.log('Redis Error', err));
redisClient.connect()
    .then(() => console.log('Connected to Redis'))
    .catch((err) => console.error('Redis Connection Error:', err));

const server = net.createServer((socket) => {
    let deviceImei = null;

    socket.on('data', async (data) => {
        // Parse GT06 data
        const parsed = GT06Parser.parse(data);

        if (!parsed.valid) {
            console.log('Invalid data received');
            return;
        }

        if (parsed.type === 'LOGIN') {
            deviceImei = parsed.imei;
            console.log(`[LOGIN] Device connected: ${deviceImei}`);
            const ack = GT06Parser.getResponse('LOGIN', 1);
            if (ack) socket.write(ack);
        }
        else if (parsed.type === 'LOCATION') {
            if (!deviceImei) return; // Must login first
            console.log(`[LOCATION] From ${deviceImei}: Lat ${parsed.lat}, Lng ${parsed.lng}`);

            // Update local state in Redis
            await redisClient.hSet(`live:${deviceImei}`, {
                lat: parsed.lat,
                lng: parsed.lng,
                speed: parsed.speed,
                heading: parsed.heading,
                last_update: Date.now()
            });

            // Here you would also push to a queue for the backend/websocket to consume
        }
        else if (parsed.type === 'HEARTBEAT') {
            console.log(`[HEARTBEAT] From ${deviceImei}`);
            const ack = GT06Parser.getResponse('HEARTBEAT', 1);
            if (ack) socket.write(ack);

            // Check command queue
            if (deviceImei) {
                const cmd = await redisClient.lPop(`cmd_queue:${deviceImei}`);
                if (cmd) {
                    console.log(`[COMMAND] Dispatching Command to ${deviceImei}: ${cmd}`);
                    // Send raw byte command
                    // socket.write(Buffer.from(cmd, 'hex')); 
                }
            }
        }
    });

    socket.on('close', () => {
        console.log(`[DISCONNECT] Device ${deviceImei || 'Unknown'} disconnected.`);
    });

    socket.on('error', (err) => {
        console.error(`[ERROR] Socket Error:`, err);
    });
});

server.listen(PORT, () => {
    console.log(`TCP Server listening on port ${PORT} for GT06 Devices`);
});
