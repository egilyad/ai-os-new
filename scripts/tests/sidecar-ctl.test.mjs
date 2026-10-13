import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const SCRIPT = path.resolve(import.meta.dirname, '..', 'sidecar-ctl.py');
const PORT = 32109; // improbable port: nothing listens here
const pidfile = path.join(os.tmpdir(), `browser-use-sidecar-${PORT}.pid`);

function ctl(...args) {
    // system python3 preferred (matches repo tooling); fallback: current node is NOT python —
    // locate a python interpreter the same way CI would (python3 on PATH).
    const py = process.env.SIDECAR_TEST_PYTHON || 'python';
    const r = spawnSync(py, [SCRIPT, ...args], { encoding: 'utf8' });
    return { code: r.status, out: `${r.stdout ?? ''}${r.stderr ?? ''}` };
}

describe('sidecar-ctl (no server boot: fast paths only)', () => {
    beforeEach(() => {
        try {
            fs.unlinkSync(pidfile);
        } catch {
            /* ignore */
        }
    });

    afterEach(() => {
        try {
            fs.unlinkSync(pidfile);
        } catch {
            /* ignore */
        }
    });

    it('status with no pidfile reports STOPPED', () => {
        const r = ctl('status', '--port', String(PORT));
        assert.notEqual(r.code, 0);
        assert.match(r.out, /STOPPED/);
    });

    it('stop with no pidfile is a no-op success', () => {
        const r = ctl('stop', '--port', String(PORT));
        assert.equal(r.code, 0);
        assert.match(r.out, /nothing to do/);
    });

    it('stale pidfile (dead pid) is reported and cleaned by stop', () => {
        fs.writeFileSync(pidfile, '2948294');
        const st = ctl('status', '--port', String(PORT));
        assert.notEqual(st.code, 0);
        assert.match(st.out, /STALE/);
        const stop = ctl('stop', '--port', String(PORT));
        assert.equal(stop.code, 0);
        assert.equal(fs.existsSync(pidfile), false);
    });

    it('--help works without side effects', () => {
        const r = ctl('--help');
        assert.equal(r.code, 0);
        assert.match(r.out, /status|start|stop/);
        assert.equal(fs.existsSync(pidfile), false);
    });
});
