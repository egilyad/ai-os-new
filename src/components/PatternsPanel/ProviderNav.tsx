import { PROVIDER_TABS, providerColors } from './pattern-constants';

interface Props {
    activeTab: string;
    onTabChange: (tab: string) => void;
}

const ProviderNav: React.FC<Props> = ({ activeTab, onTabChange }) => (
    <nav
        style={{
            display: 'flex',
            gap: '0.5rem',
            marginBottom: '1.5rem',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            paddingBottom: '1rem',
        }}
    >
        {PROVIDER_TABS.map((tab) => (
            <button
                key={tab}
                onClick={() => onTabChange(tab)}
                style={{
                    padding: '0.5rem 1.2rem',
                    borderRadius: 10,
                    background: activeTab === tab ? 'rgba(255,255,255,0.1)' : 'transparent',
                    color: activeTab === tab ? '#f8fafc' : '#64748b',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 600,
                    textTransform: 'capitalize',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                }}
            >
                <div
                    style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: providerColors[tab],
                    }}
                />
                {tab}
            </button>
        ))}
    </nav>
);

export default ProviderNav;
