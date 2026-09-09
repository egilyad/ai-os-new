import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Palette, RotateCcw, Download, Sun } from 'lucide-react';
import { ssrSafeStorage } from '../../kernel/utils/ssr-storage';

const TOKEN_GROUPS: Record<string, { label: string; icon: string }> = {
    bg: { label: 'Backgrounds', icon: '🎨' },
    text: { label: 'Text', icon: '📝' },
    accent: { label: 'Accent', icon: '✨' },
    border: { label: 'Borders', icon: '⊞' },
    header: { label: 'Header', icon: '📐' },
    sidebar: { label: 'Sidebar', icon: '📂' },
    success: { label: 'Success', icon: '✅' },
    error: { label: 'Error', icon: '❌' },
};

function getTokenGroup(name: string): string {
    const key = Object.keys(TOKEN_GROUPS).find(
        (g) => name.startsWith(`--${g}`) || name.includes(g),
    );
    return key || 'other';
}

function isColorValue(val: string): boolean {
    return /^(#|rgb|hsl|rgba|hsla)/i.test(val.trim());
}

function guessGroupLabel(name: string): string {
    const raw = name.replace(/^--/, '').replace(/-/g, ' ');
    return raw.charAt(0).toUpperCase() + raw.slice(1);
}

interface TokenEditorProps {
    name: string;
    value: string;
    onChange: (name: string, val: string) => void;
}

const TokenEditor: React.FC<TokenEditorProps> = ({ name, value, onChange }) => {
    const isColor = isColorValue(value);
    const [localVal, setLocalVal] = useState(value);

    useEffect(() => {
        setLocalVal(value);
    }, [value]);

    const handleChange = (newVal: string) => {
        setLocalVal(newVal);
        onChange(name, newVal);
    };

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.5rem 0.75rem',
                borderRadius: 10,
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.05)',
            }}
        >
            <div
                style={{ flex: 1, fontSize: '0.78rem', color: 'var(--slate-400)', fontFamily: 'monospace' }}
            >
                {name.replace(/^--/, '')}
            </div>
            {isColor && (
                <input
                    type="color"
                    value={localVal.startsWith('#') ? localVal : '#3b82f6'}
                    onChange={(e) => handleChange(e.target.value)}
                    style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        background: 'none',
                    }}
                    title={localVal}
                />
            )}
            <input
                type="text"
                value={localVal}
                onChange={(e) => handleChange(e.target.value)}
                style={{
                    width: 140,
                    padding: '0.3rem 0.5rem',
                    borderRadius: 6,
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'var(--slate-200)',
                    fontSize: '0.75rem',
                    fontFamily: 'monospace',
                    outline: 'none',
                    textAlign: 'right',
                }}
            />
            <div
                style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    background: isColor ? localVal : 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    flexShrink: 0,
                }}
            />
        </div>
    );
};

const STORAGE_KEY = 'design-tokens-overrides';

