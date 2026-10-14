import { describe, it, expect } from 'vitest';
import { buildCredibilityPrompt } from './debate-prompt-quality-gates';

describe('buildCredibilityPrompt source links', () => {
    it('renders a markdown link when the score carries a url', () => {
        const text = buildCredibilityPrompt(
            [
                {
                    source: 'Nature study',
                    score: 0.9,
                    domainTier: 1,
                    domainLabel: 'Academic',
                    url: 'https://nature.com/articles/xyz',
                },
            ],
            'English',
        );
        expect(text).toContain('[Nature study](https://nature.com/articles/xyz)');
    });

    it('falls back to a quoted title without a url', () => {
        const text = buildCredibilityPrompt(
            [
                {
                    source: 'Some expert quote',
                    score: 0.4,
                    domainTier: 4,
                    domainLabel: 'Blog Platform',
                },
            ],
            'English',
        );
        expect(text).toContain('"Some expert quote" →');
        expect(text).not.toContain('](http');
    });

    it('strips brackets from the label so links cannot break out', () => {
        const text = buildCredibilityPrompt(
            [
                {
                    source: 'evil](https://evil.example) [title',
                    score: 0.2,
                    domainTier: 5,
                    domainLabel: 'Unknown/Unverified',
                    url: 'https://example.com/real',
                },
            ],
            'English',
        );
        expect(text).toContain(
            '[evil(https://evil.example) title](https://example.com/real)',
        );
        expect(text).not.toContain('](https://evil.example)');
    });

    it('keeps the citation rule in both languages', () => {
        const ru = buildCredibilityPrompt([], 'Russian');
        const en = buildCredibilityPrompt([], 'English');
        expect(ru).toContain('НИКОГДА не выдумывай URL');
        expect(en).toContain('NEVER invent URLs');
    });
});
