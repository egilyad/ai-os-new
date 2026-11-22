import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { checkCommandPolicy, truncateObservation } from '../code-runner-policy.mjs';

describe('code-runner policy', () => {
    it('blocks interactive commands', () => {
        assert.match(checkCommandPolicy('vim', ['file.txt']) ?? '', /blocked by policy/);
        assert.match(checkCommandPolicy('tail', ['-f', 'log.txt']) ?? '', /blocked by policy/);
        assert.match(checkCommandPolicy('node', ['-i']) ?? '', /interactive flag/);
    });

    it('allows normal commands', () => {
        assert.equal(checkCommandPolicy('node', ['-e', 'console.log(1)']), null);
        assert.equal(checkCommandPolicy('npm', ['test']), null);
    });

    it('honours CODE_RUNNER_ALLOW_REGEX when configured', () => {
        process.env.CODE_RUNNER_ALLOW_REGEX = '^node ';
        assert.equal(checkCommandPolicy('node', ['-e', '1']), null);
        assert.match(checkCommandPolicy('npm', ['test']) ?? '', /allow regex/);
        delete process.env.CODE_RUNNER_ALLOW_REGEX;
    });

    it('truncates with an explicit elision note and keeps head+tail', () => {
        const text = 'A'.repeat(100) + 'MIDDLE' + 'B'.repeat(100);
        const r = truncateObservation(text, 50);
        assert.equal(r.elided, text.length - 50);
        assert.match(r.text, /ELIDED \d+ chars/);
        assert.match(r.text, /^A+/);
        assert.match(r.text, /B+$/);
        assert.match(r.note, /truncated/);
    });

    it('does not alter short observations', () => {
        const r = truncateObservation('short output', 50);
        assert.equal(r.text, 'short output');
        assert.equal(r.elided, 0);
        assert.equal(r.note, '');
    });
});
