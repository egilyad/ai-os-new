/**
 * ESLint rule: no-raw-style-color
 *
 * FA-02 guard: forbids raw color literals (hex / rgb / rgba) inside JSX inline
 * `style={{ ... }}` objects. Components must reference the theme-aware design
 * tokens instead — `var(--token)` in CSS/JSX, or the `tokens.*` mirror from
 * `src/styles/tokens.ts` for dynamic TS-composed styles.
 *
 * The codemod `scripts/tokenize-colors.mjs` migrates existing literals; this
 * rule prevents NEW ones from sneaking back in.
 *
 * Scope: only literal string values on color-bearing style properties inside a
 * JSX `style` attribute. Dynamic values (identifiers, template literals,
 * `tokens.*`, `var(--...)`) and `...spread` fragments are intentionally ignored.
 */

const TEST_FILE = /\.(test|spec)\.[cm]?[jt]sx?$/;

const COLOR_PROPS = new Set([
    'color',
    'background',
    'backgroundColor',
    'border',
    'borderColor',
    'borderTop',
    'borderBottom',
    'borderLeft',
    'borderRight',
    'borderTopColor',
    'borderBottomColor',
    'outlineColor',
    'fill',
    'stroke',
    'caretColor',
    'boxShadow',
]);

const PURE = /^(#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})|rgba?\([^)]*\)$)/i;
const EMBEDDED = /(#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})|rgba?\([^)]*\))/i;

const SAFE = new Set([
    'transparent',
    'none',
    'inherit',
    'initial',
    'unset',
    'currentColor',
    'currentcolor',
]);

function isRawColor(value) {
    if (typeof value !== 'string') return false;
    if (value.startsWith('var(')) return false;
    if (SAFE.has(value.trim())) return false;
    return PURE.test(value) || EMBEDDED.test(value);
}

export const noRawStyleColorRule = {
    meta: {
        type: 'suggestion',
        docs: {
            description:
                'Forbid raw color literals in JSX inline style={{}} — use design tokens (var(--token) / tokens.*)',
        },
        schema: [],
        messages: {
            rawColor:
                "Raw color literal '{{value}}' in style. Use a theme-aware design token: var(--token) (CSS) or tokens.* from src/styles/tokens.ts, not a hardcoded color.",
        },
    },
    create(context) {
        const filename = context.filename ?? context.getFilename();
        if (TEST_FILE.test(filename)) return {};

        return {
            JSXAttribute(node) {
                if (node.name?.name !== 'style') return;
                const value = node.value;
                if (!value || value.type !== 'JSXExpressionContainer') return;
                const expr = value.expression;
                if (!expr || expr.type !== 'ObjectExpression') return;
                for (const prop of expr.properties) {
                    if (prop.type !== 'Property') continue; // skip ...spread
                    const key = prop.key;
                    const name =
                        key?.type === 'Identifier'
                            ? key.name
                            : key?.type === 'Literal' && typeof key.value === 'string'
                              ? key.value
                              : null;
                    if (!name || !COLOR_PROPS.has(name)) continue;
                    if (prop.value.type !== 'Literal' || typeof prop.value.value !== 'string')
                        continue;
                    if (!isRawColor(prop.value.value)) continue;
                    context.report({
                        node: prop,
                        messageId: 'rawColor',
                        data: { value: prop.value.value },
                    });
                }
            },
        };
    },
};
