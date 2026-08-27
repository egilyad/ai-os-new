import { SlidersHorizontal } from 'lucide-react';
import type { FallbackLink } from '../../kernel/instances';
import type { RouterConfig } from '../../kernel/types/routing-types';
import type { RoutingPolicySnapshot } from '../../kernel/contracts/routing-policy';
import WeightTunerInner from './WeightTunerInner';
import SlaModeSection from './SlaModeSection';
import WeightProfilesSection from './WeightProfilesSection';
import FallbackChainSection from './FallbackChainSection';
import DowngradeMapSection from './DowngradeMapSection';
import { flexColGap5, glassPanel, sectionHeader } from '../../styles/common';

interface Props {
    config: (RoutingPolicySnapshot & Pick<RouterConfig, 'activeProfile' | 'weightProfiles'>) | null;
    slaMode: string;
    actions: {
        setActiveProfile: (name: string) => Promise<void>;
        updateActiveProfileWeights: (w: {
            ttft: number;
            tps: number;
            reliability: number;
        }) => Promise<void>;
        setSlaMode: (mode: string) => void;
        setFallbackChain: (strategy: string, chain: FallbackLink[]) => void;
        setDowngradeChain: (model: string, chain: string[]) => void;
    };
    updateSlaMode: (mode: string) => void;
    saveFallback: (strategy: string, chain: FallbackLink[]) => void;
    saveDowngrade: (model: string, chain: string[]) => void;
    addFallbackLink: (strategy: string) => void;
    removeFallbackLink: (strategy: string, idx: number) => void;
    moveFallbackLink: (strategy: string, idx: number, direction: -1 | 1) => void;
    updateFallbackLink: (strategy: string, idx: number, patch: Partial<FallbackLink>) => void;
    updateDowngradeItem: (model: string, idx: number, value: string) => void;
    renameDowngradeChain: (model: string, nextModel: string) => void;
    addDowngradeItem: (model: string) => void;
    removeDowngradeItem: (model: string, idx: number) => void;
    addDowngradeChain: () => void;
    removeDowngradeChain: (model: string) => void;
}

function AdvancedTab({
    config,
    slaMode,
    actions,
    updateSlaMode,
    saveFallback,
    saveDowngrade,
    addFallbackLink,
    removeFallbackLink,
    moveFallbackLink,
    updateFallbackLink,
    updateDowngradeItem,
    renameDowngradeChain,
    addDowngradeItem,
    removeDowngradeItem,
    addDowngradeChain,
    removeDowngradeChain,
}: Props) {
    return (
        <div style={flexColGap5}>
            <SlaModeSection slaMode={slaMode} onUpdate={updateSlaMode} />
            <WeightProfilesSection
                weightProfiles={config?.weightProfiles}
                activeProfile={config?.activeProfile}
                onSetActive={actions.setActiveProfile}
            />
            <div className="glass-panel" style={glassPanel}>
                <h3 style={sectionHeader}>
                    <SlidersHorizontal size={18} color="#3b82f6" /> Weight Tuner &mdash;{' '}
                    {config?.activeProfile || 'default'}
                </h3>
                {config?.weightProfiles?.[config?.activeProfile || 'default'] ? (
                    <WeightTunerInner
                        profile={config.weightProfiles[config.activeProfile!]!}
                        actions={actions}
                    />
                ) : (
                    <div style={{ color: 'var(--slate-500)', fontSize: '0.8rem' }}>No active profile</div>
                )}
            </div>
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
                    gap: '1.25rem',
                }}
            >
                {config && (
                    <FallbackChainSection
                        fallbackChains={config.fallbackChains}
                        onSave={saveFallback}
                        onAdd={addFallbackLink}
                        onRemove={removeFallbackLink}
                        onMove={moveFallbackLink}
                        onUpdate={updateFallbackLink}
                    />
                )}
                {config && (
                    <DowngradeMapSection
                        modelDowngradeChains={config.modelDowngradeChains}
                        onSave={saveDowngrade}
                        onAdd={addDowngradeChain}
                        onRemove={removeDowngradeChain}
                        onRename={renameDowngradeChain}
                        onUpdateItem={updateDowngradeItem}
                        onRemoveItem={removeDowngradeItem}
                        onAddItem={addDowngradeItem}
                    />
                )}
            </div>
        </div>
    );
}

export default AdvancedTab;
