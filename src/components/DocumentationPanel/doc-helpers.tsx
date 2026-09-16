import React from 'react';
import { Search, X, ChevronRight } from 'lucide-react';
import type { DocSection, DocSearchResult } from './doc-constants';
import { NAV_ITEMS } from './doc-constants';

interface NavItemProps {
    id: DocSection;
    icon: React.ReactNode;
    label: string;
    activeSection: DocSection;
    onSelect: (id: DocSection) => void;
}

export const NavItem = React.memo<NavItemProps>(({ id, icon, label, activeSection, onSelect }) => (
    <button
        onClick={() => onSelect(id)}
        style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.8rem 1rem',
            width: '100%',
            background: activeSection === id ? 'rgba(59,130,246,0.1)' : 'transparent',
            color: activeSection === id ? '#3b82f6' : 'var(--text-muted)',
            border: '1px solid',
            borderColor: activeSection === id ? 'rgba(59,130,246,0.2)' : 'transparent',
            borderRadius: 12,
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: activeSection === id ? 700 : 600,
            transition: 'all 0.2s',
            textAlign: 'left',
        }}
        aria-pressed={activeSection === id}
    >
        <span aria-hidden="true">{icon}</span>
        {label}
    </button>
));

interface SearchBarProps {
    query: string;
    onChange: (q: string) => void;
    results: DocSearchResult[];
    onSelect: (section: DocSection) => void;
    placeholder: string;
    t: (key: string, params?: Record<string, string | number>) => string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
    query,
    onChange,
    results,
    onSelect,
    placeholder,
    t,
}) => (
    <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.6rem 1rem',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12,
            }}
        >
            <Search size={16} color="#94a3b8" />
            <input
                type="text"
                value={query}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                style={{
                    flex: 1,
                    background: 'none',
                    border: 'none',
                    outline: 'none',
                    color: 'var(--slate-50)',
                    fontSize: '0.9rem',
                }}
            />
            {query && (
                <button
                    onClick={() => onChange('')}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--slate-400)',
                    }}
                >
                    <X size={14} />
                </button>
            )}
        </div>
        {query && results.length > 0 && (
            <div
                style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    zIndex: 10,
                    background: 'var(--slate-800)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12,
                    marginTop: '0.25rem',
                    overflow: 'hidden',
                }}
            >
                {results.slice(0, 8).map((r) => (
                    <button
                        key={r.section}
                        onClick={() => {
                            onSelect(r.section);
                            onChange('');
                        }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.75rem 1rem',
                            width: '100%',
                            background: 'none',
                            border: 'none',
                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                            color: 'var(--slate-300)',
                            cursor: 'pointer',
                            textAlign: 'left',
                            fontSize: '0.85rem',
                        }}
                    >
                        <ChevronRight size={12} color="#3b82f6" />
                        <span style={{ fontWeight: 600 }}>{r.title}</span>
                        <span style={{ color: 'var(--slate-500)', marginLeft: 'auto', fontSize: '0.75rem' }}>
                            {t(NAV_ITEMS.find((n) => n.id === r.section)?.labelKey || r.section)}
                        </span>
                    </button>
                ))}
            </div>
        )}
    </div>
);

interface CodeBlockProps {
    code: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ code }) => (
    <pre
        style={{
            background: 'rgba(0,0,0,0.3)',
            padding: '1rem',
            borderRadius: 8,
            overflowX: 'auto',
            border: '1px solid rgba(255,255,255,0.05)',
            margin: '0.5rem 0',
        }}
    >
        <code
            style={{
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                color: '#a855f7',
                lineHeight: 1.6,
                whiteSpace: 'pre',
            }}
        >
            {code}
        </code>
    </pre>
);
