const PRIVATE_IP_RE =
    /^(?:127\.|10\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.|169\.254\.|100\.(?:6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.|0\.0\.0\.0$|::1$|fe80:|f[cd][0-9a-f]{2}:)/i;
const PRIVATE_HOST_RE = /\.(local|internal|localhost)$/i;
// B10-168: Reject obfuscated IP formats
const OCTAL_IP_RE = /^0[0-7]+\.[0-7]+\.[0-7]+\.[0-7]+$/;
const HEX_IP_RE = /^0x[0-9a-f]+\.[0-9a-f]+\.[0-9a-f]+\.[0-9a-f]+$/i;
const DECIMAL_IP_RE = /^\d{1,10}$/;

function normalizeIp(h: string): string {
    // B10-168: Convert obfuscated IPs to standard format for checking
    if (DECIMAL_IP_RE.test(h)) {
        const n = parseInt(h, 10);
        if (n >= 0 && n <= 0xffffffff) {
            return `${(n >>> 24) & 0xff}.${(n >>> 16) & 0xff}.${(n >>> 8) & 0xff}.${n & 0xff}`;
        }
    }
    if (HEX_IP_RE.test(h)) {
        const parts = h.split('.').map((p) => parseInt(p, 16));
        return parts.join('.');
    }
    if (OCTAL_IP_RE.test(h)) {
        const parts = h.split('.').map((p) => parseInt(p, 8));
        return parts.join('.');
    }
    return h;
}

export function isPrivateIP(hostname: string): boolean {
    const raw = hostname.replace(/^\[|\]$/g, '').toLowerCase();
    const h = normalizeIp(raw);
    if (h === 'localhost' || h === '::1' || h === '127.0.0.1') return true;
    if (h.startsWith('::ffff:')) {
        const ipv4 = h.slice(7);
        if (PRIVATE_IP_RE.test(ipv4)) return true;
    }
    if (PRIVATE_IP_RE.test(h)) return true;
    if (PRIVATE_HOST_RE.test(h)) return true;
    return false;
}

export function isValidWebhookUrl(url: string): boolean {
    try {
        const parsed = new URL(url);
        // B10-168: Require HTTPS only, reject HTTP
        if (parsed.protocol !== 'https:') return false;
        if (isPrivateIP(parsed.hostname)) return false;
        if (
            parsed.hostname === '127.0.0.1' ||
            parsed.hostname === 'localhost' ||
            parsed.hostname === '::1'
        )
            return false;
        return true;
    } catch {
        return false;
    }
}

/**
 * C-3: validator for self-hosted integration URLs (n8n and alike) that are
 * stored in agentMemory and later fetched with credentials attached.
 *
 * Unlike isValidWebhookUrl (HTTPS-only, no private IPs), this allows HTTP
 * and RFC1918 LAN hosts: self-hosted n8n overwhelmingly lives on the LAN
 * (http://192.168.x:5678), and a browser fetch cannot reach cloud metadata
 * or cause server-side SSRF. What IS blocked: non-http(s) schemes,
 * credentials embedded in the URL, loopback, link-local/metadata
 * (169.254/16 incl. the AWS endpoint), and obfuscated forms of those
 * (decimal/octal/hex, ::ffff: mapped) via normalizeIp.
 *
 * Returns { ok: true } or { ok: false, reason } — never throws.
 */
export function validateIntegrationUrl(url: string): { ok: true } | { ok: false; reason: string } {
    let parsed: URL;
    try {
        parsed = new URL(url);
    } catch {
        return { ok: false, reason: 'not a valid URL' };
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return { ok: false, reason: `scheme ${parsed.protocol} not allowed` };
    }
    if (parsed.username || parsed.password) {
        return { ok: false, reason: 'credentials embedded in URL' };
    }
    const rawHost = parsed.hostname.replace(/^\[|\]$/g, '').toLowerCase();
    if (!rawHost) return { ok: false, reason: 'empty hostname' };
    if (/[\s<>\\^`]/.test(rawHost)) return { ok: false, reason: 'invalid hostname' };
    const h = normalizeIp(rawHost);
    if (
        h === 'localhost' ||
        h === '::1' ||
        h === '::' ||
        h === '0.0.0.0' ||
        h === '169.254.169.254' ||
        h.startsWith('169.254.') ||
        h.startsWith('127.') ||
        h.startsWith('::ffff:127.') ||
        h.startsWith('fe80:')
    ) {
        return { ok: false, reason: 'loopback/link-local/metadata host' };
    }
    if (h.endsWith('.localhost')) {
        return { ok: false, reason: 'localhost subdomain' };
    }
    return { ok: true };
}
