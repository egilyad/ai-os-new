import net from 'net';
import dns from 'dns';

/**
 * T-H-5: SSRF guard primitives shared by scripts/cors-proxy.mjs (the
 * production egress gate for LLM providers). Extracted here so the bypass
 * forms are unit-testable without booting the proxy (which binds a port
 * and exits without CORS_ORIGIN on import).
 */

// 2.11: normalize exotic-but-valid IP forms before classification.
// Without this, `::ffff:127.0.0.1`, `2130706433` (=127.0.0.1) or
// `0x7f000001` bypass isPrivateIP and reach private targets.
export function normalizeIP(ip) {
    // Bracketed IPv6 literals ([::1]) as seen in URLs/host headers.
    if (ip.startsWith('[') && ip.endsWith(']')) ip = ip.slice(1, -1);
    // IPv4-mapped IPv6: ::ffff:127.0.0.1 or ::ffff:7f00:1
    const mapped = ip.match(/^::ffff:([^:]+(?::[^:]+)*)$/i);
    if (mapped) {
        const suffix = mapped[1];
        if (/^\d+\.\d+\.\d+\.\d+$/.test(suffix)) return suffix;
        const groups = suffix.split(':');
        if (groups.length > 0 && groups.every((g) => /^[0-9a-fA-F]{1,4}$/.test(g))) {
            const nums = groups.map((g) => parseInt(g, 16));
            const low32 =
                nums.length === 1
                    ? nums[0]
                    : ((nums[nums.length - 2] ?? 0) << 16) | (nums[nums.length - 1] ?? 0);
            return [(low32 >>> 24) & 255, (low32 >>> 16) & 255, (low32 >>> 8) & 255, low32 & 255].join('.');
        }
        return ip;
    }
    // Single-number IPv4 forms: decimal (2130706433), hex (0x7f000001).
    // Number() handles 0x/decimal; dotted forms are NaN and fall through.
    if (/^[0-9a-fA-FxX]+$/.test(ip) && !net.isIP(ip)) {
        const num = Number(ip);
        if (Number.isInteger(num) && num >= 0 && num <= 0xffffffff) {
            return [(num >>> 24) & 255, (num >>> 16) & 255, (num >>> 8) & 255, num & 255].join('.');
        }
    }
    // Dotted octal/hex quads (0177.0.0.1, 0x7f.0.0.1): WHATWG URL parsers
    // normalize these, but direct isPrivateIP callers must not miss them.
    const quad = ip.split('.');
    if (quad.length === 4 && quad.every((p) => /^(0[xX][0-9a-fA-F]+|0[0-9]+|[0-9]+)$/.test(p))) {
        const nums = quad.map((p) => {
            if (/^0[xX]/.test(p)) return parseInt(p, 16);
            if (/^0[0-9]+$/.test(p)) return parseInt(p, 8);
            return parseInt(p, 10);
        });
        if (nums.every((n) => Number.isInteger(n) && n >= 0 && n <= 255)) {
            return nums.join('.');
        }
    }
    return ip;
}

export function isPrivateIP(rawIp) {
    const ip = normalizeIP(rawIp);
    if (ip === 'localhost' || ip.endsWith('.localhost')) return true;
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

export async function resolveAndCheckHost(hostname) {
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
