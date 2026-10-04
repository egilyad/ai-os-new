import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeIP, isPrivateIP } from '../net-guard.mjs';

describe('normalizeIP (T-H-5)', () => {
    it('unfolds IPv4-mapped IPv6 forms', () => {
        assert.equal(normalizeIP('::ffff:127.0.0.1'), '127.0.0.1');
        assert.equal(normalizeIP('::ffff:7f00:1'), '127.0.0.1');
    });

    it('unfolds single-number IPv4 forms', () => {
        assert.equal(normalizeIP('2130706433'), '127.0.0.1');
        assert.equal(normalizeIP('0x7f000001'), '127.0.0.1');
    });

    it('passes through ordinary hosts untouched', () => {
        assert.equal(normalizeIP('8.8.8.8'), '8.8.8.8');
        assert.equal(normalizeIP('example.com'), 'example.com');
        assert.equal(normalizeIP('2001:4860:4860::8888'), '2001:4860:4860::8888');
    });
});

describe('isPrivateIP SSRF bypass forms (T-H-5)', () => {
    it('blocks loopback in every representation', () => {
        for (const host of [
            '127.0.0.1',
            '::1',
            '[::1]',
            '::ffff:127.0.0.1',
            '::ffff:7f00:1',
            '2130706433',
            '0x7f000001',
            '0177.0.0.1',
            'localhost',
        ]) {
            assert.equal(isPrivateIP(host), true, host);
        }
    });

    it('blocks metadata, link-local, ULA and CGNAT', () => {
        for (const host of [
            '169.254.169.254',
            'fe80::1',
            'fc00::1',
            'fd00::1',
            '100.64.0.1',
            '10.0.0.5',
            '192.168.1.1',
            '172.16.0.1',
            '0.0.0.0',
        ]) {
            assert.equal(isPrivateIP(host), true, host);
        }
    });

    it('allows public addresses', () => {
        for (const host of ['8.8.8.8', '1.1.1.1', '2001:4860:4860::8888']) {
            assert.equal(isPrivateIP(host), false, host);
        }
    });
});
