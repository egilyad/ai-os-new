import React, { useState } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import ImpactTab from './ImpactTab';
import ExperimentsTab from './ExperimentsTab';
import ExportTab from './ExportTab';
import {
    containerStyle,
    headerStyle,
    subtitleStyle,
    tabBarStyle,
    tabStyle,
    type Tab,
} from './quality-impact-shared';

export const QualityImpactDashboardPanel: React.FC = () => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<Tab>('impact');

    return (
        <div style={containerStyle}>
            <div style={headerStyle}>{t('quality_impact.title') ?? 'Quality Impact Dashboard'}</div>
            <div style={subtitleStyle}>
                {t('quality_impact.subtitle') ??
                    'Technique-level impact metrics from debate sessions'}
            </div>

            <div style={tabBarStyle}>
                {(['impact', 'experiments', 'export'] as Tab[]).map((tab) => (
                    <button
                        key={tab}
                        style={tabStyle(activeTab === tab)}
                        onClick={() => setActiveTab(tab)}
                    >
                        {t(`quality_impact.tab_${tab}`) ??
                            tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {activeTab === 'impact' && <ImpactTab />}
            {activeTab === 'experiments' && <ExperimentsTab />}
            {activeTab === 'export' && <ExportTab />}
        </div>
    );
};

export default QualityImpactDashboardPanel;
