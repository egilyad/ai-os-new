import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
    Database,
    Search,
    RefreshCw,
    Download,
    ChevronDown,
    ChevronRight,
    X,
    Copy,
    Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { kernel } from '../../kernel/instances';
import { eventBus, EVENTS } from '../../kernel/instances';
import { useTranslation } from '../../i18n/useTranslation';
import { errorContainer, dismissBtnRed } from '../../styles/common';
import { Button } from '../Common';
import type { SystemState } from '../../kernel/types/metrics-types';
import { TreeNode } from './TreeNode';
import { StatBox } from './StatBox';

export const StateInspectorPanel: React.FC = () => {
    const { t } = useTranslation();
    const [state, setState] = useState<SystemState | null>(null);
    const [search, setSearch] = useState('');
    const [expanded, setExpanded] = useState<Set<string>>(
        () => new Set(['root.providers', 'root.weights']),
    );
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const isMountedRef = useRef(true);

    const refresh = useCallback(() => {
        try {
            const snap = kernel.getStateSnapshot();
            if (isMountedRef.current) setState(snap);
        } catch (err) {
            if (isMountedRef.current) setError(String(err));
        }
    }, []);

    useEffect(() => {
        isMountedRef.current = true;
        refresh();
        const unsub = eventBus.on(EVENTS.KERNEL_UPDATED, refresh);
        return () => {
            isMountedRef.current = false;
            unsub();
        };
    }, [refresh]);

    const toggle = useCallback((path: string) => {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(path)) next.delete(path);
            else next.add(path);
            return next;
        });
    }, []);

    const expandAll = useCallback(() => {
        if (!state) return;
        const all = new Set<string>();
        function walk(prefix: string, v: unknown) {
            if (v && typeof v === 'object') {
                all.add(prefix);
                if (Array.isArray(v)) {
                    v.slice(0, 4).forEach((item, i) => walk(`${prefix}.${i}`, item));
                } else {
                    Object.keys(v as object)
                        .slice(0, 4)
                        .forEach((k) => walk(`${prefix}.${k}`, (v as Record<string, unknown>)[k]));
                }
            }
        }
        walk('root', state);
        setExpanded(all);
    }, [state]);

    const collapseAll = useCallback(() => {
        setExpanded(new Set(['root']));
    }, []);

    const handleCopy = useCallback(() => {
        if (!state) return;
        try {
            navigator.clipboard.writeText(JSON.stringify(state, null, 2));
            setCopied(true);
            setTimeout(() => {
                if (isMountedRef.current) setCopied(false);
            }, 1500);
        } catch (err) {
            setError(String(err));
        }
    }, [state]);

    const handleDownload = useCallback(() => {
        if (!state) return;
        try {
            const json = JSON.stringify(state, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `system-state-${new Date().toISOString().slice(0, 19)}.json`;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                URL.revokeObjectURL(url);
                a.remove();
            }, 100);
        } catch (err) {
            setError(String(err));
        }
    }, [state]);

    const stats = useMemo(() => {
        if (!state) return null;
        return {
            providerCount: Object.keys(state.providers).length,
            decisionCount: state.decisions.length,
            violationCount: state.violations.length,
            historyCount: state.history.length,
            activeSLA: state.activeSLA,
        };
    }, [state]);

    if (!state) {
        return (
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    color: 'var(--slate-400)',
                }}
            >
                <RefreshCw size={20} className="animate-spin" />
            </div>
        );
    }

    return (
        <div
            style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                padding: '1rem',
                overflow: 'hidden',
            }}
        >
            <div
                style={{
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    paddingBottom: '0.75rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                }}
            >
                <div>
                    <h2
                        style={{
                            fontSize: '1.5rem',
                            fontWeight: 800,
                            margin: '0 0 0.25rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            color: 'var(--slate-50)',
                        }}
                    >
                        <Database size={26} color="#3b82f6" /> {t('state_inspector.title')}
                    </h2>
                    <p style={{ color: 'var(--slate-400)', margin: 0, fontSize: '0.85rem' }}>
                        {t('state_inspector.subtitle')}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <Button variant="ghost" size="sm" onClick={expandAll}>
                        <ChevronDown size={12} /> {t('state_inspector.expand_all')}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={collapseAll}>
                        <ChevronRight size={12} /> {t('state_inspector.collapse_all')}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleCopy}>
                        {copied ? <Check size={12} color="#10b981" /> : <Copy size={12} />}{' '}
                        {copied ? t('state_inspector.copied') : t('state_inspector.copy')}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleDownload}>
                        <Download size={12} /> {t('state_inspector.download')}
                    </Button>
                </div>
            </div>

            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={errorContainer}
                >
                    {error}
                    <button onClick={() => setError(null)} style={dismissBtnRed}>
                        <X size={18} />
                    </button>
                </motion.div>
            )}

            {stats && (
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(5, 1fr)',
                        gap: '0.4rem',
                    }}
                >
                    <StatBox
                        label={t('state_inspector.providers')}
                        value={stats.providerCount}
                        color="#3b82f6"
                    />
                    <StatBox
                        label={t('state_inspector.decisions')}
                        value={stats.decisionCount}
                        color="#10b981"
                    />
                    <StatBox
                        label={t('state_inspector.violations')}
                        value={stats.violationCount}
                        color="#ef4444"
                    />
                    <StatBox
                        label={t('state_inspector.history')}
                        value={stats.historyCount}
                        color="#a855f7"
                    />
                    <StatBox
                        label={t('state_inspector.sla')}
                        value={stats.activeSLA}
                        color="#f59e0b"
                    />
                </div>
            )}

            <div style={{ position: 'relative', flex: '0 0 auto' }}>
                <Search
                    size={14}
                    style={{ position: 'absolute', left: 8, top: 8, color: 'var(--slate-400)' }}
                />
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t('state_inspector.search_placeholder')}
                    style={{
                        width: '100%',
                        padding: '0.4rem 0.5rem 0.4rem 28px',
                        borderRadius: 6,
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'rgba(0,0,0,0.3)',
                        color: 'var(--slate-200)',
                        fontSize: '0.8rem',
                    }}
                />
            </div>

            <div
                style={{
                    flex: 1,
                    overflow: 'auto',
                    borderRadius: 8,
                    border: '1px solid rgba(255,255,255,0.05)',
                    background: 'rgba(0,0,0,0.2)',
                    padding: '0.5rem',
                }}
            >
                <AnimatePresence>
                    {Object.entries(state as unknown as Record<string, unknown>).map(([k, v]) => (
                        <TreeNode
                            key={k}
                            keyName={k}
                            value={v}
                            depth={0}
                            expanded={expanded}
                            toggle={toggle}
                            search={search}
                            path={`root.${k}`}
                        />
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default StateInspectorPanel;
