import React, { useEffect, useMemo, useState, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { eventBus, EVENTS, rootLogger } from '../../kernel/instances';
const LOGGER = rootLogger.child('DashboardPanel');
import { kernel } from '../../kernel/instances';
import { settingsService } from '../../kernel/instances';
import { agentService } from '../../kernel/instances/services-core';
import { useKeyStore } from '../../stores/useKeyStore';
import { useAutoClearError } from '../../hooks/useAutoClearError';
import { useTranslation } from '../../i18n/useTranslation';
import ModuleInfo from '../ModuleInfo';
import type { SystemState } from '../../types/metrics';
import DashboardHeader from './DashboardHeader';
import GetStartedPanel from './GetStartedPanel';
import QuickActionBar from './QuickActionBar';
import CriticalAlertBanner from './CriticalAlertBanner';
import WelcomePanel from './WelcomePanel';
import Desktop from './Desktop';
import { dismissBtn, errorBanner } from '../../styles/common';

interface DashboardPanelProps {
    onNavigate: (page: string) => void;
}

const DashboardPanel: React.FC<DashboardPanelProps> = ({ onNavigate }) => {
    const rawKeys = useKeyStore((s) => s.keys);
    const checkAllHealth = useKeyStore((s) => s.checkAllHealth);
    const keys = useMemo(() => rawKeys ?? [], [rawKeys]);
    const [systemState, setSystemState] = useState<SystemState>(() => kernel.getState());
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'desktop' | 'cards'>('desktop');
    const settings = (() => {
        try {
            return settingsService.getSettings();
        } catch {
            return {
                theme: 'dark' as const,
                language: 'en',
                notifications: true,
                autoSave: true,
                fontSize: 14,
                codeTheme: 'dark',
                enableVault: false,
                vaultTimeout: 5,
                model: 'auto',
                temperature: 0.7,
                maxTokens: 2048,
                presencePenalty: 0,
                frequencyPenalty: 0,
            };
        }
    })();
    const fallbackEnabled = 'fallbackEnabled' in settings ? settings.fallbackEnabled : true;
    const { t } = useTranslation();

    const isMountedRef = useRef(true);

    const clearError = useAutoClearError(setError);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        const unsubscribeKernel = eventBus.on(EVENTS.KERNEL_UPDATED, (state) => {
            if (!isMountedRef.current) return;
            try {
                setSystemState(state as unknown as SystemState);
                setError(null);
            } catch (e) {
                LOGGER.warn('DashboardPanel', 'Failed to update system state', { error: e });
                if (isMountedRef.current) {
                    setError('Failed to update system state');
                    clearError();
                }
            }
        });
        // SI-41: Immediately re-read state after subscribing to catch updates
        // between useState initializer and useEffect subscription
        try {
            setSystemState({ ...kernel.getState() });
        } catch {
            /* kernel may not be ready */
        }

        return () => {
            unsubscribeKernel();
        };
    }, [clearError, t]);

    const providerCounts = useMemo(
        () => ({
            active: (keys ?? []).filter((k) => k.status === 'active').length,
            checking: (keys ?? []).filter((k) => k.status === 'checking').length,
            error: (keys ?? []).filter((k) => k.status === 'error').length,
            inactive: (keys ?? []).filter((k) => k.status === 'inactive').length,
        }),
        [keys],
    );

    const hasProviderErrors =
        providerCounts.error > 0 || (systemState?.violations?.length ?? 0) > 0;

    const showAgentsEmpty = (() => {
        try {
            return (agentService.getAgents?.() ?? []).length === 0;
        } catch {
            return false;
        }
    })();

    return (
        <div
            style={{
                color: 'var(--text-main)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem',
                height: '100%',
                overflowY: 'auto',
                paddingRight: '0.5rem',
            }}
        >
            <DashboardHeader checkAllHealth={checkAllHealth} onNavigate={onNavigate} />

            <GetStartedPanel
                show={providerCounts.active === 0 && keys.length === 0}
                onNavigate={onNavigate}
            />

            {showAgentsEmpty && (
                <div style={{ display: 'flex', gap: '1rem', padding: '1.25rem', borderRadius: 14, border: '1px solid rgba(139,92,246,0.25)', background: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(59,130,246,0.08))', alignItems: 'center' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>🤖</div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, color: 'var(--slate-50)', fontSize: '0.95rem' }}>{t('onboarding.agents_get_started_title') ?? 'Create your first agent'}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--slate-400)', marginTop: 2 }}>{t('onboarding.agents_get_started_body') ?? 'Agents are your AI workforce. Create one to start debates, chats, and tasks.'}</div>
                    </div>
                    <button onClick={() => onNavigate('agents')} style={{ padding: '0.55rem 1.1rem', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>{t('onboarding.create_agent') ?? 'Create Agent'}</button>
                </div>
            )}

            <QuickActionBar onNavigate={onNavigate} />

            <CriticalAlertBanner
                show={hasProviderErrors}
                providerErrors={providerCounts.error}
                violations={systemState.violations?.length ?? 0}
                fallbackEnabled={fallbackEnabled}
                onNavigate={onNavigate}
            />

            {error && (
                <div style={errorBanner} role="alert">
                    <AlertTriangle size={14} aria-hidden="true" /> {error}
                    <button
                        onClick={() => setError(null)}
                        style={dismissBtn}
                        aria-label={t('common.dismiss_error')}
                    >
                        <X size={14} aria-hidden="true" />
                    </button>
                </div>
            )}

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <button
                    onClick={() => setViewMode('desktop')}
                    style={{
                        padding: '0.45rem 1rem',
                        borderRadius: 10,
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: viewMode === 'desktop' ? 'linear-gradient(90deg, #3b82f6, #2563eb)' : 'rgba(255,255,255,0.04)',
                        color: viewMode === 'desktop' ? 'white' : 'var(--slate-300)',
                    }}
                >
                    💻 Рабочий стол
                </button>
                <button
                    onClick={() => setViewMode('cards')}
                    style={{
                        padding: '0.45rem 1rem',
                        borderRadius: 10,
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: viewMode === 'cards' ? 'linear-gradient(90deg, #8b5cf6, #7c3aed)' : 'rgba(255,255,255,0.04)',
                        color: viewMode === 'cards' ? 'white' : 'var(--slate-300)',
                    }}
                >
                    🃏 Карточки
                </button>
            </div>

            {viewMode === 'desktop' ? (
                <Desktop onNavigate={onNavigate} />
            ) : (
                <WelcomePanel onNavigate={onNavigate} />
            )}

            <ModuleInfo moduleKey="dashboard" />
        </div>
    );
};

export default DashboardPanel;
