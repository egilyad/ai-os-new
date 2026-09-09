import React, { useState } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import type { ConversationScenario } from '../../kernel/contracts/conversation/scenario';
import ConfigureTab from './ConfigureTab';
import LibraryTab from './LibraryTab';
import RunTab from './RunTab';

type DirectorTab = 'configure' | 'library' | 'run';

const TABS: DirectorTab[] = ['configure', 'library', 'run'];

const DirectorPanel: React.FC = () => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<DirectorTab>('configure');
    const [selectedScenario, setSelectedScenario] = useState<ConversationScenario | null>(null);

    return (
        <div
            style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        >
            <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #2a2a35' }}>
                <h2 style={{ margin: 0, fontSize: '1.1rem' }}>{t('director.title')}</h2>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', opacity: 0.7 }}>
                    {t('director.subtitle')}
                </p>
            </div>
            <div
                style={{
                    display: 'flex',
                    gap: '0.25rem',
                    padding: '0.5rem 1rem',
                    borderBottom: '1px solid #2a2a35',
                }}
            >
                {TABS.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            padding: '0.4rem 0.8rem',
                            borderRadius: 6,
                            cursor: 'pointer',
                            border: '1px solid #2a2a35',
                            background: activeTab === tab ? '#3b82f6' : 'transparent',
                            color: activeTab === tab ? '#fff' : 'inherit',
                        }}
                    >
                        {t(`director.tab_${tab}`)}
                    </button>
                ))}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '0.9rem 1rem' }}>
                {activeTab === 'configure' && (
                    <ConfigureTab onSaved={() => setActiveTab('library')} />
                )}
                {activeTab === 'library' && (
                    <LibraryTab
                        onLoad={(scenario) => {
                            setSelectedScenario(scenario);
                            setActiveTab('run');
                        }}
                    />
                )}
                {activeTab === 'run' && <RunTab scenario={selectedScenario} />}
            </div>
        </div>
    );
};

export default DirectorPanel;
