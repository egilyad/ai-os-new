/**
 * W6-023: cheap heuristic for catastrophic (ReDoS) regex patterns. Not a
 * substitute for a proper analyzer — just enough to reject the common
 * ambiguous-nesting forms that hang a regex engine.
 */
export function isReDoSPattern(pattern: string): boolean {
    if (/\([^)]*\+\)\s*[*+]/.test(pattern)) return true;
    if (/\([^)]*\*\)\s*[*+]/.test(pattern)) return true;
    if (/\([^)]*\{[^}]*,\s*\}\)\s*[*+]/.test(pattern)) return true;
    if (/(?:\.\*){2,}/.test(pattern)) return true;
    return false;
}
