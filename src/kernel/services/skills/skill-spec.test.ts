import { describe, expect, it } from 'vitest';
import {
    AGENT_SKILL_CATALOG,
    parseSkillMarkdown,
    renderSkillPrompt,
    resolveAgentSkills,
    validateSkillSpec,
} from './skill-spec';

const SAMPLE = `---
name: systematic-debugging
description: "Find the root cause before changing code."
version: 1.1.0
author: Hermes Agent
license: MIT
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [debugging, troubleshooting]
---

1. Read the failing code.
2. Reproduce it with \`t-code\`.
- done: Root cause confirmed.
`;

describe('parseSkillMarkdown', () => {
    it('parses frontmatter and body', () => {
        const spec = parseSkillMarkdown(SAMPLE);
        expect(spec).not.toBeNull();
        expect(spec!.name).toBe('systematic-debugging');
        expect(spec!.description).toBe('Find the root cause before changing code.');
        expect(spec!.version).toBe('1.1.0');
        expect(spec!.license).toBe('MIT');
        expect(spec!.platforms).toEqual(['linux', 'macos', 'windows']);
        expect(spec!.steps).toHaveLength(2);
        expect(spec!.steps[0]).toBe('Read the failing code.');
        expect(spec!.completionCriteria).toEqual(['Root cause confirmed.']);
    });

    it('rejects documents without frontmatter', () => {
        expect(parseSkillMarkdown('# just markdown')).toBeNull();
        expect(parseSkillMarkdown('---\nname: x\n')).toBeNull();
    });

    it('rejects frontmatter without a name or description', () => {
        expect(parseSkillMarkdown('---\ndescription: x\n---\nbody')).toBeNull();
        expect(parseSkillMarkdown('---\nname: x\n---\nbody')).toBeNull();
    });
});

describe('validateSkillSpec', () => {
    it('accepts the built-in catalogue', () => {
        for (const spec of Object.values(AGENT_SKILL_CATALOG)) {
            expect(validateSkillSpec(spec), spec.id).toEqual([]);
        }
    });

    it('rejects a long description', () => {
        const spec = { ...AGENT_SKILL_CATALOG['root-cause-analysis']! };
        spec.description = 'x'.repeat(80) + '.';
        expect(validateSkillSpec(spec).join(' ')).toMatch(/<= 60 characters/);
    });

    it('rejects a description without a final period', () => {
        const spec = { ...AGENT_SKILL_CATALOG['root-cause-analysis']! };
        spec.description = 'no trailing period';
        expect(validateSkillSpec(spec).join(' ')).toMatch(/end with a period/);
    });

    it('rejects a multi-sentence description', () => {
        const spec = { ...AGENT_SKILL_CATALOG['root-cause-analysis']! };
        spec.description = 'First part. Second part.';
        expect(validateSkillSpec(spec).join(' ')).toMatch(/single sentence/);
    });

    it('rejects a skill without steps', () => {
        const spec = { ...AGENT_SKILL_CATALOG['root-cause-analysis']!, steps: [] };
        expect(validateSkillSpec(spec).join(' ')).toMatch(/at least one step/);
    });
});

describe('resolveAgentSkills', () => {
    it('resolves declared skills and skips unknown ones', () => {
        const skills = resolveAgentSkills([
            'systematic-debugging',
            'does-not-exist',
            'root-cause-analysis',
        ]);
        expect(skills.map((s) => s.id)).toEqual([
            'systematic-debugging',
            'root-cause-analysis',
        ]);
    });
});

describe('renderSkillPrompt', () => {
    it('renders steps and completion criteria', () => {
        const rendered = renderSkillPrompt(AGENT_SKILL_CATALOG['root-cause-analysis']!);
        expect(rendered).toContain('## Навык: root-cause-analysis');
        expect(rendered).toContain('1. Опиши наблюдаемый симптом фактами.');
        expect(rendered).toContain('Готово, когда:');
    });
});
