import crypto from 'node:crypto';

/**
 * T-H-6: WebSocket upgrade authentication, extracted from sync-server.mjs
 * into a pure, unit-testable module.
 *
 * Browser WebSocket API cannot set arbitrary headers, so auth travels in
 * `Sec-WebSocket-Protocol: sync-token,<token>` (preferred) or an
 * `Authorization: Bearer` header. Returns a verdict; the caller maps it to
 * the ws `verifyClient` callback (including the selected subprotocol echo).
 */
export function timingSafeEqual(a, b) {
    const bufA = Buffer.from(String(a));
    const bufB = Buffer.from(String(b));
    if (bufA.length !== bufB.length) {
        // Compare against a same-length buffer to prevent length leak.
        // NOTE (refutes T-H-6 claim 1): this never throws RangeError on
        // length mismatch — short tokens simply fail closed.
        crypto.timingSafeEqual(bufA, bufA);
        return false;
    }
    return crypto.timingSafeEqual(bufA, bufB);
}

export function verifyWsUpgrade({ protocols, authorization }, secret) {
    if (protocols) {
        const parts = String(protocols)
            .split(',')
            .map((p) => p.trim());
        // Format: "sync-token,<token>". A bare "sync-token" without a token
        // is rejected below as unauthorized (the old dedicated branch was
        // unreachable dead code — parts[1] is falsy there by construction).
        if (parts[0] === 'sync-token') {
            if (parts[1] && timingSafeEqual(parts[1], secret)) {
                return { ok: true, protocol: 'sync-token' };
            }
            return { ok: false, code: 4001, message: 'Invalid token' };
        }
    }
    if (authorization && authorization.startsWith('Bearer ')) {
        if (timingSafeEqual(authorization.slice(7), secret)) {
            return { ok: true };
        }
        return { ok: false, code: 4001, message: 'Invalid token' };
    }
    return { ok: false, code: 401, message: 'Unauthorized' };
}
