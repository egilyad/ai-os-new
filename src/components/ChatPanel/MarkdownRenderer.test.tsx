import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { MarkdownRenderer } from './MarkdownRenderer';

afterEach(() => cleanup());

describe('MarkdownRenderer blank lines', () => {
    it('preserves blank lines as breaks instead of dropping them', () => {
        const { container } = render(
            <MarkdownRenderer content={'para one\n\npara two'} />,
        );
        expect(container.querySelector('br')).not.toBeNull();
        expect(container.textContent).toContain('para one');
        expect(container.textContent).toContain('para two');
    });

    it('renders multiple paragraphs separated by breaks', () => {
        const { container } = render(
            <MarkdownRenderer content={'a\n\n\nb'} />,
        );
        expect(container.querySelectorAll('br').length).toBeGreaterThanOrEqual(1);
        expect(container.textContent).toContain('a');
        expect(container.textContent).toContain('b');
    });
});
