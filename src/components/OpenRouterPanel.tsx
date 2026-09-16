import OpenRouterKeyTable from './ProviderManager/OpenRouterKeyTable';

export default function OpenRouterPanel() {
    return (
        <div style={{ padding: 24 }}>
            <h2
                style={{
                    margin: '0 0 8px',
                    fontSize: '1.2rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                }}
            >
                <span style={{ color: '#a855f7' }}>◈</span> OpenRouter
            </h2>
            <p
                style={{
                    margin: '0 0 24px',
                    color: 'var(--slate-400)',
                    fontSize: '0.85rem',
                }}
            >
                Unified API for 100+ models. Manage keys and test connectivity below.
            </p>
            <OpenRouterKeyTable />
        </div>
    );
}
