export interface TruncatedObservation {
    text: string;
    elided: number;
}

export interface CommandPolicy {
    blocklist?: RegExp[];
    allowRegex?: RegExp;
}

export interface CommandDecision {
    allowed: boolean;
    reason?: string;
}

const INTERACTIVE_BLOCKLIST: RegExp[] = [
    /(?:^|[;&|]\s*)(?:sudo\s+)?(?:vim|vi|nano|emacs|ed)\b/i,
    /(?:^|[;&|]\s*)tail\s+(?:-[a-zA-Z]*f|--follow)\b/i,
    /(?:^|[;&|]\s*)(?:less|more|top|htop|watch)\b/i,
];

export function truncateObservation(value: unknown, maxChars = 4000): TruncatedObservation {
    if (!Number.isFinite(maxChars) || maxChars < 64) {
        throw new Error('truncateObservation: maxChars must be >= 64');
    }
    const raw = typeof value === 'string' ? value : safeStringify(value);
    const probe = `\n…[elided ${raw.length} chars; use head/tail/grep on the source]\n`;
    if (raw.length <= maxChars) return { text: raw, elided: 0 };
    const half = Math.max(1, Math.floor((maxChars - probe.length) / 2));
    if (half * 2 + probe.length > maxChars) {
        return { text: raw.slice(0, maxChars), elided: raw.length - maxChars };
    }
    const elided = raw.length - half * 2;
    const note = `\n…[elided ${elided} chars; use head/tail/grep on the source]\n`;
    return {
        text: `${raw.slice(0, half)}${note}${raw.slice(raw.length - half)}`,
        elided,
    };
}

export function checkCommand(command: string, policy: CommandPolicy = {}): CommandDecision {
    if (typeof command !== 'string' || command.trim().length === 0) {
        return { allowed: false, reason: 'empty command' };
    }
    if (policy.allowRegex?.test(command)) return { allowed: true };
    const blocked = [...INTERACTIVE_BLOCKLIST, ...(policy.blocklist ?? [])].find((re) =>
        re.test(command),
    );
    if (blocked) return { allowed: false, reason: `blocked by policy: ${blocked.source}` };
    if (policy.allowRegex) return { allowed: false, reason: 'command does not match allowRegex' };
    return { allowed: true };
}

export function terminalCommandFromInput(input: Record<string, unknown>): string | null {
    const action = typeof input['action'] === 'string' ? input['action'] : '';
    if (!['type', 'key', 'hold_key'].includes(action)) return null;
    const explicit =
        input['terminal'] === true ||
        input['shell'] === true ||
        (typeof input['target'] === 'string' &&
            /terminal|shell|console|cmd|powershell/i.test(input['target']));
    if (!explicit) return null;
    for (const key of ['text', 'command', 'keys', 'value']) {
        const value = input[key];
        if (typeof value === 'string' && value.trim().length > 0) return value;
    }
    return null;
}

function safeStringify(value: unknown): string {
    if (value === undefined) return 'undefined';
    try {
        return JSON.stringify(value) ?? String(value);
    } catch {
        return String(value);
    }
}
