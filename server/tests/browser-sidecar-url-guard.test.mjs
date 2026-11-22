import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
    validateUrl,
    effectiveAllowedDomains,
    guardPageNavigations,
    isForbiddenNetworkTarget,
} from '../browser-sidecar-url-guard.mjs';

describe('browser sidecar url guard', () => {
    it('validateUrl blocks non-http and off-allowlist hosts', () => {
        assert.throws(() => validateUrl('file:///etc/passwd', []), /http\(s\)/);
        assert.throws(() => validateUrl('http://169.254.169.254/latest', ['example.com']), /allowlist/);
        assert.equal(validateUrl('https://sub.example.com/page', ['example.com']).hostname, 'sub.example.com');
    });

    it('request cannot widen the server allowlist', () => {
        assert.deepEqual(effectiveAllowedDomains(['evil.com'], ['example.com']), []);
        assert.deepEqual(effectiveAllowedDomains([], ['example.com']), ['example.com']);
        assert.deepEqual(effectiveAllowedDomains(['example.com'], []), ['example.com']);
    });

    it('blocks private, loopback and cloud-metadata targets', () => {
        const blocked = [
            'http://127.0.0.1:8080/admin',
            'http://localhost:3000/',
            'http://169.254.169.254/latest/meta-data/',
            'http://metadata.google.internal/computeMetadata/v1/',
            'http://10.0.0.5/',
            'http://192.168.1.1/',
            'http://172.16.0.1/',
            'http://[::1]/',
            'file:///etc/passwd',
        ];
        for (const url of blocked) assert.equal(isForbiddenNetworkTarget(url), true, url);
        assert.equal(isForbiddenNetworkTarget('https://example.com/page'), false);
        assert.equal(isForbiddenNetworkTarget('https://sub.example.com/a'), false);
    });

    it('guardPageNavigations blocks a forbidden sub-resource too', async () => {
        let handler;
        const page = { route: async (_p, fn) => { handler = fn; } };
        await guardPageNavigations(page, []);
        const seen = [];
        const mk = (url, nav) => ({
            request: () => ({ url: () => url, isNavigationRequest: () => nav }),
            continue: () => seen.push(`continue:${url}`),
            abort: (reason) => seen.push(`abort:${url}:${reason}`),
        });
        await handler(mk('http://169.254.169.254/latest/meta-data/', false)); // img/script
        await handler(mk('https://example.com/app.js', false));
        assert.match(seen[0], /^abort:/);
        assert.equal(seen[1], 'continue:https://example.com/app.js');
    });

    it('guardPageNavigations blocks a forbidden redirect BEFORE it is followed', async () => {
        let handler;
        const page = {
            route: async (_pattern, fn) => {
                handler = fn;
            },
        };
        await guardPageNavigations(page, ['example.com']);
        assert.equal(typeof handler, 'function');

        const seen = [];
        const mkRoute = (url, nav) => ({
            request: () => ({ url: () => url, isNavigationRequest: () => nav }),
            continue: () => seen.push(`continue:${url}`),
            abort: (reason) => seen.push(`abort:${url}:${reason}`),
        });

        await handler(mkRoute('https://example.com/ok', true));
        await handler(mkRoute('http://169.254.169.254/latest', true)); // redirect target
        await handler(mkRoute('https://evil.com/cdn.js', false)); // sub-resource

        assert.equal(seen[0], 'continue:https://example.com/ok');
        assert.match(seen[1], /^abort:http:\/\/169\.254\.169\.254\/latest:blocked by browser sidecar/);
        assert.equal(seen[2], 'continue:https://evil.com/cdn.js');
    });
});
