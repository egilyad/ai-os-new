import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { highlightCode } from './highlight-utils';

describe('highlightCode language mapping', () => {
    it('highlights ```py fences with Python keywords, not TS fallback', () => {
        const py = renderToStaticMarkup(<>{highlightCode('def foo():', 'py')}</>);
        expect(py).toContain('def');
        expect(py).toContain('#c084fc');
        const ts = renderToStaticMarkup(<>{highlightCode('def foo():', 'ts')}</>);
        expect(ts).not.toContain('#c084fc');
    });

    it('keeps python fence mapping working', () => {
        const out = renderToStaticMarkup(<>{highlightCode('def foo():', 'python')}</>);
        expect(out).toContain('#c084fc');
    });
});
