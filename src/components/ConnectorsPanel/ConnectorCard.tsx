import React, { memo } from 'react';
import { RefreshCw, Settings } from 'lucide-react';
import { flexAlignCenterGap2 } from '../../styles/common';
import { useTranslation } from '../../i18n/useTranslation';
import { getConnectorStyle, STAT_LABELS, getIcon } from './connector-constants';
import type { Connector } from '../../types/domain';

interface Props {
    connector: Connector;
    onConnect: (id: string) => void;
    onDisconnectRequest: (id: string) => void;
}

const ConnectorCard: React.FC<Props> = memo(({ connector: c, onConnect, onDisconnectRequest }) => {
    const { t } = useTranslation();
    const sc = getConnectorStyle(c.status);

    return (
        <div
            className={`glass-panel connector-card${c.status === 'connected' ? ' connector-card--connected' : ''}`}
        >
            <div className="connector-card-header">
                <div className="connector-card-info">
                    <div
                        className={`connector-icon-box${c.status === 'connected' ? ' connector-icon-box--connected' : ' connector-icon-box--disconnected'}`}
                        style={{
                            background: `${c.color}20`,
                            border: `1px solid ${c.color}40`,
                            color: c.color,
                        }}
                    >
                        {getIcon(c.id)}
                    </div>
                    <div>
                        <h3 className="connector-name">{c.name}</h3>
                        <span className="connector-type">{c.type}</span>
                    </div>
                </div>
            </div>

            <p className="connector-desc">{c.description}</p>

            <div className="connector-card-footer">
                <div style={flexAlignCenterGap2}>
                    <div
                        className="connector-status-dot"
                        style={{ background: sc.dotBg, boxShadow: sc.dotShadow }}
                    />
                    <span className="connector-status-label" style={{ color: sc.color }}>
                        {t(STAT_LABELS[c.status] || 'connectors.status.offline')}
                    </span>
                </div>

                {c.status === 'connected' ? (
                    <button
                        onClick={() => onDisconnectRequest(c.id)}
                        className="btn-secondary"
                        style={{
                            padding: '0.6rem 1.25rem',
                            fontSize: '0.8rem',
                            borderRadius: 10,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            fontWeight: 700,
                        }}
                        aria-label={t('connectors.revoke_aria').replace('{0}', c.name)}
                    >
                        <Settings size={14} aria-hidden="true" /> {t('connectors.revoke')}
                    </button>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <button
                            onClick={() => onConnect(c.id)}
                            className="btn-primary"
                            style={{
                                padding: '0.6rem 1.5rem',
                                fontSize: '0.85rem',
                                borderRadius: 10,
                                fontWeight: 800,
                                background: 'linear-gradient(90deg, #3b82f6, #2563eb)',
                                boxShadow: '0 4px 15px rgba(59,130,246,0.3)',
                            }}
                            aria-label={t('connectors.connect_aria').replace('{0}', c.name)}
                        >
                            {t('connectors.connect')}
                        </button>
                        <div
                            style={{
                                fontSize: '0.6rem',
                                color: 'var(--warning)',
                                textAlign: 'center',
                                opacity: 0.8,
                            }}
                        >
                            {t('connectors.simulated')}
                        </div>
                    </div>
                )}
            </div>

            {c.lastSync && (
                <div className="connector-sync-badge">
                    <RefreshCw size={12} aria-hidden="true" /> {t('connectors.card.synced')}
                </div>
            )}
        </div>
    );
});

export default ConnectorCard;
