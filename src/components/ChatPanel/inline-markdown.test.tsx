import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { inlineMarkdown } from './inline-markdown';

afterEach(() => cleanup());

function show(text: string) {
    render(<>{inlineMarkdown(text)}</>);
}

describe('inlineMarkdown rich content (debate/chat answers)', () => {
    it('renders a markdown link as a safe external anchor', () => {
        show('see [docs](https://example.com/a) for details');
        const link = screen.getByRole('link', { name: 'docs' });
        expect(link.getAttribute('href')).toBe('https://example.com/a');
        expect(link.getAttribute('target')).toBe('_blank');
        expect(link.getAttribute('rel')).toContain('noopener');
    });

    it('does not linkify the URL inside [text](url) twice', () => {
        show('[t](https://a.b/c)');
        expect(screen.getAllByRole('link')).toHaveLength(1);
    });

    it('refuses javascript: URLs (XSS fallback to plain label)', () => {
        show('[x](javascript:alert(1))');
        expect(screen.queryByRole('link')).toBeNull();
        expect(screen.getByText('x')).toBeDefined();
    });

    it('renders an https image', () => {
        show('look ![pic](https://example.com/i.png) here');
        const img = screen.getByAltText('pic');
        expect(img.tagName).toBe('IMG');
        expect(img.getAttribute('loading')).toBe('lazy');
    });

    it('renders an image with empty alt', () => {
        show('![](https://example.com/i.png)');
        expect(document.querySelector('img')).not.toBeNull();
    });

    it('degrades a non-https image to a caption', () => {
        show('look ![pic](http://example.com/i.png) here');
        expect(document.querySelector('img')).toBeNull();
        expect(screen.getByText('[pic]')).toBeDefined();
    });

    it('collapses a broken image to its caption on load error', () => {
        show('look ![pic](https://example.com/missing.png) here');
        const img = screen.getByAltText('pic');
        fireEvent.error(img);
        expect(document.querySelector('img')).toBeNull();
        expect(screen.getByText('[pic]')).toBeDefined();
    });

    it('autolinks a bare URL', () => {
        show('open https://example.com/docs please');
        const link = screen.getByRole('link', { name: 'https://example.com/docs' });
        expect(link.getAttribute('href')).toBe('https://example.com/docs');
        expect(link.getAttribute('target')).toBe('_blank');
    });

    it('keeps sentence punctuation outside the autolinked URL', () => {
        show('open https://example.com/a.');
        const link = screen.getByRole('link');
        expect(link.getAttribute('href')).toBe('https://example.com/a');
        expect(link.textContent).toBe('https://example.com/a');
    });

    it('leaves URLs inside code spans untouched', () => {
        show('run `https://example.com` now');
        expect(screen.queryByRole('link')).toBeNull();
        expect(screen.getByText('https://example.com').tagName).toBe('CODE');
    });

    it('keeps bold/italic working (no regression)', () => {
        show('this is **bold** and *italic*');
        expect(screen.getByText('bold').textContent).toBe('bold');
        expect(screen.getByText('italic').textContent).toBe('italic');
    });

    it('leaves snake_case untouched (single _ is literal)', () => {
        show('use foo_bar_baz here');
        expect(screen.getByText('use foo_bar_baz here')).toBeDefined();
    });
});
