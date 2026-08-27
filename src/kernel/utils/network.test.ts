import { describe, it, expect } from 'vitest';
import { isPrivateIP, isValidWebhookUrl } from './network';

describe('isPrivateIP', () => {
    it('rejects IPv4 private ranges', () => {
        expect(isPrivateIP('127.0.0.1')).toBe(true);
        expect(isPrivateIP('10.0.0.5')).toBe(true);
        expect(isPrivateIP('192.168.1.1')).toBe(true);
        expect(isPrivateIP('172.16.0.1')).toBe(true);
        expect(isPrivateIP('172.31.255.255')).toBe(true);
        expect(isPrivateIP('169.254.0.1')).toBe(true);
    });

    it('rejects CGNAT range 100.64.0.0/10', () => {
        expect(isPrivateIP('100.64.0.1')).toBe(true);
        expect(isPrivateIP('100.100.100.100')).toBe(true);
        expect(isPrivateIP('100.127.255.255')).toBe(true);
    });

    it('allows public IPv4 outside CGNAT', () => {
        expect(isPrivateIP('100.63.0.1')).toBe(false);
        expect(isPrivateIP('100.128.0.1')).toBe(false);
        expect(isPrivateIP('8.8.8.8')).toBe(false);
        expect(isPrivateIP('1.1.1.1')).toBe(false);
    });

    it('rejects IPv6 ULA fc00::/7 (fc and fd prefixes)', () => {
        expect(isPrivateIP('fc00:dead:beef::1')).toBe(true);
        expect(isPrivateIP('fd00:dead:beef::1')).toBe(true);
        expect(isPrivateIP('fdff:ffff::1')).toBe(true);
    });

    it('rejects IPv6 loopback and link-local', () => {
        expect(isPrivateIP('::1')).toBe(true);
        expect(isPrivateIP('[::1]')).toBe(true);
        expect(isPrivateIP('fe80::1')).toBe(true);
    });

    it('allows public IPv6', () => {
        expect(isPrivateIP('2001:4860:4860::8888')).toBe(false);
        expect(isPrivateIP('2606:4700:4700::1111')).toBe(false);
    });

    it('rejects localhost and special hosts', () => {
        expect(isPrivateIP('localhost')).toBe(true);
        expect(isPrivateIP('myhost.local')).toBe(true);
        expect(isPrivateIP('myhost.internal')).toBe(true);
        expect(isPrivateIP('0.0.0.0')).toBe(true);
    });

    it('rejects obfuscated private IPs', () => {
        expect(isPrivateIP('2130706433')).toBe(true); // 127.0.0.1 decimal
        expect(isPrivateIP('0x7f.0.0.1')).toBe(true); // 127.0.0.1 dotted-hex
        expect(isPrivateIP('0177.0.0.1')).toBe(true); // 127.0.0.1 octal
    });
});

describe('isValidWebhookUrl', () => {
    it('rejects http and private hosts', () => {
        expect(isValidWebhookUrl('http://example.com/hook')).toBe(false);
        expect(isValidWebhookUrl('https://127.0.0.1/hook')).toBe(false);
        expect(isValidWebhookUrl('https://localhost/hook')).toBe(false);
        expect(isValidWebhookUrl('https://10.0.0.1/hook')).toBe(false);
        expect(isValidWebhookUrl('https://[fd00::1]/hook')).toBe(false);
    });

    it('accepts public https hosts', () => {
        expect(isValidWebhookUrl('https://example.com/hook')).toBe(true);
        expect(isValidWebhookUrl('https://hooks.slack.com/services/abc/def')).toBe(true);
    });
});
