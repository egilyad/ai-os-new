import { describe, expect, it, beforeEach } from 'vitest';
import { readSecret, writeSecret } from './secret-storage';

describe('secret storage', () => {
    beforeEach(() => {
        localStorage.clear();
        sessionStorage.clear();
    });

    it('читает секрет из sessionStorage и не держит его в localStorage', () => {
        writeSecret('browserUse.token', 'token-1');
        expect(sessionStorage.getItem('browserUse.token')).toBe('token-1');
        expect(localStorage.getItem('browserUse.token')).toBeNull();
        expect(readSecret('browserUse.token')).toBe('token-1');
    });

    it('мигрирует legacy-секрет в sessionStorage', () => {
        localStorage.setItem('companyGateway.secret', 'legacy-secret');
        expect(readSecret('companyGateway.secret')).toBe('legacy-secret');
        expect(sessionStorage.getItem('companyGateway.secret')).toBe('legacy-secret');
        expect(localStorage.getItem('companyGateway.secret')).toBeNull();
    });

    it('обычные настройки остаются в localStorage', () => {
        localStorage.setItem('browserUse.sidecarUrl', 'http://localhost:3100');
        expect(readSecret('browserUse.sidecarUrl')).toBe('http://localhost:3100');
        expect(sessionStorage.getItem('browserUse.sidecarUrl')).toBeNull();
    });
});
