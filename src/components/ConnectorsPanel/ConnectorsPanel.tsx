import { genId } from '../../utils/gen-id';
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Plus, Globe } from 'lucide-react';
import { eventBus, EVENTS, connectorService, rootLogger } from '../../kernel/instances';
const LOGGER = rootLogger.child('ConnectorsPanel');
import { useTranslation } from '../../i18n/useTranslation';
import { DEFAULT_CONNECTORS } from './connector-constants';
import ConnectorHeader from './ConnectorHeader';
import ConnectorControls from './ConnectorControls';
import ConnectorCard from './ConnectorCard';
import ConnectorAddForm from './ConnectorAddForm';
import ConnectorWebhooksView from './ConnectorWebhooksView';
import DisconnectModal from './DisconnectModal';
import type { Connector } from '../../types/domain';

const ConnectorsPanel: React.FC = () => {
    const [connectors, setConnectors] = useState<Connector[]>([]);
    const [loaded, setLoaded] = useState(false);
    const [activeView, setActiveView] = useState<'grid' | 'webhooks'>('grid');
    const [showAddForm, setShowAddForm] = useState(false);
    const [newName, setNewName] = useState('');
    const [newType, setNewType] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [confirmDisconnect, setConfirmDisconnect] = useState<string | null>(null);
    const { t } = useTranslation();
    const isMountedRef = useRef(true);
    const errorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearErrorAfterDelay = useCallback(() => {
        if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
        errorTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) setErrorMsg(null);
        }, 5000);
    }, []);

    useEffect(() => {
        isMountedRef.current = true;
        const load = async () => {
            try {
                const allConns = await connectorService.getAll();
                if (allConns.length === 0) {
                    await connectorService.saveAll(DEFAULT_CONNECTORS);
                    setConnectors(DEFAULT_CONNECTORS);
                } else {
                    setConnectors(allConns);
                }
            } catch (e) {
                LOGGER.warn('Failed to load connectors', String(e));
                if (isMountedRef.current) {
                    setErrorMsg('Could not load connectors. Using default configuration.');
                    clearErrorAfterDelay();
                    setConnectors(DEFAULT_CONNECTORS);
                }
            } finally {
                if (isMountedRef.current) setLoaded(true);
            }
        };
        load();
        return () => {
            isMountedRef.current = false;
            if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
        };
    }, [clearErrorAfterDelay]);

    const persist = useCallback(
        async (updated: Connector[]) => {
            if (!isMountedRef.current) return;
            try {
                await connectorService.saveAll(updated);
            } catch (e) {
                LOGGER.warn('Failed to save', String(e));
                if (isMountedRef.current) {
                    setErrorMsg('Could not save connector changes.');
                    clearErrorAfterDelay();
                }
            }
        },
        [clearErrorAfterDelay],
    );

    const filteredConnectors = useMemo(
        () =>
            connectors.filter((c) => {
                if (
                    searchQuery &&
                    !c.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
                    !c.type.toLowerCase().includes(searchQuery.toLowerCase())
                )
                    return false;
                if (statusFilter !== 'all' && c.status !== statusFilter) return false;
                return true;
            }),
        [connectors, searchQuery, statusFilter],
    );

    const connectedCount = connectors.filter((c) => c.status === 'connected').length;

    const handleConnect = useCallback(
        async (id: string) => {
            if (!isMountedRef.current) return;
            const connector = connectors.find((c) => c.id === id);
            if (!connector) return;

            let updated: Connector;
            if (connector.endpoint) {
                const result = await connectorService.testConnection(connector.endpoint);
                const status = result.ok ? ('connected' as const) : ('auth_required' as const);
                updated = {
                    ...connector,
                    status,
                    lastSync: result.ok ? 'Just now' : undefined,
                    lastTested: Date.now(),
                };
                if (!result.ok) {
                    eventBus.emit(EVENTS.NOTIFICATION, {
                        message: `Connection test failed for ${connector.name}: ${result.error}`,
                        type: 'warning',
                    });
                }
            } else {
                updated = { ...connector, status: 'connected' as const, lastSync: 'Just now' };
            }

            setConnectors((prev) => prev.map((c) => (c.id === id ? updated : c)));
            persist(connectors.map((c) => (c.id === id ? updated : c)));
        },
        [connectors, persist],
    );

    const handleDisconnect = useCallback(
        (id: string) => {
            if (!isMountedRef.current) return;
            setConnectors((prev) => {
                const u = prev.map((c) =>
                    c.id === id
                        ? { ...c, status: 'disconnected' as const, lastSync: undefined }
                        : c,
                );
                persist(u);
                return u;
            });
            setConfirmDisconnect(null);
            eventBus.emit(EVENTS.NOTIFICATION, {
                message: `Disconnected from ${id}.`,
                type: 'info',
            });
        },
        [persist],
    );

    const handleAddCustom = useCallback(() => {
        if (!isMountedRef.current) return;
        if (!newName.trim()) {
            setErrorMsg(t('connectors.error_name'));
            clearErrorAfterDelay();
            return;
        }
        const id = `custom-${genId().slice(0, 8)}`;
        const nc: Connector = {
            id,
            name: newName.trim(),
            type: newType.trim() || 'Custom REST',
            description: `Custom integrated API endpoint for ${newName.trim()}.`,
            color: 'var(--accent)',
            status: 'disconnected',
        };
        setConnectors((prev) => {
            const u = [...prev, nc];
            persist(u);
            return u;
        });
        setNewName('');
        setNewType('');
        setShowAddForm(false);
        eventBus.emit(EVENTS.NOTIFICATION, {
            message: `Connector ${nc.name} added.`,
            type: 'success',
        });
    }, [newName, newType, persist, clearErrorAfterDelay, t]);

    if (!loaded) {
        return (
            <div className="connector-loader">
                <motion.div
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                >
                    {t('connectors.loading')}
                </motion.div>
            </div>
        );
    }

    return (
        <div className="connector-wrapper">
            <ConnectorHeader
                activeView={activeView}
                totalCount={connectors.length}
                connectedCount={connectedCount}
                onViewChange={setActiveView}
            />

            {errorMsg && (
                <div className="connector-error" role="alert">
                    <AlertTriangle size={14} aria-hidden="true" /> {errorMsg}
                    <X
                        size={14}
                        onClick={() => setErrorMsg(null)}
                        className="connector-error-close"
                        aria-label={t('common.dismiss_error')}
                    />
                </div>
            )}

            <ConnectorControls
                searchQuery={searchQuery}
                statusFilter={statusFilter}
                totalCount={connectors.length}
                connectedCount={connectedCount}
                onSearchChange={setSearchQuery}
                onStatusFilterChange={setStatusFilter}
            />

            <div className="connector-scroll">
                <AnimatePresence mode="wait">
                    {activeView === 'grid' ? (
                        <motion.div
                            key="grid"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="connector-grid"
                            id="connector-grid-panel"
                            role="tabpanel"
                        >
                            {filteredConnectors.length === 0 ? (
                                <div className="connector-empty-state" role="status">
                                    <Globe size={40} opacity={0.3} aria-hidden="true" />
                                    <p>
                                        {searchQuery || statusFilter !== 'all'
                                            ? t('connectors.empty_filter')
                                            : t('connectors.empty_none')}
                                    </p>
                                </div>
                            ) : (
                                filteredConnectors.map((c) => (
                                    <ConnectorCard
                                        key={c.id}
                                        connector={c}
                                        onConnect={handleConnect}
                                        onDisconnectRequest={setConfirmDisconnect}
                                    />
                                ))
                            )}
                            {showAddForm ? (
                                <ConnectorAddForm
                                    newName={newName}
                                    newType={newType}
                                    onNameChange={setNewName}
                                    onTypeChange={setNewType}
                                    onAdd={handleAddCustom}
                                    onClose={() => setShowAddForm(false)}
                                />
                            ) : (
                                <div
                                    onClick={() => setShowAddForm(true)}
                                    className="connector-add-card"
                                    role="button"
                                    tabIndex={0}
                                    aria-label={t('connectors.register_aria')}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            setShowAddForm(true);
                                        }
                                    }}
                                >
                                    <div className="connector-add-icon-box">
                                        <Plus size={28} color="#94a3b8" aria-hidden="true" />
                                    </div>
                                    <span className="connector-add-label">
                                        {t('connectors.register_button')}
                                    </span>
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="webhooks"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <ConnectorWebhooksView
                                onGenerateUrl={() => {
                                    const url = connectorService.generateWebhookUrl(
                                        window.location.origin,
                                    );
                                    navigator.clipboard
                                        .writeText(url)
                                        .then(() => {
                                            eventBus.emit(EVENTS.NOTIFICATION, {
                                                message: `Webhook URL generated and copied: ${url}`,
                                                type: 'success',
                                            });
                                        })
                                        .catch(() => {
                                            eventBus.emit(EVENTS.NOTIFICATION, {
                                                message: `Webhook URL generated: ${url}`,
                                                type: 'info',
                                            });
                                        });
                                }}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <DisconnectModal
                connectorName={confirmDisconnect}
                onConfirm={() => confirmDisconnect && handleDisconnect(confirmDisconnect)}
                onClose={() => setConfirmDisconnect(null)}
            />
        </div>
    );
};

export default ConnectorsPanel;
