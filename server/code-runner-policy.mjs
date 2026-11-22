/**
 * Code-runner safety policy (SWE-agent-inspired, I1+I2).
 *
 * I1 — observation truncation WITH elision accounting: an agent must know
 * that output was clipped and how much, otherwise it reasons over a partial
 * observation as if it were complete.
 * I2 — command blocklist / regex-allow: interactive and long-running commands
 * hang autonomous tool loops; block them before spawn.
 */

const INTERACTIVE_BLOCKLIST = [
    'vim',
    'vi',
    'nano',
    'emacs',
    'less',
    'more',
    'top',
    'htop',
    'tail -f',
    'watch',
];

/** Additional per-deployment blocklist from env (comma-separated names). */
function extraBlocklist() {
    return (process.env.CODE_RUNNER_BLOCKLIST || '')
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
}

/**
 * Returns an error string when the command must be refused, else null.
 * `cmd` is the resolved binary name (e.g. 'node'), `args` the argument list.
 */
export function checkCommandPolicy(cmd, args) {
    const name = String(cmd || '').toLowerCase();
    const joined = `${name} ${(args || []).join(' ')}`.toLowerCase();
    const blocked = [...INTERACTIVE_BLOCKLIST, ...extraBlocklist()];
    for (const item of blocked) {
        if (joined.includes(item)) {
            return `command blocked by policy: ${item}`;
        }
    }
    // Interactive flags on otherwise allowed binaries.
    if (/(^|\s)(-i|--interactive)(\s|$)/.test(joined)) {
        return 'command blocked by policy: interactive flag';
    }
    // Explicit allow regex from env: when set, every command must match it.
    const allow = process.env.CODE_RUNNER_ALLOW_REGEX || '';
    if (allow) {
        try {
            if (!new RegExp(allow, 'i').test(joined)) {
                return `command blocked by allow regex: ${allow}`;
            }
        } catch {
            return 'command blocked by policy: invalid allow regex configuration';
        }
    }
    return null;
}

/**
 * Clip an observation to `limit` chars, reporting elision to the agent.
 * Keeps head and tail so both the beginning and the final result stay visible.
 */
export function truncateObservation(text, limit = 6000) {
    const str = String(text ?? '');
    if (str.length <= limit) return { text: str, elided: 0, note: '' };
    const elided = str.length - limit;
    const head = Math.ceil(limit * 0.6);
    const tail = limit - head;
    const clipped = `${str.slice(0, head)}\n... [ELIDED ${elided} chars] ...\n${str.slice(-tail)}`;
    return {
        text: clipped,
        elided,
        note: `Observation truncated: ${elided} chars elided (head ${head} + tail ${tail} kept). Use head/tail/grep on the source to inspect the rest.`,
    };
}
