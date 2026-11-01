import type { ITokenCodec, TenantContext } from '../../contracts/team-auth';

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;

function bytesToBase64Url(bytes: Uint8Array): string {
    let s = '';
    const CHUNK = 8192;
    for (let i = 0; i < bytes.length; i += CHUNK) {
        s += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
    }
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBytes(str: string): Uint8Array {
    const b64 = str.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (str.length % 4)) % 4);
    return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

interface TokenPayload extends TenantContext {
    exp: number;
    iat: number;
}

/**
 * TokenCodec — подписанный HMAC-SHA256 токен (SPEC_10).
 *
 * Формат: `base64url(payload).base64url(signature)`. Подпись через WebCrypto
 * (crypto.subtle) — работает и в браузере, и в Node.
 */
export class TokenCodec implements ITokenCodec {
    constructor(private secret: string) {
        if (!secret || secret.length < 16) {
            throw new Error('TokenCodec: secret must be at least 16 chars');
        }
    }

    async issue(ctx: TenantContext, ttlMs = DEFAULT_TTL_MS): Promise<string> {
        const now = Date.now();
        const payload: TokenPayload = {
            tenantId: ctx.tenantId,
            userId: ctx.userId,
            roles: [...ctx.roles],
            iat: now,
            exp: now + ttlMs,
        };
        const encoded = bytesToBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
        const sig = await this.sign(encoded);
        return `${encoded}.${bytesToBase64Url(sig)}`;
    }

    async verify(token: string): Promise<TenantContext | null> {
        const dot = token.indexOf('.');
        if (dot <= 0) return null;
        const encoded = token.slice(0, dot);
        const sigB64 = token.slice(dot + 1);
        try {
            const expected = bytesToBase64Url(await this.sign(encoded));
            if (sigB64 !== expected) return null;
            const decoded = new TextDecoder().decode(base64UrlToBytes(encoded));
            const payload = JSON.parse(decoded) as TokenPayload;
            if (typeof payload.exp !== 'number' || payload.exp < Date.now()) return null;
            if (!payload.tenantId || !payload.userId) return null;
            return {
                tenantId: payload.tenantId,
                userId: payload.userId,
                roles: Array.isArray(payload.roles) ? payload.roles : [],
            };
        } catch {
            return null;
        }
    }

    private async sign(data: string): Promise<Uint8Array> {
        const key = await crypto.subtle.importKey(
            'raw',
            new TextEncoder().encode(this.secret),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign'],
        );
        const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
        return new Uint8Array(sig);
    }
}
