/**
 * M-1: escaping helpers for LLM-produced code interpolated into sandbox
 * documents. Pure module — no DOM, no React, no kernel imports, so it is
 * unit-testable in isolation.
 */

/** Neutralize `</script>` (any case/spacing) inside <script> content. */
export function escapeForScriptContent(s: string): string {
    return s.replace(/<\/\s*script\s*>/gi, '<\\/script>').replace(/<!--/g, '<\\!--');
}

/** Neutralize `</style>` and `</script>` closers inside <style> content. */
export function escapeForStyleContent(s: string): string {
    // Prevent breaking out of <style> tag — neutralize </style> and </script> closers
    return s.replace(/<\/\s*(style|script)\s*>/gi, '\\x3c/$1>');
}