const AppearanceTab: React.FC = () => {
    const [tokens, setTokens] = useState<Record<string, string>>({});
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
        new Set(['bg', 'text', 'accent']),
    );
    const [copyFeedback, setCopyFeedback] = useState(false);

    useEffect(() => {
        const root = document.documentElement;
        const style = getComputedStyle(root);
        const allTokens: Record<string, string> = {};
        for (let i = 0; i < style.length; i++) {
            const prop = style[i]!;
            if (prop.startsWith('--')) {
                allTokens[prop] = style.getPropertyValue(prop).trim();
            }
        }
        // Apply saved overrides
        try {
            const saved = ssrSafeStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved) as Record<string, string>;
                for (const [k, v] of Object.entries(parsed)) {
                    allTokens[k] = v;
                    root.style.setProperty(k, v);
                }
            }
        } catch {
            /* ignore */
        }
        setTokens(allTokens);
    }, []);

    const handleTokenChange = useCallback((name: string, val: string) => {
        document.documentElement.style.setProperty(name, val);
        setTokens((prev) => ({ ...prev, [name]: val }));
    }, []);

    const groupedTokens = useMemo(() => {
        const groups: Record<string, Array<{ name: string; value: string }>> = {};
        for (const [name, value] of Object.entries(tokens)) {
            const group = getTokenGroup(name);
            if (!groups[group]) groups[group] = [];
            groups[group].push({ name, value });
        }
        return groups;
    }, [tokens]);

    const handleReset = () => {
        ssrSafeStorage.removeItem(STORAGE_KEY);
        const root = document.documentElement;
        for (const name of Object.keys(tokens)) {
            root.style.removeProperty(name);
        }
        // Reload theme by re-applying data-theme attribute
        const theme = root.getAttribute('data-theme') || 'dark';
        root.setAttribute('data-theme', theme);
        window.location.reload();
    };

    const handleSave = () => {
        const overrides: Record<string, string> = {};
        const root = document.documentElement;
        const style = getComputedStyle(root);
        for (const [name] of Object.entries(tokens)) {
            const current =
                root.style.getPropertyValue(name) || style.getPropertyValue(name).trim();
            if (current) overrides[name] = current;
        }
        ssrSafeStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
        setCopyFeedback(true);
        setTimeout(() => setCopyFeedback(false), 2000);
    };

    const handleExportCSS = () => {
        const lines: string[] = [':root {'];
        for (const [name, value] of Object.entries(tokens)) {
            lines.push(`  ${name}: ${value};`);
        }
        lines.push('}');
        const blob = new Blob([lines.join('\n')], { type: 'text/css' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'theme-override.css';
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleExportJSON = () => {
        const blob = new Blob([JSON.stringify(tokens, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'theme-tokens.json';
        a.click();
        URL.revokeObjectURL(url);
    };

    const toggleGroup = (g: string) => {
        setExpandedGroups((prev) => {
            const next = new Set(prev);
            if (next.has(g)) next.delete(g);
            else next.add(g);
            return next;
        });
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Palette size={22} color="#a855f7" />
                    <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--slate-200)' }}>
                        Design Tokens LIVE
                    </span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                        onClick={handleReset}
                        style={{
                            padding: '0.4rem 0.8rem',
                            borderRadius: 8,
                            background: 'rgba(239,68,68,0.15)',
                            border: '1px solid rgba(239,68,68,0.3)',
                            color: '#f87171',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                        }}
                    >
                        <RotateCcw size={14} /> Reset
                    </button>
                    <button
                        onClick={handleSave}
                        style={{
                            padding: '0.4rem 0.8rem',
                            borderRadius: 8,
                            background: copyFeedback
                                ? 'rgba(16,185,129,0.2)'
                                : 'rgba(59,130,246,0.15)',
                            border: `1px solid ${
                                copyFeedback ? 'rgba(16,185,129,0.4)' : 'rgba(59,130,246,0.3)'
                            }`,
                            color: copyFeedback ? '#34d399' : '#60a5fa',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                        }}
                    >
                        <Sun size={14} /> {copyFeedback ? 'Saved!' : 'Save'}
                    </button>
                    <button
                        onClick={handleExportCSS}
                        style={{
                            padding: '0.4rem 0.8rem',
                            borderRadius: 8,
                            background: 'rgba(139,92,246,0.15)',
                            border: '1px solid rgba(139,92,246,0.3)',
                            color: 'var(--purple-muted)',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                        }}
                    >
                        <Download size={14} /> CSS
                    </button>
                    <button
                        onClick={handleExportJSON}
                        style={{
                            padding: '0.4rem 0.8rem',
                            borderRadius: 8,
                            background: 'rgba(16,185,129,0.15)',
                            border: '1px solid rgba(16,185,129,0.3)',
                            color: '#34d399',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                        }}
                    >
                        <Download size={14} /> JSON
                    </button>
                </div>
            </div>

            <div
                style={{
                    fontSize: '0.82rem',
                    color: 'var(--slate-400)',
                    padding: '0.75rem 1rem',
                    background: 'rgba(168,85,247,0.06)',
                    borderRadius: 12,
                    border: '1px solid rgba(168,85,247,0.12)',
                }}
            >
                Edit design tokens in real-time. Changes are applied immediately. Use{' '}
                <strong>Save</strong> to persist across sessions, <strong>Reset</strong> to restore
                defaults, or <strong>Export</strong> to download your theme.
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {Object.entries(groupedTokens).map(([group, items]) => {
                    const groupInfo = TOKEN_GROUPS[group];
                    const isExpanded = expandedGroups.has(group);
                    return (
                        <div
                            key={group}
                            style={{
                                borderRadius: 12,
                                border: '1px solid rgba(255,255,255,0.06)',
                                overflow: 'hidden',
                            }}
                        >
                            <button
                                onClick={() => toggleGroup(group)}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem 1rem',
                                    background: 'rgba(255,255,255,0.02)',
                                    border: 'none',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    color: 'var(--slate-200)',
                                    fontWeight: 700,
                                    fontSize: '0.85rem',
                                    textAlign: 'left',
                                }}
                            >
                                <span style={{ color: 'var(--slate-500)', fontSize: '0.75rem' }}>
                                    {groupInfo?.icon || '📦'}
                                </span>
                                {groupInfo?.label || guessGroupLabel(group)}
                                <span
                                    style={{
                                        marginLeft: 'auto',
                                        fontSize: '0.7rem',
                                        color: 'var(--slate-500)',
                                    }}
                                >
                                    {items.length} tokens
                                </span>
                                <span style={{ color: 'var(--slate-500)', fontSize: '0.7rem' }}>
                                    {isExpanded ? '▼' : '▶'}
                                </span>
                            </button>
                            {isExpanded && (
                                <div
                                    style={{
                                        padding: '0.5rem 0.75rem 0.75rem',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0.4rem',
                                    }}
                                >
                                    {items.map((t) => (
                                        <TokenEditor
                                            key={t.name}
                                            name={t.name}
                                            value={t.value}
                                            onChange={handleTokenChange}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AppearanceTab;
