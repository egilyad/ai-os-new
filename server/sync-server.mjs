import http from 'node:http';
import crypto from 'node:crypto';
import { WebSocketServer } from 'ws';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = parseInt(process.env.SYNC_PORT || '3001', 10);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'shared-db.bin');

// BLD-10: SYNC_SECRET is required — fail fast at startup. No fallback to empty string.
// In Docker, pass via: docker run -e SYNC_SECRET=<strong-random-token>
const AUTH_TOKEN = process.env.SYNC_SECRET;
if (!AUTH_TOKEN) {
    console.error('[sync-server] FATAL: SYNC_SECRET environment variable is required.');
    console.error('[sync-server] Set via: SYNC_SECRET=<your-secret> node sync-server.mjs');
    process.exit(1);
}
// Expose AUTH_TOKEN for use by verifyClient (avoids shadowing duplicate declaration)
const SYNC_SECRET = AUTH_TOKEN;

const ALLOWED_ORIGINS = (process.env.SYNC_ORIGINS || 'http://localhost:5173').split(',');
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 30;
const rateLimits = new Map();

function isAllowedOrigin(origin) {
    return ALLOWED_ORIGINS.includes(origin) || ALLOWED_ORIGINS.includes('*');
}

function getClientIP(req) {
    // M-1: prefer x-forwarded-for behind nginx; parse leftmost IP from chain
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
        const leftmost = forwarded.split(',')[0].trim();
        if (leftmost) return leftmost;
    }
    return req.socket?.remoteAddress || 'unknown';
}

function checkRateLimit(ip) {
    const now = Date.now();
    const entry = rateLimits.get(ip);
    if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
        rateLimits.set(ip, { windowStart: now, count: 1 });
        return true;
    }
    entry.count++;
    if (entry.count > RATE_LIMIT_MAX_REQUESTS) {
        return false;
    }
    return true;
}

function timingSafeEqual(a, b) {
    const bufA = Buffer.from(String(a));
    const bufB = Buffer.from(String(b));
    if (bufA.length !== bufB.length) {
        // Compare against a same-length buffer to prevent length leak
        crypto.timingSafeEqual(bufA, bufA);
        return false;
    }
    return crypto.timingSafeEqual(bufA, bufB);
}

function hasAuth(req) {
    const header = req.headers['authorization'] || '';
    if (!header.startsWith('Bearer ')) return false;
    return timingSafeEqual(header.slice(7), AUTH_TOKEN);
}

function writeJson(res, status, data) {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
}

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Serialize writes to the file
let writeQueue = Promise.resolve();

// H-14: Track WebSocket connection rate per IP (separate from HTTP rate limit bucket)
const WS_RATE_LIMIT_WINDOW_MS = 60_000;
const WS_RATE_LIMIT_MAX_CONNECTIONS = 10;
const wsRateLimits = new Map();

function checkWsRateLimit(ip) {
    const now = Date.now();
    const entry = wsRateLimits.get(ip);
    if (!entry || now - entry.windowStart > WS_RATE_LIMIT_WINDOW_MS) {
        wsRateLimits.set(ip, { windowStart: now, count: 1 });
        return true;
    }
    entry.count++;
    if (entry.count > WS_RATE_LIMIT_MAX_CONNECTIONS) {
        return false;
    }
    return true;
}

