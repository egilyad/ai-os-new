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
