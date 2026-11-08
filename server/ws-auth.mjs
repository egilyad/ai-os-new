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

/**
 * P0-2: multi-tenant WebSocket upgrade verification. The bearer token is
 * `<companyId>:<secret>` — the server resolves the company's own secret via
 * `resolveSecret(companyId)` and compares in constant time. This prevents a
 * client holding one company's secret from authenticating as another.
 * Returns a verdict with `companyId` on success; the caller attaches it to
 * the connection for cross-tenant scoping.
 */
export function parseSyncToken(raw) {
    const parts = String(raw || '').split(':');
    if (parts.length !== 2) return null;
    const [companyId, secret] = parts;
    if (!companyId || !secret) return null;
    return { companyId, secret };
}

/**
 * P0-2: multi-tenant upgrade verification against per-company secret HASHES.
 * The server never holds plaintext company secrets, so instead of resolving a
 * secret string we pass an inspector: `inspectSecret(companyId)` returns
 * `{ exists, verify(candidate) }` where `verify` performs the constant-time
 * hash comparison. This keeps the same verdict shape as verifyWsUpgradeCompany
 * (including `companyId` on success) for the verifyClient caller.
 */
export function verifyWsUpgradeCompanyHash({ protocols, authorization }, inspectSecret) {
    if (protocols) {
        const parts = String(protocols)
            .split(',')
            .map((p) => p.trim());
        if (parts[0] === 'sync-token') {
            const parsed = parseSyncToken(parts[1]);
            if (!parsed) {
                return { ok: false, code: 4001, message: 'Invalid token' };
            }
            const inspected = inspectSecret(parsed.companyId);
            if (!inspected || !inspected.exists) {
                return { ok: false, code: 401, message: 'Unknown company' };
            }
            if (inspected.verify(parsed.secret)) {
                return { ok: true, protocol: 'sync-token', companyId: parsed.companyId };
            }
            return { ok: false, code: 4001, message: 'Invalid token' };
        }
    }
    if (authorization && authorization.startsWith('Bearer ')) {
        const parsed = parseSyncToken(authorization.slice(7));
        if (!parsed) {
            return { ok: false, code: 401, message: 'Unauthorized' };
        }
        const inspected = inspectSecret(parsed.companyId);
        if (!inspected || !inspected.exists) {
            return { ok: false, code: 401, message: 'Unknown company' };
        }
        if (inspected.verify(parsed.secret)) {
            return { ok: true, companyId: parsed.companyId };
        }
        return { ok: false, code: 4001, message: 'Invalid token' };
    }
    return { ok: false, code: 401, message: 'Unauthorized' };
}

export function verifyWsUpgradeCompany({ protocols, authorization }, resolveSecret) {
    if (protocols) {
        const parts = String(protocols)
            .split(',')
            .map((p) => p.trim());
        if (parts[0] === 'sync-token') {
            const parsed = parseSyncToken(parts[1]);
            if (!parsed) {
                return { ok: false, code: 4001, message: 'Invalid token' };
            }
            const secret = resolveSecret(parsed.companyId);
            if (!secret) {
                return { ok: false, code: 401, message: 'Unknown company' };
            }
            if (timingSafeEqual(parsed.secret, secret)) {
                return { ok: true, protocol: 'sync-token', companyId: parsed.companyId };
            }
            return { ok: false, code: 4001, message: 'Invalid token' };
        }
    }
    if (authorization && authorization.startsWith('Bearer ')) {
        const parsed = parseSyncToken(authorization.slice(7));
        if (!parsed) {
            return { ok: false, code: 401, message: 'Unauthorized' };
        }
        const secret = resolveSecret(parsed.companyId);
        if (!secret) {
            return { ok: false, code: 401, message: 'Unknown company' };
        }
        if (timingSafeEqual(parsed.secret, secret)) {
            return { ok: true, companyId: parsed.companyId };
        }
        return { ok: false, code: 4001, message: 'Invalid token' };
    }
    return { ok: false, code: 401, message: 'Unauthorized' };
}
