import { getHealthBand } from '../../kernel/contracts/key-state';

interface ProviderHealthBarProps {
    healthScore: number;
}

const BAND_COLORS: Record<string, string> = {
    healthy: '#10b981',
    warm: '#f59e0b',
    degraded: '#f97316',
    cooling: '#ef4444',
    dead: '#dc2626',
};

export const ProviderHealthBar: React.FC<ProviderHealthBarProps> = ({ healthScore }) => {
    const band = getHealthBand(healthScore);
    const c = BAND_COLORS[band] || '#64748b';
    return (
        <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.6rem', color: 'var(--slate-500)', minWidth: 48, fontWeight: 700 }}>
                HEALTH
            </span>
            <div
                style={{
                    flex: 1,
                    height: 6,
                    borderRadius: 3,
                    background: 'rgba(255,255,255,0.06)',
                    overflow: 'hidden',
                }}
            >
                <div
                    style={{
                        width: `${Math.min(100, healthScore)}%`,
                        height: '100%',
                        borderRadius: 3,
                        background: c,
                    }}
                />
            </div>
            <span
                style={{
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    color: c,
                    minWidth: 28,
                    textAlign: 'right',
                }}
            >
                {healthScore}
            </span>
        </div>
    );
};

export const HealthBandBadge: React.FC<{ healthScore: number }> = ({ healthScore }) => {
    const band = getHealthBand(healthScore);
    const c = BAND_COLORS[band] || '#64748b';
    return (
        <span
            style={{
                marginLeft: 4,
                padding: '1px 6px',
                borderRadius: 8,
                fontSize: '0.6rem',
                fontWeight: 700,
                color: c,
                background: `${c}18`,
                textTransform: 'uppercase',
            }}
            title={`Health score: ${healthScore}/100 — ${band}`}
        >
            {band} {healthScore}
        </span>
    );
};