const server = http.createServer((req, res) => {
    const origin = req.headers['origin'] || '';
    const ip = getClientIP(req);
    // Rate limit
    if (!checkRateLimit(ip)) {
        res.writeHead(429);
        res.end('Too many requests');
        return;
    }
    // Require Origin for mutating requests (PUT, POST, DELETE)
    if (req.method !== 'GET' && req.method !== 'OPTIONS') {
        if (!origin) {
            res.writeHead(403);
            res.end('Origin header required');
            return;
        }
        if (!isAllowedOrigin(origin)) {
            res.writeHead(403);
            res.end('Origin not allowed');
            return;
        }
    } else if (origin && !isAllowedOrigin(origin)) {
        res.writeHead(403);
        res.end('Origin not allowed');
        return;
    }
    if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    if (req.method === 'GET' && req.url === '/api/health') {
        writeJson(res, 200, { status: 'ok', timestamp: Date.now() });
        return;
    }

    if (req.url === '/api/db') {
        if (!hasAuth(req)) {
            writeJson(res, 401, { error: 'Unauthorized' });
            return;
        }

        if (req.method === 'GET') {
            try {
                if (fs.existsSync(DB_FILE)) {
                    const data = fs.readFileSync(DB_FILE);
                    res.writeHead(200, { 'Content-Type': 'application/octet-stream' });
                    res.end(data);
                } else {
                    res.writeHead(404);
                    res.end('No DB yet');
                }
            } catch (err) {
                // C-8: Never expose raw Error objects — sanitize before sending to client
                console.error('[sync-server] GET /db error:', err);
                res.writeHead(500);
                res.end('Internal server error');
            }
            return;
        }

        if (req.method === 'PUT') {
            if (req.headers['content-type'] !== 'application/octet-stream') {
                writeJson(res, 400, { error: 'Content-Type must be application/octet-stream' });
                return;
            }
            let contentLength = 0;
            req.on('data', (chunk) => {
                contentLength += chunk.length;
                if (contentLength > 50 * 1024 * 1024) {
                    req.destroy(new Error('Payload too large'));
                }
            });
            const chunks = [];
            req.on('data', (chunk) => chunks.push(chunk));
            req.on('end', () => {
                writeQueue = writeQueue.then(() => {
                    try {
                        const tmpFile = DB_FILE + '.tmp.' + Date.now();
                        fs.writeFileSync(tmpFile, Buffer.concat(chunks));
                        fs.renameSync(tmpFile, DB_FILE);
                        const msg = JSON.stringify({ type: 'db_changed', timestamp: Date.now() });
                        for (const client of wss.clients) {
                            if (client.readyState === 1) {
                                client.send(msg);
                            }
                        }
                        writeJson(res, 200, { status: 'ok' });
                    } catch (err) {
                        // C-8: Never expose raw Error objects to client
                        console.error('[sync-server] PUT /db error:', err);
                        writeJson(res, 500, { error: 'Internal server error' });
                    }
                });
            });
            return;
        }
    }

    // REST API: Debate-as-a-Service
    if (req.method === 'GET' && req.url === '/api/debates') {
        writeJson(res, 200, { debates: [], message: 'Debate-as-a-Service API enabled' });
        return;
    }

    writeJson(res, 404, { error: 'Not found' });
});

// SYNC_SECRET is already validated at startup (above) — guard is unreachable.
const wss = new WebSocketServer({
    server,
    verifyClient: (info, callback) => {
        // H-14: Rate limit WebSocket connections per IP
        const wsIp = getClientIP(info.req);
        if (!checkWsRateLimit(wsIp)) {
            callback(false, 429, 'Too many connections');
            return;
        }
        // L-9: Check origin BEFORE token check — never reveal token validity to unauthorized origins
        const wsOrigin = info.origin || info.req.headers['origin'] || '';
        if (wsOrigin && !isAllowedOrigin(wsOrigin)) {
            callback(false, 403, 'Origin not allowed');
            return;
        }

        // SECURITY FIX: Check Sec-WebSocket-Protocol header first (preferred), then Authorization, then query param (deprecated fallback)
        // Sec-WebSocket-Protocol: first value is subprotocol name, second (if any) is the token
        const protocols = info.req.headers['sec-websocket-protocol'];
        if (protocols) {
            const parts = protocols.split(',').map((p) => p.trim());
            // Format: "sync-token,<token>" or just "sync-token" without token
            if (parts[0] === 'sync-token' && parts[1]) {
                if (timingSafeEqual(parts[1], SYNC_SECRET)) {
                    callback(true);
                    return;
                }
                callback(false, 4001, 'Invalid token');
                return;
            }
            // If no token provided, reject (no anonymous connections)
            if (parts[0] === 'sync-token' && !parts[1]) {
                callback(false, 4001, 'Authentication required');
                return;
            }
        }
        // Fallback: Authorization header for HTTP API clients
        const auth = info.req.headers['authorization'];
        if (auth && auth.startsWith('Bearer ')) {
            if (timingSafeEqual(auth.slice(7), SYNC_SECRET)) {
                callback(true);
                return;
            }
            callback(false, 4001, 'Invalid token');
            return;
        }
        // P1-16: ?token= query param removed — use Sec-WebSocket-Protocol or Authorization header only
        callback(false, 401, 'Unauthorized');
    },
});

wss.on('connection', (ws) => {
    const clientIp = ws._socket?.remoteAddress || 'unknown';
    ws.send(JSON.stringify({ type: 'connected', timestamp: Date.now() }));
    const id = `${clientIp}-${Date.now()}`;
    ws.on('close', (code, reason) => {
        console.log(`[sync-server] WS disconnect: ${id} code=${code} reason=${reason || 'none'}`);
    });
    ws.on('error', (err) => {
        console.error(`[sync-server] WS error: ${id} ${err.message}`);
    });
});

// Clean up disconnected clients every 30s
setInterval(() => {
    for (const client of wss.clients) {
        if (client.readyState !== 1) {
            try {
                client.terminate();
            } catch {
                /* ignore */
            }
        }
    }
}, 30_000);

server.listen(PORT, () => {
    console.log(`[SyncServer] running on http://localhost:${PORT}`);
    console.log(`[SyncServer] storing DB at ${DB_FILE}`);
});
