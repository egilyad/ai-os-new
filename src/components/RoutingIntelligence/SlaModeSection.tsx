import { Settings2 } from 'lucide-react';
import { glassPanel, sectionHeader, textXsSecondary } from '../../styles/common';

const SLA_MODES = [
    { id: 'BALANCED', label: 'Balanced', desc: 'Optimal mix of speed and cost' },
    { id: 'PERFORMANCE', label: 'Performance', desc: 'Prioritize low latency and quality' },
    { id: 'COST', label: 'Economy', desc: 'Strictly minimize token costs' },
];

interface Props {
    slaMode: string;
    onUpdate: (mode: string) => void;
}

const SlaModeSection: React.FC<Props> = ({ slaMode, onUpdate }) => (
    <div className="glass-panel" style={glassPanel}>
        <h3 style={sectionHeader}>
            <Settings2 size={18} color="#f59e0b" /> Service Level Agreement (SLA) Mode
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            {SLA_MODES.map((mode) => (
                <div
                    key={mode.id}
                    onClick={() => onUpdate(mode.id)}
                    style={{
                        padding: '1rem',
                        borderRadius: 8,
                        cursor: 'pointer',
                        background:
                            slaMode === mode.id ? 'rgba(245,158,11,0.1)' : 'rgba(0,0,0,0.2)',
                        border: `1px solid ${slaMode === mode.id ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.05)'}`,
                    }}
                >
                    <div
                        style={{
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            color: slaMode === mode.id ? '#f59e0b' : '#f8fafc',
                            marginBottom: '0.25rem',
                        }}
                    >
                        {mode.label}
                    </div>
                    <div style={textXsSecondary}>{mode.desc}</div>
                </div>
            ))}
        </div>
    </div>
);

export default SlaModeSection;
