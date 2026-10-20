import { describe, expect, it } from 'vitest';
import {
    TOOL_GROUPS,
    TOOL_PROFILES,
    groupOfTool,
    resolveToolSet,
    toolsOfGroup,
} from './tool-groups';

describe('tool groups and profiles', () => {
    it('expands a profile into its groups', () => {
        const tools = resolveToolSet('minimal');
        expect(tools).toContain('t-search');
        expect(tools).toContain('t-read-file');
        expect(tools).not.toContain('t-web');
    });

    it('coding profile includes code, web and mcp tools', () => {
        const tools = resolveToolSet('coding');
        expect(tools).toContain('t-code');
        expect(tools).toContain('t-web');
        expect(tools).toContain('t-mcp');
    });

    it('deny always beats allow', () => {
        const tools = resolveToolSet('full', { allow: ['t-web'], deny: ['t-web'] });
        expect(tools).not.toContain('t-web');
    });

    it('removes unavailable tools', () => {
        const tools = resolveToolSet('coding', { available: ['t-code', 't-read-file'] });
        expect(tools).toEqual(['t-read-file', 't-code'].filter((t) => t !== 't-web'));
        expect(tools).not.toContain('t-web');
    });

    it('resolves the group of a tool', () => {
        expect(groupOfTool('t-web')).toBe('group:web');
        expect(groupOfTool('t-mcp')).toBe('group:mcp');
        expect(groupOfTool('t-unknown')).toBeUndefined();
        expect(toolsOfGroup('group:fs')).toContain('t-read-file');
    });

    it('every group belongs to a known profile', () => {
        const groupIds = Object.keys(TOOL_GROUPS);
        const used = new Set(Object.values(TOOL_PROFILES).flatMap((p) => p.groups));
        for (const id of groupIds) expect(used.has(id as never)).toBe(true);
    });
});

