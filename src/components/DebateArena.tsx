import React, { useState, Suspense, useEffect } from 'react';
import { MessageCircle, GitBranch } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';
import { useSearchParams } from 'react-router-dom';
import ErrorBoundary from './Common/ErrorBoundary';

const DebatePanel = React.lazy(() => import('./DebatePanel/DebatePanel'));
const DebateRuntimePanel = React.lazy(() => import('./DebateRuntimePanel/DebateRuntimePanel'));

type Mode = 'classic' | 'runtime';

const DebateArena: React.FC = () => {
    const [searchParams] = useSearchParams();
    const [mode, setMode] = useState<Mode>(() => {
        return searchParams.get('mode') === 'runtime' ? 'runtime' : 'classic';
    });
    const { t } = useTranslation();

    // Sync if URL changes externally
    useEffect(() => {
        const m = searchParams.get('mode') === 'runtime' ? 'runtime' : 'classic';
        setMode(m);
    }, [searchParams]);

    return (
        <div
            style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: 0,
                overflow: 'hidden',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    gap: 0,
                    borderBottom: '1px solid rgba(100,116,139,0.2)',
                    padding: '0 1rem',
                    flexShrink: 0,
                    background: 'rgba(15,15,30,0.4)',
                }}
            >
                <button
                    onClick={() => setMode('classic')}
                    style={{
                        padding: '0.75rem 1.5rem',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        background: 'transparent',
                        color: mode === 'classic' ? '#a78bfa' : '#64748b',
                        borderBottom:
                            mode === 'classic' ? '2px solid #a78bfa' : '2px solid transparent',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                    }}
                >
                    <MessageCircle size={16} />
                    {t('nav.debate_arena')}
                </button>
                <button
                    onClick={() => setMode('runtime')}
                    style={{
                        padding: '0.75rem 1.5rem',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        background: 'transparent',
                        color: mode === 'runtime' ? '#a78bfa' : '#64748b',
                        borderBottom:
                            mode === 'runtime' ? '2px solid #a78bfa' : '2px solid transparent',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                    }}
                >
                    <GitBranch size={16} />
                    {t('nav.debate_runtime_arena')}
                </button>
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
                <ErrorBoundary
                    name={mode === 'classic' ? 'Debate' : 'DebateRuntime'}
                    variant="panel"
                >
                    <Suspense
                        fallback={
                            <div style={{ padding: '2rem', color: 'var(--slate-500)', textAlign: 'center' }}>
                                {t('common.loading')}
                            </div>
                        }
                    >
                        {mode === 'classic' ? <DebatePanel /> : <DebateRuntimePanel />}
                    </Suspense>
                </ErrorBoundary>
            </div>
        </div>
    );
};

export default DebateArena;
