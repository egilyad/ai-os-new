import { describe, it, expect } from 'vitest';
import { escapeForScriptContent, escapeForStyleContent } from './code-escape';

describe('escapeForScriptContent (M-1)', () => {
    it('neutralizes script closers in any case/spacing', () => {
        expect(escapeForScriptContent('</script>')).toBe('<\\/script>');
        expect(escapeForScriptContent('</SCRIPT>')).toBe('<\\/script>');
        expect(escapeForScriptContent('</ script  >')).toBe('<\\/script>');
    });

    it('breaks the classic breakout payload', () => {
        const out = escapeForScriptContent('</script><script>alert(1)</script>');
        expect(out).not.toContain('</script><script>');
        // The attacker's closing tag can no longer terminate the outer block.
        expect(out.match(/<\/script/gi)?.length ?? 0).toBeLessThanOrEqual(1);
    });

    it('neutralizes HTML-comment script-hiding', () => {
        expect(escapeForScriptContent('<!--')).toBe('<\\!--');
    });

    it('leaves benign code untouched', () => {
        const code = 'const x = 1;\nconsole.log("hi <b>");';
        expect(escapeForScriptContent(code)).toBe(code);
    });
});

describe('escapeForStyleContent (M-1)', () => {
    it('neutralizes style and script closers', () => {
        expect(escapeForStyleContent('a{color:red}</style>')).not.toContain('</style>');
        expect(escapeForStyleContent('</script>')).not.toContain('</script>');
    });
});
