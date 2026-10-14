import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';

vi.mock('mermaid', () => ({
    default: {
        initialize: vi.fn(),
        parse: vi.fn(async (code: string) => {
            if (code.includes('not a diagram')) throw new Error('Parse error');
        }),
        render: vi.fn(async (id: string) => ({
            svg: `<svg id="${id}"><g>mock diagram</g></svg>`,
            bindFunctions: undefined,
        })),
    },
}));

// Import after the mock so the component picks it up.
import { MarkdownRenderer } from './MarkdownRenderer';

afterEach(() => cleanup());

describe('MermaidDiagram (```mermaid fences in answers)', () => {
    it('renders a valid diagram as SVG', async () => {
        const { container } = render(
            <MarkdownRenderer content={'```mermaid\ngraph TD; A-->B;\n```'} />,
        );
        await waitFor(() => {
            if (!container.querySelector('svg')) throw new Error('no svg yet');
        });
        expect(container.querySelector('svg')).not.toBeNull();
        expect(container.textContent).toContain('mock diagram');
    });

    it('degrades invalid syntax to a code block', async () => {
        const { container } = render(
            <MarkdownRenderer content={'```mermaid\nthis is not a diagram\n```'} />,
        );
        await waitFor(() => {
            if (!container.querySelector('pre')) throw new Error('no fallback yet');
        });
        expect(container.querySelector('svg')).toBeNull();
        expect(container.textContent).toContain('this is not a diagram');
    });

    it('leaves non-mermaid fences untouched', () => {
        const { container } = render(
            <MarkdownRenderer content={'```python\nprint(1)\n```'} />,
        );
        expect(container.querySelector('svg')).toBeNull();
        expect(screen.getByText('python')).toBeDefined();
        expect(container.textContent).toContain('print(1)');
    });
});
