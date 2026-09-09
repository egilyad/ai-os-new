import { CheckCircle2, XCircle, Globe } from 'lucide-react';
import type {
    ComplianceStatus,
    SLARecord,
    RegionStatus,
    EnterpriseFeature,
} from '../../kernel/contracts/nvidia-enterprise';

export const COMPLIANCE_COLORS: Record<string, string> = {
    SOC2: '#3b82f6',
    HIPAA: '#ef4444',
    GDPR: '#10b981',
    ISO27001: '#f59e0b',
    PCI_DSS: '#8b5cf6',
};

export const CATEGORY_COLORS: Record<string, string> = {
    security: '#3b82f6',
    compliance: '#10b981',
    performance: '#f59e0b',
    management: '#8b5cf6',
};

const thStyle: React.CSSProperties = {
    textAlign: 'left',
    padding: '8px 12px',
    fontWeight: 600,
    fontSize: '0.75rem',
    whiteSpace: 'nowrap',
};
const tdStyle: React.CSSProperties = {
    padding: '8px 12px',
    whiteSpace: 'nowrap',
};

export function ComplianceCard({ c }: { c: ComplianceStatus }) {
    return (
        <div
            style={{
                background: 'rgba(0,0,0,0.02)',
                borderRadius: 8,
                padding: 12,
                border: `1px solid ${c.certified ? 'rgba(16,185,129,0.2)' : 'rgba(0,0,0,0.06)'}`,
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span
                    style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: 4,
                        background: `${COMPLIANCE_COLORS[c.standard] ?? '#666'}22`,
                        color: COMPLIANCE_COLORS[c.standard] ?? '#666',
                    }}
                >
                    {c.standard}
                </span>
                {c.certified ? (
                    <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />
                ) : (
                    <XCircle size={16} style={{ color: 'var(--error)', opacity: 0.5 }} />
                )}
            </div>
            <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>
                {c.certified
                    ? `Certified · Expires ${new Date(c.expiresAt ?? 0).toLocaleDateString()}`
                    : 'Not certified'}
            </div>
        </div>
    );
}

export function SLATable({ records }: { records: SLARecord[] }) {
    return (
        <div style={{ overflowX: 'auto', fontSize: '0.8rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ opacity: 0.5 }}>
                        <th style={thStyle}>Period</th>
                        <th style={thStyle}>Uptime</th>
                        <th style={thStyle}>p50</th>
                        <th style={thStyle}>p95</th>
                        <th style={thStyle}>p99</th>
                        <th style={thStyle}>Requests</th>
                        <th style={thStyle}>Errors</th>
                    </tr>
                </thead>
                <tbody>
                    {[...records].reverse().map((r) => (
                        <tr key={r.period} style={{ borderTop: '1px solid rgba(0,0,0,0.04)' }}>
                            <td style={tdStyle}>{r.period}</td>
                            <td style={tdStyle}>
                                <span
                                    style={{
                                        color:
                                            r.uptime >= 99.99
                                                ? '#10b981'
                                                : r.uptime >= 99.95
                                                  ? '#f59e0b'
                                                  : '#ef4444',
                                    }}
                                >
                                    {r.uptime}%
                                </span>
                            </td>
                            <td style={tdStyle}>{r.p50Latency}ms</td>
                            <td style={tdStyle}>{r.p95Latency}ms</td>
                            <td style={tdStyle}>{r.p99Latency}ms</td>
                            <td style={tdStyle}>{(r.totalRequests / 1000).toFixed(1)}k</td>
                            <td style={tdStyle}>
                                <span style={{ color: r.errorRate > 0.03 ? '#ef4444' : '#10b981' }}>
                                    {r.errorRate}%
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export function RegionCard({ r }: { r: RegionStatus }) {
    return (
        <div
            style={{
                background: 'rgba(0,0,0,0.02)',
                borderRadius: 8,
                padding: 12,
                opacity: r.available ? 1 : 0.4,
                border: `1px solid ${r.available ? 'rgba(16,185,129,0.15)' : 'rgba(0,0,0,0.06)'}`,
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Globe size={16} style={{ color: 'var(--accent)' }} />
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{r.name}</span>
                {r.available ? (
                    <span
                        style={{
                            fontSize: '0.7rem',
                            padding: '1px 6px',
                            borderRadius: 4,
                            background: 'rgba(16,185,129,0.12)',
                            color: 'var(--success)',
                        }}
                    >
                        Active
                    </span>
                ) : (
                    <span
                        style={{
                            fontSize: '0.7rem',
                            padding: '1px 6px',
                            borderRadius: 4,
                            background: 'rgba(239,68,68,0.12)',
                            color: 'var(--error)',
                        }}
                    >
                        Down
                    </span>
                )}
            </div>
            {r.available && (
                <>
                    <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>Latency: {r.latency}ms</div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: 4 }}>
                        {r.models.join(', ')}
                    </div>
                </>
            )}
        </div>
    );
}

export function FeatureRow({
    f,
    onToggle,
}: {
    f: EnterpriseFeature;
    onToggle: (id: string, enabled: boolean) => void;
}) {
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '8px 12px',
                borderRadius: 8,
                background: 'rgba(0,0,0,0.02)',
            }}
        >
            <span
                style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: CATEGORY_COLORS[f.category] ?? '#666',
                    flexShrink: 0,
                }}
            />
            <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{f.name}</div>
                <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>{f.description}</div>
            </div>
            <span
                style={{ fontSize: '0.7rem', opacity: 0.5, textTransform: 'uppercase', width: 80 }}
            >
                {f.category}
            </span>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem' }}>
                <input
                    type="checkbox"
                    checked={f.enabled}
                    onChange={(e) => onToggle(f.id, e.target.checked)}
                />
                {f.enabled ? 'On' : 'Off'}
            </label>
        </div>
    );
}

export function StatCard({
    icon,
    label,
    value,
    color,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    color: string;
}) {
    return (
        <div
            style={{
                background: `${color}08`,
                border: `1px solid ${color}22`,
                borderRadius: 12,
                padding: 14,
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{ color }}>{icon}</span>
                <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>{label}</span>
            </div>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, color }}>{value}</div>
        </div>
    );
}
