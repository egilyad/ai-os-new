import React, { useState } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import ResearchEnginePanel from './ResearchPanel/ResearchEnginePanel';
import ResearchEngineAdvancedPanel from './ResearchPanel/ResearchEngineAdvancedPanel';
import ResearchReportPanel from './ResearchReportPanel';
import ResearchCockpit from './ResearchCockpit/ResearchCockpit';
import HypothesisGenerator from './DebateResearch/HypothesisGenerator';
import DebateSystemResearch from './DebateResearch/DebateSystemResearch';

type TabId = 'engine' | 'advanced' | 'reports' | 'cockpit' | 'hypotheses' | 'system';

const ResearchHub: React.FC = () => {
    const { t } = useTranslation();
    const [tab, setTab] = useState<TabId>('engine');

    const tabs: Array<{ id: TabId; label: string }> = [
        { id: 'engine', label: t('research.hub.engine') },
        { id: 'advanced', label: t('research.hub.advanced') },
        { id: 'reports', label: t('research.hub.reports') },
        { id: 'cockpit', label: t('research.hub.cockpit') },
        { id: 'hypotheses', label: t('research.hub.hypotheses') },
        { id: 'system', label: t('research.hub.system') },
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
                aria-label={t('research.hub.title')}
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
                            borderColor: tab === t.id ? 'rgba(168,85,247,0.35)' : 'transparent',
                            background: tab === t.id ? 'rgba(168,85,247,0.12)' : 'transparent',
                            color: tab === t.id ? '#a78bfa' : 'var(--slate-400)',
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
                {tab === 'engine' && <ResearchEnginePanel />}
                {tab === 'advanced' && <ResearchEngineAdvancedPanel />}
                {tab === 'reports' && <ResearchReportPanel />}
                {tab === 'cockpit' && <ResearchCockpit />}
                {tab === 'hypotheses' && <HypothesisGenerator />}
                {tab === 'system' && <DebateSystemResearch />}
            </div>
        </div>
    );
};

export default ResearchHub;
