/**
 * Gateway bearer secret storage.
 *
 * P2 (XSS hardening): the secret lives in sessionStorage, not localStorage —
 * it dies with the tab and is not readable by other tabs of the origin.
 * A one-time migration moves legacy localStorage values into sessionStorage
 * and removes the old copy so no plaintext secret lingers there.
 */
export function readGatewaySecret(key: string): string {
    const migrated = sessionStorage.getItem(key);
    if (migrated) return migrated;
    const legacy = localStorage.getItem(key);
    if (legacy) {
        sessionStorage.setItem(key, legacy);
        localStorage.removeItem(key);
        return legacy;
    }
    return '';
}

export function writeGatewaySecret(key: string, secret: string): void {
    sessionStorage.setItem(key, secret);
    localStorage.removeItem(key);
}

export function readGatewayUrl(key: string, fallback: string): string {
    return sessionStorage.getItem(key) || localStorage.getItem(key) || fallback;
}

export function writeGatewayUrl(key: string, url: string): void {
    sessionStorage.setItem(key, url);
    localStorage.removeItem(key);
}
