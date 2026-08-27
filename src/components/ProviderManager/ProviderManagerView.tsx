import { useTranslation } from '../../i18n/useTranslation';
import { formatCost as sharedFormatCost } from '../../shared/utils/format-cost';
import {
    Plus,
    RefreshCw,
    Activity,
    DollarSign,
    Zap,
    Download,
    Upload,
    Loader2,
    Users,
    ShieldAlert,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ApiKey } from '../../types/metrics';
import ErrorBoundary from '../Common/ErrorBoundary';
import AddKeyModal from '../AddKeyModal/AddKeyModal';
import InstalledProvidersView from './InstalledProvidersView';
import BrowseModelsView from './BrowseModelsView';
import RoutingSLAView from './RoutingSLAView';
import ResourcePoolsView from './ResourcePoolsView';
import RoutingIntelligenceView from './RoutingIntelligenceView';
import ProviderDetailModal from './ProviderDetailModal';
import ModuleInfo from '../ModuleInfo';

export type TabId = 'installed' | 'browse' | 'routing' | 'pools' | 'intel';
export const TABS: TabId[] = ['installed', 'browse', 'routing', 'pools', 'intel'];

export const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

export const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: {
        opacity: 1,
        y: 0,
        transition: { type: 'spring' as const, stiffness: 300, damping: 24 },
    },
};

export function formatCost(cost: number): string {
    return sharedFormatCost(cost, 'en');
}

export interface ProviderManagerViewProps {
    keys: ApiKey[];
    checkingIds: Set<string>;
    activeTab: TabId;
    showAddModal: boolean;
    addModalProvider?: string;
    selectedProfile: ApiKey | null;
    initialProfileTab: 'overview' | 'sandbox';
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    totalTokens: number;
    totalCost: number;
    activeCount: number;
    errorCount: number;
    anyChecking: boolean;
    importing: boolean;
    exporting: boolean;
    onSetActiveTab: (tab: TabId) => void;
    onSetShowAddModal: (show: boolean, provider?: string) => void;
    onSelectProfile: (key: ApiKey, tab: 'overview' | 'sandbox') => void;
    onClearProfile: () => void;
    onCheckHealth: (id: string) => void;
    onCheckAllHealth: () => void;
    onAddAccount?: () => void;
    onExport: () => void;
    onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onTabKeyDown: (e: React.KeyboardEvent) => void;
    onToggleStatus: (id: string) => void;
    onEnableAll: () => void;
    onDisableAll: () => void;
    onRemoveKey: (id: string) => void;
    onReorderKey?: (keyId: string, targetIndex: number) => void;
}

