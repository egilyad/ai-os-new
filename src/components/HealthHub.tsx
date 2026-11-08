import React, { useState } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import HealthPanel from './HealthPanel/HealthPanel';
import SystemHealthPanel from './SystemHealthPanel';

type TabId = 'health' | 'system';

const HealthHub: React.FC = () => {
    const { t } = useTranslation();
    const [tab, setTab] = useState<TabId>('health');

    const tabs: Array<{ id: TabId; label: string }> = [
        { id: 'health', label: t('health.hub.health') },
        { id: 'system', label: t('health.hub.system') },
    ];

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div
                style={{
                    display: 'flex',
                    gap: 8,
                    padding: '0.75rem 1rem',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    background: 'rgba(15,23,42,0.4)',
                    flexWrap: 'wrap',
                }}
                role="tablist"
                aria-label={t('health.hub.title')}
            >
                {tabs.map((t) => (
                    <button
                        key={t.id}
                        type="button"
                        onClick={() => setTab(t.id)}
                        role="tab"
                        aria-selected={tab === t.id}
                        style={{
                            padding: '0.45rem 1rem',
                            borderRadius: 8,
                            border: '1px solid',
                            borderColor: tab === t.id ? 'rgba(59,130,246,0.35)' : 'transparent',
                            background: tab === t.id ? 'rgba(59,130,246,0.12)' : 'transparent',
                            color: tab === t.id ? '#60a5fa' : 'var(--slate-400)',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: tab === t.id ? 700 : 600,
                        }}
                    >
                        {t.label}
                    </button>
                ))}
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
                {tab === 'health' && <HealthPanel />}
                {tab === 'system' && <SystemHealthPanel />}
            </div>
        </div>
    );
};

export default HealthHub;
