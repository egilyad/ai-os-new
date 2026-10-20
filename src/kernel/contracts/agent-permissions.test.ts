import { describe, expect, it } from 'vitest';
import {
    BASE_PERMISSION_RULES,
    PERMISSION_MODE_TO_PRESET,
    PERMISSION_PRESETS,
    SECRET_PROTECTION_RULES,
    actionForTool,
    evaluatePermission,
    matchPattern,
    presetById,
    rulesetForMode,
} from './agent-permissions';

describe('matchPattern', () => {
    it('matches exact values', () => {
        expect(matchPattern('t-web', 't-web')).toBe(true);
        expect(matchPattern('t-web', 't-web-search')).toBe(false);
    });

    it('supports glob wildcards', () => {
        expect(matchPattern('*', 'anything')).toBe(true);
        expect(matchPattern('*.env', '.env')).toBe(true);
        expect(matchPattern('*.env', 'config.env')).toBe(true);
        expect(matchPattern('*.env', 'env')).toBe(false);
        expect(matchPattern('tool:*', 'tool:exec')).toBe(true);
        expect(matchPattern('tool:*', 'toolx:exec')).toBe(false);
    });
});

describe('evaluatePermission', () => {
    it('returns ask when nothing matches', () => {
        expect(evaluatePermission('tool:exec', 't-code').effect).toBe('ask');
    });

    it('takes the last matching rule across rulesets', () => {
        const first = [{ action: '*', resource: '*', effect: 'allow' as const }];
        const second = [{ action: 'tool:exec', resource: '*', effect: 'deny' as const }];
        expect(evaluatePermission('tool:exec', 't-code', first, second).effect).toBe('deny');
        expect(evaluatePermission('tool:read', 't-read-file', first, second).effect).toBe(
            'allow',
        );
    });

    it('lets a later ruleset override an earlier one', () => {
        const strict = [{ action: '*', resource: '*', effect: 'deny' as const }];
        const relaxed = [{ action: 'tool:read', resource: '*', effect: 'allow' as const }];
        expect(evaluatePermission('tool:read', 't-read-file', strict, relaxed).effect).toBe(
            'allow',
        );
    });

    it('keeps secret files behind an approval in the default ruleset', () => {
        const rules = [...BASE_PERMISSION_RULES, ...SECRET_PROTECTION_RULES];
        expect(evaluatePermission('tool:read', '.env', rules).effect).toBe('ask');
        expect(evaluatePermission('tool:read', '.env.example', rules).effect).toBe('allow');
    });
});

describe('permission modes', () => {
    it('read-only denies every side-effecting action', () => {
        const rules = rulesetForMode('read-only');
        expect(evaluatePermission('tool:read', 't-read-file', rules).effect).toBe('allow');
        expect(evaluatePermission('tool:exec', 't-code', rules).effect).toBe('deny');
        expect(evaluatePermission('tool:write', 't-write', rules).effect).toBe('deny');
    });

    it('guarded asks before any side effect', () => {
        const rules = rulesetForMode('guarded');
        expect(evaluatePermission('tool:read', 't-read-file', rules).effect).toBe('allow');
        expect(evaluatePermission('tool:exec', 't-code', rules).effect).toBe('ask');
    });

    it('workspace allows local writes but asks for egress', () => {
        const rules = rulesetForMode('workspace');
        expect(evaluatePermission('tool:write', 't-write', rules).effect).toBe('allow');
        expect(evaluatePermission('tool:net', 't-web', rules).effect).toBe('ask');
    });

    it('full allows everything', () => {
        const rules = rulesetForMode('full');
        expect(evaluatePermission('tool:exec', 't-code', rules).effect).toBe('allow');
    });

    it('maps every mode onto a preset', () => {
        for (const mode of Object.keys(PERMISSION_MODE_TO_PRESET) as Array<
            keyof typeof PERMISSION_MODE_TO_PRESET
        >) {
            expect(presetById(PERMISSION_MODE_TO_PRESET[mode]).id).toBe(
                PERMISSION_MODE_TO_PRESET[mode],
            );
        }
        expect(PERMISSION_PRESETS.length).toBeGreaterThan(0);
    });
});

describe('actionForTool', () => {
    it('uses explicit metadata when provided', () => {
        expect(actionForTool('t-web', 'tool:read')).toBe('tool:read');
    });

    it('maps built-in tools to their side-effect class', () => {
        expect(actionForTool('t-read-file')).toBe('tool:read');
        expect(actionForTool('t-code')).toBe('tool:exec');
        expect(actionForTool('t-web')).toBe('tool:net');
        expect(actionForTool('t-mcp')).toBe('tool:mcp');
        expect(actionForTool('t-search')).toBe('tool:memory');
    });

    it('falls back to the conservative class for unknown tools', () => {
        expect(actionForTool('t-brand-new')).toBe('tool:exec');
    });
});
