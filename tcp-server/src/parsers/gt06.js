/**
 * Basic GT06 Protocol Parser Dummy
 * A real parser needs full byte-array parsing based on protocol manual.
 */
class GT06Parser {
    static parse(buffer) {
        const hex = buffer.toString('hex').toUpperCase();

        // Very naive check for start bits '78 78' or '79 79'
        if (!hex.startsWith('7878') && !hex.startsWith('7979')) {
            return { valid: false, reason: 'Invalid Protocol Header' };
        }

        const type = hex.substring(6, 8);

        if (type === '01') {
            // Login Packet
            const imei = hex.substring(8, 24);
            return { valid: true, type: 'LOGIN', imei: imei };
        } else if (type === '22' || type === '12') {
            // Location Packet (Simulated mock data extraction)
            // Actual parsing requires signed bit decoding for coordinates
            return {
                valid: true,
                type: 'LOCATION',
                lat: 34.0522,
                lng: -118.2437,
                speed: 60,
                heading: 90
            };
        } else if (type === '13') {
            return { valid: true, type: 'HEARTBEAT' };
        }

        return { valid: true, type: 'UNKNOWN', raw: hex };
    }

    static getResponse(type, sequenceNumber) {
        if (type === 'LOGIN' || type === 'HEARTBEAT') {
            // Dummy ACK '787805{PROTOCOL_NO}{SERIAL_NO}OD0A'
            return Buffer.from(`787805${type === 'LOGIN' ? '01' : '13'}0001D9DC0D0A`, 'hex');
        }
        return null;
    }
}

module.exports = GT06Parser;
