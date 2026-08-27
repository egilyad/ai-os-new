import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock } from 'lucide-react';
import { sessionManager } from '../../kernel/instances';
import { eventBus } from '../../kernel/instances';
import type { DebateSession } from '../../kernel/instances';
import { useTranslation } from '../../i18n/useTranslation';
import DebateHistoryPanel from './DebateHistoryPanel';

const DebateHistoryPage: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [history, setHistory] = useState<DebateSession[]>(() =>
        sessionManager.getDebateHistory(),
    );
    const [expandedHistory, setExpandedHistory] = useState<Set<string>>(new Set());

    const refreshHistory = useCallback(() => {
        setHistory(sessionManager.getDebateHistory());
    }, []);

    useEffect(() => {
        const unsub = eventBus.onSafe<DebateSession>('debate:updated', () => {
            refreshHistory();
        });
        return unsub;
    }, [refreshHistory]);

    const handleToggleExpand = useCallback((id: string) => {
        setExpandedHistory((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    return (
        <div
            className="glass-panel"
            style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                borderRadius: 24,
                border: '1px solid rgba(255,255,255,0.05)',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '1rem 1.5rem',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    flexShrink: 0,
                }}
            >
                <button
                    onClick={() => navigate('/debate')}
                    style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: 'none',
                        borderRadius: 8,
                        padding: 8,
                        color: 'var(--slate-400)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                    title={t('common.back')}
                    aria-label={t('common.back')}
                >
                    <ArrowLeft size={18} />
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Clock size={20} color="#3b82f6" />
                    <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--slate-50)' }}>
                        {t('debate_runtime.title')}
                    </span>
                </div>
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
                <DebateHistoryPanel
                    history={history}
                    expandedHistory={expandedHistory}
                    onToggleExpand={handleToggleExpand}
                    onRefresh={refreshHistory}
                    t={t}
                />
            </div>
        </div>
    );
};

export default DebateHistoryPage;
