import { Cpu, Shield, TrendingUp } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';

interface Props {
    activeTab: string;
    alertCount: number;
    onTabChange: (tab: 'suggestions' | 'alerts' | 'whatif') => void;
}

const TABS: {
    key: 'suggestions' | 'alerts' | 'whatif';
    icon: React.FC<{ size?: number }>;
    labelKey: string;
}[] = [
    { key: 'suggestions', icon: Cpu, labelKey: 'sre.tab.suggestions' },
    { key: 'alerts', icon: Shield, labelKey: 'sre.tab.alerts' },
    { key: 'whatif', icon: TrendingUp, labelKey: 'sre.tab.what_if' },
];

const SRETabBar: React.FC<Props> = ({ activeTab, alertCount, onTabChange }) => {
    const { t } = useTranslation();
    return (
        <div
            style={{
                display: 'flex',
                gap: '0.5rem',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                paddingBottom: '0.5rem',
            }}
        >
            {TABS.map(({ key, icon: Icon, labelKey }) => (
                <button
                    key={key}
                    onClick={() => onTabChange(key)}
                    style={{
                        padding: '0.5rem 1rem',
                        borderRadius: 8,
                        border: 'none',
                        background: activeTab === key ? 'rgba(139,92,246,0.15)' : 'transparent',
                        color: activeTab === key ? '#a78bfa' : '#64748b',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        textTransform: 'uppercase',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                    }}
                >
                    <Icon size={14} />
                    {t(labelKey)} {key === 'alerts' && alertCount > 0 && `(${alertCount})`}
                </button>
            ))}
        </div>
    );
};

export default SRETabBar;
