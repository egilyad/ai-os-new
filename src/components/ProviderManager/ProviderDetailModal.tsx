import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, RefreshCw, Trash2, AlertTriangle, Info, Loader2 } from 'lucide-react';
import ProviderIcon from '../ProviderIcon/ProviderIcon';
import { PersonalityBadge } from './PersonalityBadge';
import KeyProfileExtended from '../KeyTable/KeyProfileExtended';
import type { ApiKey } from '../../types/metrics';
import { keyService } from '../../kernel/instances';
import { useTranslation } from '../../i18n/useTranslation';
import { useNow } from '../../hooks/useNow';

interface ProviderDetailModalProps {
    profile: ApiKey;
    initialTab: 'overview' | 'sandbox';
    onClose: () => void;
    onCheckHealth: (id: string) => void;
    onRemove: (id: string) => void;
    checkingIds?: Set<string>;
}

const ProviderDetailModal: React.FC<ProviderDetailModalProps> = ({
    profile,
    initialTab,
    onClose,
    onCheckHealth,
    onRemove,
    checkingIds,
}) => {
    const { t } = useTranslation();
    const now = useNow();
    const [confirmRemove, setConfirmRemove] = useState(false);
    const [introspectionData, setIntrospectionData] = useState<string | null>(null);
    const [introspecting, setIntrospecting] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);
    const closeBtnRef = useRef<HTMLButtonElement>(null);
    const isChecking = checkingIds?.has(profile.id) || false;

    useEffect(() => {
        closeBtnRef.current?.focus();
    }, []);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (confirmRemove) {
                    setConfirmRemove(false);
                    return;
                }
                onClose();
            }
            if (e.key === 'Tab' && panelRef.current) {
                const focusable = panelRef.current.querySelectorAll<HTMLElement>(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
                );
                if (focusable.length === 0) return;
                const first = focusable[0]!;
                const last = focusable[focusable.length - 1]!;
                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose, confirmRemove]);

    const handleIntrospect = async () => {
        setIntrospecting(true);
        setIntrospectionData(null);
        try {
            const data = await keyService.getProviderIntrospection(profile.provider, profile.key);
            setIntrospectionData(JSON.stringify(data, null, 2));
        } catch (e: unknown) {
            setIntrospectionData(e instanceof Error ? e.message : 'Request failed');
        } finally {
            setIntrospecting(false);
        }
    };

    const handleRemove = () => {
        if (!confirmRemove) {
            setConfirmRemove(true);
            return;
        }
        onRemove(profile.id);
        onClose();
    };

    return (
        <div
            className="provider-modal-backdrop"
            onClick={onClose}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onClose();
            }}
            aria-label={t('common.aria.close_modal')}
        >
            <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 30, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="provider-modal-panel"
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-label={`Provider details for ${profile.label}`}
            >
                <div className="provider-modal-header">
                    <div className="provider-inline-flex" style={{ gap: '1rem' }}>
                        <div className="provider-icon-box">
                            <ProviderIcon provider={profile.provider} size={24} />
                        </div>
                        <div>
                            <h2>{profile.label}</h2>
                            <span className="provider-modal-sub">{profile.provider}</span>
                            <div style={{ marginTop: 4 }}>
                                <PersonalityBadge provider={profile.provider} />
                            </div>
                            {profile.expiresAt && (
                                <span
                                    className="provider-modal-sub"
                                    style={{
                                        marginLeft: '0.75rem',
                                        color: profile.expiresAt < now ? '#ef4444' : '#f59e0b',
                                    }}
                                >
                                    {profile.expiresAt < now ? 'Expired' : 'Expires'}{' '}
                                    {new Date(profile.expiresAt).toLocaleDateString()}
                                </span>
                            )}
                        </div>
                    </div>
                    <button
                        ref={closeBtnRef}
                        onClick={onClose}
                        className="provider-modal-close-btn"
                        aria-label={t('common.aria.close_details')}
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="provider-modal-body">
                    <KeyProfileExtended
                        apiKey={profile}
                        onClose={onClose}
                        initialTab={initialTab}
                    />
                </div>

                <div
                    className="provider-modal-footer"
                    style={{ flexDirection: 'column', gap: '0.5rem' }}
                >
                    {introspectionData && (
                        <div
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                background: 'rgba(0,0,0,0.3)',
                                borderRadius: 8,
                                fontSize: '0.65rem',
                                fontFamily: 'monospace',
                                color: 'var(--slate-400)',
                                maxHeight: 120,
                                overflow: 'auto',
                                whiteSpace: 'pre-wrap',
                            }}
                        >
                            {introspectionData}
                        </div>
                    )}
                    <div
                        style={{
                            display: 'flex',
                            gap: '0.75rem',
                            width: '100%',
                            justifyContent: 'space-between',
                        }}
                    >
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                className={`btn-secondary${isChecking ? ' provider-btn-checking' : ''}`}
                                onClick={() => {
                                    if (!isChecking) onCheckHealth(profile.id);
                                }}
                                disabled={isChecking}
                                aria-label={`${isChecking ? 'Checking health for' : 'Run health check for'} ${profile.label}`}
                            >
                                <RefreshCw
                                    size={15}
                                    className={isChecking ? 'provider-spin' : ''}
                                />{' '}
                                {isChecking ? 'Checking...' : 'Run Health Check'}
                            </button>
                            <button
                                className="btn-secondary"
                                onClick={handleIntrospect}
                                disabled={introspecting}
                                aria-label={t('provider_manager.aria.introspection')}
                            >
                                {introspecting ? (
                                    <Loader2 size={15} className="provider-spin" />
                                ) : (
                                    <Info size={15} />
                                )}{' '}
                                Introspect
                            </button>
                        </div>
                        <div className="provider-action-group">
                            <button className="btn-secondary" onClick={onClose}>
                                Close
                            </button>
                            {confirmRemove ? (
                                <>
                                    <div
                                        style={{
                                            fontSize: '0.75rem',
                                            color: 'var(--warning)',
                                            padding: '0.5rem',
                                            textAlign: 'center',
                                        }}
                                    >
                                        This key may be assigned to resource pools or routing
                                        policies. Are you sure?
                                    </div>
                                    <button
                                        className="btn-primary provider-remove-btn"
                                        onClick={handleRemove}
                                        aria-label={`Confirm remove ${profile.label}`}
                                    >
                                        <AlertTriangle size={15} /> Confirm Remove
                                    </button>
                                </>
                            ) : (
                                <button
                                    className="btn-primary provider-remove-btn"
                                    onClick={handleRemove}
                                    aria-label={`Remove ${profile.label}`}
                                >
                                    <Trash2 size={15} /> Remove Provider
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default ProviderDetailModal;