const ProviderManagerView: React.FC<ProviderManagerViewProps> = ({
    keys,
    checkingIds,
    activeTab,
    showAddModal,
    addModalProvider,
    selectedProfile,
    initialProfileTab,
    fileInputRef,
    totalTokens,
    totalCost,
    activeCount,
    errorCount,
    anyChecking,
    importing,
    exporting,
    onSetActiveTab,
    onSetShowAddModal,
    onSelectProfile,
    onClearProfile,
    onCheckHealth,
    onCheckAllHealth,
    onAddAccount,
    onExport,
    onImport,
    onTabKeyDown,
    onToggleStatus,
    onEnableAll,
    onDisableAll,
    onRemoveKey,
    onReorderKey,
}) => {
    const { t } = useTranslation();
    return (
        <>
            <motion.div variants={containerVariants} initial="hidden" animate="show">
                <motion.div
                    variants={itemVariants}
                    style={{
                        display: 'flex',
                        gap: '0.75rem',
                        alignItems: 'flex-start',
                        padding: '0.75rem 1rem',
                        borderRadius: 12,
                        border: '1px solid rgba(239,68,68,0.35)',
                        background:
                            'linear-gradient(90deg, rgba(239,68,68,0.12) 0%, rgba(239,68,68,0.03) 100%)',
                        marginBottom: '1rem',
                        fontSize: '0.8rem',
                        color: '#fca5a5',
                        lineHeight: 1.45,
                    }}
                    role="alert"
                    aria-live="polite"
                >
                    <ShieldAlert
                        size={18}
                        color="#ef4444"
                        aria-hidden="true"
                        style={{ flexShrink: 0, marginTop: 2 }}
                    />
                    <div>
                        <span style={{ fontWeight: 800, color: '#fca5a5' }}>
                            {t('provider_manager.plaintext_warning_title')}:{' '}
                        </span>
                        {t('provider_manager.plaintext_warning_body')}
                    </div>
                </motion.div>
                <motion.div variants={itemVariants} className="provider-header">
                    <div>
                        <h2 className="provider-heading">{t('provider_manager.title')}</h2>
                        <p className="provider-subtitle">
                            {keys.length > 0
                                ? `${activeCount} active${errorCount > 0 ? `, ${errorCount} errors` : ''} · ${totalTokens.toLocaleString()} tokens · ${formatCost(totalCost)}`
                                : t('provider_manager.empty_state')}
                        </p>
                    </div>
                    <div className="provider-inline-flex" style={{ gap: '0.75rem' }}>
                        <button
                            className="btn-secondary"
                            onClick={onExport}
                            disabled={exporting}
                            aria-label={t('provider_manager.aria.export')}
                        >
                            {exporting ? (
                                <Loader2 size={16} className="spinning" />
                            ) : (
                                <Download size={16} />
                            )}{' '}
                            {exporting ? 'Exporting…' : t('common.export')}
                        </button>
                        <button
                            className="btn-secondary"
                            onClick={() => {
                                if (!importing) fileInputRef.current?.click();
                            }}
                            disabled={importing}
                            aria-label={t('provider_manager.aria.import')}
                        >
                            {importing ? (
                                <Loader2 size={16} className="spinning" />
                            ) : (
                                <Upload size={16} />
                            )}{' '}
                            {importing ? 'Importing…' : t('common.import')}
                        </button>
                        <button
                            className="btn-secondary provider-check-all-btn"
                            onClick={onCheckAllHealth}
                            disabled={anyChecking}
                        >
                            <RefreshCw size={16} className={anyChecking ? 'provider-spin' : ''} />{' '}
                            {t('provider_manager.check_all_health')}
                        </button>
                        {onAddAccount && (
                            <button
                                className="btn-secondary"
                                onClick={onAddAccount}
                                style={{ color: '#a855f7' }}
                            >
                                <Users size={16} /> Add Account
                            </button>
                        )}
                        <button className="btn-primary" onClick={() => onSetShowAddModal(true)}>
                            <Plus size={16} /> {t('provider_manager.add_custom_provider')}
                        </button>
                    </div>
                </motion.div>

                <motion.div variants={itemVariants} className="provider-summary-row">
                    <div className="provider-summary-item">
                        <Activity size={14} color="var(--text-muted)" />
                        <span>
                            {activeCount}/{keys.length} Active
                        </span>
                    </div>
                    <div className="provider-summary-item">
                        <Zap size={14} color="var(--text-muted)" />
                        <span>{totalTokens.toLocaleString()} Tokens</span>
                    </div>
                    <div className="provider-summary-item">
                        <DollarSign size={14} color="var(--text-muted)" />
                        <span>{formatCost(totalCost)} Cost</span>
                    </div>
                </motion.div>

                <motion.div
                    variants={itemVariants}
                    className="provider-tab-bar"
                    role="tablist"
                    aria-label="Provider sections"
                    onKeyDown={onTabKeyDown}
                >
                    {TABS.map((tab) => (
                        <button
                            key={tab}
                            role="tab"
                            aria-selected={activeTab === tab}
                            aria-controls={`provider-panel-${tab}`}
                            onClick={() => onSetActiveTab(tab)}
                            tabIndex={activeTab === tab ? 0 : -1}
                            className={`provider-tab-btn ${activeTab === tab ? 'provider-tab-btn--active' : 'provider-tab-btn--inactive'}`}
                        >
                            {tab === 'installed'
                                ? `${t('provider_manager.tab.installed')} (${keys.length})`
                                : tab === 'browse'
                                  ? t('provider_manager.tab.browse_models')
                                  : tab === 'routing'
                                    ? t('provider_manager.tab.routing_sla')
                                    : tab === 'pools'
                                      ? t('provider_manager.tab.resource_pools')
                                      : t('provider_manager.tab.routing_intel')}
                        </button>
                    ))}
                </motion.div>

                {activeTab === 'installed' ? (
                    <motion.div
                        variants={itemVariants}
                        role="tabpanel"
                        id="provider-panel-installed"
                        aria-label="Installed providers"
                    >
                        <ErrorBoundary variant="panel" name="InstalledProviders">
                            <InstalledProvidersView
                                keys={keys}
                                onSelect={onSelectProfile}
                                onCheckHealth={onCheckHealth}
                                onToggleStatus={onToggleStatus}
                                onRemoveKey={onRemoveKey}
                                onEnableAll={onEnableAll}
                                onDisableAll={onDisableAll}
                                checkingIds={checkingIds}
                                onReorder={onReorderKey}
                            />
                        </ErrorBoundary>
                    </motion.div>
                ) : activeTab === 'browse' ? (
                    <motion.div
                        variants={itemVariants}
                        role="tabpanel"
                        id="provider-panel-browse"
                        aria-label="Browse models"
                    >
                        <ErrorBoundary variant="panel" name="BrowseModels">
                            <BrowseModelsView
                                onAddProvider={(p) => onSetShowAddModal(true, p)}
                                installedKeys={keys}
                            />
                        </ErrorBoundary>
                    </motion.div>
                ) : activeTab === 'routing' ? (
                    <motion.div
                        variants={itemVariants}
                        role="tabpanel"
                        id="provider-panel-routing"
                        aria-label="Routing and SLA"
                    >
                        <ErrorBoundary variant="panel" name="RoutingSLA">
                            <RoutingSLAView
                                keys={keys}
                                onAddProvider={() => onSetShowAddModal(true)}
                            />
                        </ErrorBoundary>
                    </motion.div>
                ) : activeTab === 'pools' ? (
                    <motion.div
                        variants={itemVariants}
                        role="tabpanel"
                        id="provider-panel-pools"
                        aria-label="Resource Pools"
                    >
                        <ErrorBoundary variant="panel" name="ResourcePools">
                            <ResourcePoolsView keys={keys} />
                        </ErrorBoundary>
                    </motion.div>
                ) : (
                    <motion.div
                        variants={itemVariants}
                        role="tabpanel"
                        id="provider-panel-intel"
                        aria-label="Routing Intelligence"
                    >
                        <ErrorBoundary variant="panel" name="RoutingIntelligence">
                            <RoutingIntelligenceView />
                        </ErrorBoundary>
                    </motion.div>
                )}
                <ModuleInfo moduleKey="providers" />
            </motion.div>

            <input
                type="file"
                ref={fileInputRef}
                accept=".json"
                style={{ display: 'none' }}
                onChange={onImport}
            />

            <AnimatePresence>
                {showAddModal && (
                    <ErrorBoundary variant="panel" name="AddKeyModal">
                        <AddKeyModal
                            onClose={() => onSetShowAddModal(false)}
                            defaultProvider={addModalProvider}
                        />
                    </ErrorBoundary>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {selectedProfile && (
                    <ErrorBoundary variant="panel" name="ProviderDetail">
                        <ProviderDetailModal
                            profile={selectedProfile}
                            initialTab={initialProfileTab}
                            onClose={onClearProfile}
                            onCheckHealth={onCheckHealth}
                            onRemove={onRemoveKey}
                            checkingIds={checkingIds}
                        />
                    </ErrorBoundary>
                )}
            </AnimatePresence>
        </>
    );
};

export default ProviderManagerView;
