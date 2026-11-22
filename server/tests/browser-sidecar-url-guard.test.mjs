import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
    validateUrl,
    effectiveAllowedDomains,
    guardPageNavigations,
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
        assert.match(seen[1], /^abort:http:\/\/169\.254\.169\.254\/latest:blocked by allowlist/);
        assert.equal(seen[2], 'continue:https://evil.com/cdn.js');
    });
});
