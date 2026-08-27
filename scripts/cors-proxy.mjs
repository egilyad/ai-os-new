import http from 'http';
import https from 'https';
import { URL } from 'url';
import net from 'net';
import dns from 'dns';

const PORT = 3002;
// BLD-21: Allow CORS origin to be configured via env var (defaults to localhost:5173 for dev)
const CORS_ORIGIN = process.env.CORS_ORIGIN;
if (!CORS_ORIGIN) {
    console.error(
        '[cors-proxy] FATAL: CORS_ORIGIN environment variable is required. Set it to the allowed origin (e.g. http://localhost:5173).',
    );
    process.exit(1);
}
if (CORS_ORIGIN === '*') {
    console.error(
        '[cors-proxy] FATAL: CORS_ORIGIN cannot be "*" (open relay). Set a specific origin.',
    );
    process.exit(1);
}
const MAX_SIZE = 100 * 1024 * 1024; // 100MB limit — N-08

function isPrivateIP(ip) {
    if (ip.includes(':')) {
        if (ip === '::1' || ip === '0:0:0:0:0:0:0:1') return true;
        if (ip.startsWith('fe80:') || ip.startsWith('fd') || ip.startsWith('fc')) return true;
        return false;
    }
    if (ip.startsWith('127.') || ip.startsWith('10.') || ip.startsWith('192.168.')) return true;
    if (ip.startsWith('169.254.')) return true;
    if (ip.startsWith('172.')) {
        const secondOctet = parseInt(ip.split('.')[1], 10);
        if (secondOctet >= 16 && secondOctet <= 31) return true;
    }
    if (ip.startsWith('100.')) {
        const secondOctet = parseInt(ip.split('.')[1], 10);
        if (secondOctet >= 64 && secondOctet <= 127) return true;
    }
    return ip === '0.0.0.0';
}

async function resolveAndCheckHost(hostname) {
    const parsed = new URL(`http://${hostname}`);
    const h = parsed.hostname;
    if (net.isIP(h)) {
        if (isPrivateIP(h)) return { blocked: true, ip: h };
        return { blocked: false, ip: h };
    }
    if (h === 'localhost' || h === '127.0.0.1' || h.endsWith('.local') || h.endsWith('.internal')) {
        return { blocked: true, ip: h };
    }
    let addresses;
    try {
        addresses = await dns.promises.resolve4(h);
    } catch {
        return { blocked: true, ip: h };
    }
    for (const addr of addresses) {
        if (isPrivateIP(addr)) return { blocked: true, ip: addr };
    }
    return { blocked: false, ip: addresses[0] };
}
// BLD-39: Keep only one isPrivateIP definition (duplicate removed)
const ALLOWED_DOMAINS = [
    'openrouter.ai',
    'generativelanguage.googleapis.com',
    'integrate.api.nvidia.com',
    'api.groq.com',
    'api.cerebras.ai',
    'api.cloudflare.com',
    'api.openai.com',
];

function writeCorsHeaders(res) {
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Origin', CORS_ORIGIN);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
}

function collectRequestBody(req) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        let size = 0;
        req.on('data', (chunk) => {
            size += chunk.length;
            if (size > MAX_SIZE) {
                reject(new Error('Request body too large'));
                return;
            }
            chunks.push(chunk);
        });
        req.on('end', () => resolve(Buffer.concat(chunks)));
        req.on('error', reject);
    });
}

const server = http.createServer(async (req, res) => {
    // Validate Origin header against CORS_ORIGIN
    const origin = req.headers['origin'];
    if (origin && origin !== CORS_ORIGIN) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Origin not allowed' }));
        return;
    }

    writeCorsHeaders(res);

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const url = new URL(req.url || '/', `http://localhost:${PORT}`);
    const target = url.searchParams.get('url');

    if (!target) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Missing ?url= parameter' }));
        return;
    }

    let parsed;
    try {
        parsed = new URL(target);
    } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid URL' }));
        return;
    }

    const { blocked, ip } = await resolveAndCheckHost(parsed.host);
    if (blocked) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Blocked: private IP' }));
        return;
    }

    const allowed = ALLOWED_DOMAINS.some(
        (d) => parsed.hostname === d || parsed.hostname.endsWith('.' + d),
    );
    if (!allowed) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `Blocked: ${parsed.hostname} not in allowlist` }));
        return;
    }

    const client = parsed.protocol === 'https:' ? https : http;
    const proxyHeaders = { ...req.headers };
    delete proxyHeaders.host;
    delete proxyHeaders.origin;
    delete proxyHeaders.referer;
    delete proxyHeaders['content-length'];
    // SECURITY: Strip sensitive headers that could leak user credentials to upstream
    delete proxyHeaders['authorization'];
    delete proxyHeaders['cookie'];
    delete proxyHeaders['x-api-key'];
    delete proxyHeaders['x-auth-token'];
    delete proxyHeaders['set-cookie'];
    // DNS-rebinding fix: use resolved IP instead of hostname for connection,
    // preserving original hostname in Host header to avoid TOCTOU attacks
    proxyHeaders.host = parsed.host;
    const targetForConnection = `${parsed.protocol}//${ip}${parsed.pathname}${parsed.search}`;

    let requestBody = Buffer.alloc(0);
    if (!['GET', 'HEAD'].includes(req.method || 'GET')) {
        try {
            requestBody = await collectRequestBody(req);
        } catch (err) {
            res.writeHead(413, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }));
            return;
        }
    }

    const proxyReq = client.request(
        targetForConnection,
        {
            method: req.method || 'GET',
            headers: {
                ...proxyHeaders,
                ...(requestBody.length > 0 ? { 'Content-Length': String(requestBody.length) } : {}),
            },
        },
        (proxyRes) => {
            let size = 0;
            const body = [];
            proxyRes.on('data', (chunk) => {
                size += chunk.length;
                if (size > MAX_SIZE) {
                    proxyReq.destroy(new Error('Response too large'));
                    res.destroy();
                    return;
                }
                body.push(chunk);
            });
            proxyRes.on('end', () => {
                const responseHeaders = {
                    'Content-Type': proxyRes.headers['content-type'] || 'application/octet-stream',
                };
                res.writeHead(proxyRes.statusCode || 200, responseHeaders);
                res.end(Buffer.concat(body));
            });
            proxyRes.on('error', (err) => {
                res.writeHead(502, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: err.message }));
            });
        },
    );

    proxyReq.on('error', (err) => {
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
    });

    if (requestBody.length > 0) {
        proxyReq.write(requestBody);
    }
    proxyReq.end();
});

server.listen(PORT, () => {
    console.log(`[cors-proxy] Listening on http://localhost:${PORT}`);
    console.log(`[cors-proxy] Allowed: ${ALLOWED_DOMAINS.join(', ')}`);
});
