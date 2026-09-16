import React, { useState } from 'react';
import { GitBranch, Activity, Settings2, FlaskConical } from 'lucide-react';
import { useRoutingIntelligence } from '../../hooks/useRoutingIntelligence';
import type { FallbackLink } from '../../kernel/instances';
import type { RouterDecision } from '../../kernel/instances';
import { useTranslation } from '../../i18n/useTranslation';
import ModuleInfo from '../ModuleInfo';
import ABTestPanel from './ABTestPanel';
import DecisionTreeTab from './DecisionTreeTab';
import HistoryTab from './HistoryTab';
import AdvancedTab from './AdvancedTab';
import { flexCenterGap4 } from '../../styles/common';
import { Button } from '../../components/Common';

const RoutingIntelligence: React.FC = () => {
    const [selected, setSelected] = useState<RouterDecision | null>(null);
    const [view, setView] = useState<'history' | 'decision-tree' | 'advanced' | 'ab-test'>(
        'history',
    );
    const { decisions, config, slaMode, abTest, actions } = useRoutingIntelligence();
    const { setConfig } = actions;
    const { t } = useTranslation();

    const saveFallback = (strategy: string, chain: FallbackLink[]) => {
        actions.setFallbackChain(strategy, chain);
    };

    const saveDowngrade = (model: string, chain: string[]) => {
        actions.setDowngradeChain(model, chain);
    };

    const updateFallbackLink = (strategy: string, idx: number, patch: Partial<FallbackLink>) => {
        setConfig((current) => {
            if (!current) return current;
            const chain = current.fallbackChains[strategy] || [];
            return {
                ...current,
                fallbackChains: {
                    ...current.fallbackChains,
                    [strategy]: chain.map((link, i) => (i === idx ? { ...link, ...patch } : link)),
                },
            };
        });
    };

    const addFallbackLink = (strategy: string) => {
        setConfig((current) => {
            if (!current) return current;
            const chain = current.fallbackChains[strategy] || [];
            return {
                ...current,
                fallbackChains: {
                    ...current.fallbackChains,
                    [strategy]: [...chain, { provider: '', model: '' }],
                },
            };
        });
    };

    const removeFallbackLink = (strategy: string, idx: number) => {
        setConfig((current) => {
            if (!current) return current;
            const chain = current.fallbackChains[strategy] || [];
            return {
                ...current,
                fallbackChains: {
                    ...current.fallbackChains,
                    [strategy]: chain.filter((_, i) => i !== idx),
                },
            };
        });
    };

    const moveFallbackLink = (strategy: string, idx: number, direction: -1 | 1) => {
        setConfig((current) => {
            if (!current) return current;
            const chain = [...(current.fallbackChains[strategy] || [])];
            const nextIdx = idx + direction;
            if (nextIdx < 0 || nextIdx >= chain.length) return current;
            const a = chain[idx]!;
            const b = chain[nextIdx]!;
            chain[idx] = b;
            chain[nextIdx] = a;
            return {
                ...current,
                fallbackChains: {
                    ...current.fallbackChains,
                    [strategy]: chain,
                },
            };
        });
    };

    const updateDowngradeItem = (model: string, idx: number, value: string) => {
        setConfig((current) => {
            if (!current) return current;
            const chain = current.modelDowngradeChains[model] || [];
            return {
                ...current,
                modelDowngradeChains: {
                    ...current.modelDowngradeChains,
                    [model]: chain.map((item, i) => (i === idx ? value : item)),
                },
            };
        });
    };

    const renameDowngradeChain = (model: string, nextModel: string) => {
        setConfig((current) => {
            if (!current || nextModel === model || nextModel.length === 0) return current;
            if (current.modelDowngradeChains[nextModel]) return current;
            const entries = Object.entries(current.modelDowngradeChains).map(([key, value]) =>
                key === model ? [nextModel, value] : [key, value],
            );
            return {
                ...current,
                modelDowngradeChains: Object.fromEntries(entries) as Record<string, string[]>,
            };
        });
    };

    const addDowngradeItem = (model: string) => {
        setConfig((current) => {
            if (!current) return current;
            const chain = current.modelDowngradeChains[model] || [];
            return {
                ...current,
                modelDowngradeChains: {
                    ...current.modelDowngradeChains,
                    [model]: [...chain, ''],
                },
            };
        });
    };

    const removeDowngradeItem = (model: string, idx: number) => {
        setConfig((current) => {
            if (!current) return current;
            const chain = current.modelDowngradeChains[model] || [];
            return {
                ...current,
                modelDowngradeChains: {
                    ...current.modelDowngradeChains,
                    [model]: chain.filter((_, i) => i !== idx),
                },
            };
        });
    };

    const addDowngradeChain = () => {
        setConfig((current) => {
            if (!current) return current;
            const base = 'new-model';
            let name = base;
            let idx = 1;
            while (current.modelDowngradeChains[name]) {
                idx += 1;
                name = `${base}-${idx}`;
            }
            return {
                ...current,
                modelDowngradeChains: {
                    ...current.modelDowngradeChains,
                    [name]: [''],
                },
            };
        });
    };

    const removeDowngradeChain = (model: string) => {
        setConfig((current) => {
            if (!current) return current;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { [model]: _unused, ...rest } = current.modelDowngradeChains;
            return {
                ...current,
                modelDowngradeChains: rest,
            };
        });
    };

    const updateSlaMode = (mode: string) => {
        actions.setSlaMode(mode);
    };

    return (
        <div style={{ padding: '2rem', maxWidth: 1200, margin: '0 auto' }}>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '2rem',
                }}
            >
                <div style={flexCenterGap4}>
                    <GitBranch size={28} style={{ color: 'var(--purple)' }} />
                    <div>
                        <div
                            style={{
                                fontSize: '1.3rem',
                                fontWeight: 800,
                                color: 'var(--slate-50)',
                            }}
                        >
                            {t('routing.title')}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>
                            {t('routing.subtitle')}
                        </div>
                    </div>
                </div>
                <div
                    style={{
                        display: 'flex',
                        gap: '0.5rem',
                        background: 'rgba(255,255,255,0.05)',
                        padding: '0.3rem',
                        borderRadius: 12,
                    }}
                >
                    <Button
                        variant="ghost"
                        onClick={() => setView('history')}
                        style={{
                            background: view === 'history' ? 'rgba(139,92,246,0.2)' : 'transparent',
                            color: view === 'history' ? '#f8fafc' : '#64748b',
                        }}
                    >
                        <Activity size={16} /> {t('routing.tab.history')}
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={() => setView('decision-tree')}
                        style={{
                            background:
                                view === 'decision-tree' ? 'rgba(139,92,246,0.2)' : 'transparent',
                            color: view === 'decision-tree' ? '#f8fafc' : '#64748b',
                        }}
                    >
                        <GitBranch size={16} /> {t('routing.tab.decision_tree')}
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={() => setView('advanced')}
                        style={{
                            background:
                                view === 'advanced' ? 'rgba(139,92,246,0.2)' : 'transparent',
                            color: view === 'advanced' ? '#f8fafc' : '#64748b',
                        }}
                    >
                        <Settings2 size={16} /> {t('routing.tab.advanced')}
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={() => setView('ab-test')}
                        style={{
                            background: view === 'ab-test' ? 'rgba(139,92,246,0.2)' : 'transparent',
                            color: view === 'ab-test' ? '#f8fafc' : '#64748b',
                        }}
                    >
                        <FlaskConical size={16} /> A/B Test
                    </Button>
                </div>
            </div>

            {view === 'ab-test' ? (
                <ABTestPanel
                    abTest={abTest}
                    profiles={config?.weightProfiles ? Object.keys(config.weightProfiles) : []}
                    actions={actions}
                />
            ) : view === 'decision-tree' ? (
                <DecisionTreeTab decisions={decisions} />
            ) : view === 'history' ? (
                <HistoryTab decisions={decisions} selected={selected} onSelect={setSelected} />
            ) : (
                <AdvancedTab
                    config={config}
                    slaMode={slaMode}
                    actions={actions}
                    updateSlaMode={updateSlaMode}
                    saveFallback={saveFallback}
                    saveDowngrade={saveDowngrade}
                    addFallbackLink={addFallbackLink}
                    removeFallbackLink={removeFallbackLink}
                    moveFallbackLink={moveFallbackLink}
                    updateFallbackLink={updateFallbackLink}
                    updateDowngradeItem={updateDowngradeItem}
                    renameDowngradeChain={renameDowngradeChain}
                    addDowngradeItem={addDowngradeItem}
                    removeDowngradeItem={removeDowngradeItem}
                    addDowngradeChain={addDowngradeChain}
                    removeDowngradeChain={removeDowngradeChain}
                />
            )}
            <ModuleInfo moduleKey="routing" />
        </div>
    );
};

export default RoutingIntelligence;
