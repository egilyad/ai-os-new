import { describe, it, expect } from 'vitest';
import { isPrivateIP, isValidWebhookUrl, validateIntegrationUrl } from './network';

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

describe('validateIntegrationUrl (C-3)', () => {
    const ok = (url: string) => expect(validateIntegrationUrl(url)).toEqual({ ok: true });
    const bad = (url: string) =>
        expect(validateIntegrationUrl(url).ok).toBe(false);

    it('accepts public https and self-hosted http hosts', () => {
        ok('https://n8n.example.com/');
        ok('http://n8n.example.com:5678/');
        // RFC1918 LAN is the primary self-hosted case — allowed by design.
        ok('http://192.168.1.10:5678/');
        ok('http://10.0.0.5:5678/');
    });

    it('rejects non-http schemes, creds and garbage', () => {
        bad('javascript:alert(1)');
        bad('file:///etc/passwd');
        bad('ftp://n8n.example.com/');
        bad('not a url');
        bad('');
        bad('https://user:pass@n8n.example.com/');
    });

    it('rejects loopback, metadata and obfuscated forms', () => {
        bad('http://127.0.0.1:5678/');
        bad('http://localhost:5678/');
        bad('http://[::1]:5678/');
        bad('http://0.0.0.0:5678/');
        bad('http://169.254.169.254/latest/meta-data/');
        bad('http://169.254.10.20/');
        bad('http://2130706433/'); // 127.0.0.1 decimal
        bad('http://0x7f.0.0.1/'); // 127.0.0.1 dotted-hex
        bad('http://0177.0.0.1/'); // 127.0.0.1 octal
        bad('http://[::ffff:127.0.0.1]/');
        bad('http://evil.localhost/');
    });
});
