const SECRET_KEYS = new Set(['browserUse.token', 'companyGateway.secret']);

export function readSecret(key: string): string | null {
    if (!SECRET_KEYS.has(key)) {
        try {
            return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
        } catch {
            return null;
        }
    }
    try {
        const current = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(key) : null;
        if (current !== null) return current;
        const legacy = typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
        if (legacy !== null) {
            if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(key, legacy);
            try {
                localStorage.removeItem(key);
            } catch {
                /* private mode */
            }
        }
        return legacy;
    } catch {
        return null;
    }
}

export function writeSecret(key: string, value: string): void {
    try {
        if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(key, value);
        if (SECRET_KEYS.has(key) && typeof localStorage !== 'undefined') {
            localStorage.removeItem(key);
        }
    } catch {
        /* private mode */
    }
}
