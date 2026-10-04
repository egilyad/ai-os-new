import http from 'http';
import https from 'https';
import { URL } from 'url';
import { resolveAndCheckHost } from './net-guard.mjs';

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

// SSRF guards live in ./net-guard.mjs (unit-tested) — see T-H-5.
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
            // We connect to the resolved IP (DNS-rebinding fix above), so
            // SNI must carry the original hostname — otherwise TLS fails
            // with ERR_TLS_CERT_ALTNAME_INVALID on https upstreams.
            ...(parsed.protocol === 'https:' ? { servername: parsed.hostname } : {}),
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
