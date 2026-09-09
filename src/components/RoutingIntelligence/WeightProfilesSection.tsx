import { Scale } from 'lucide-react';
import {
    flexColGap3,
    glassPanel,
    sectionHeader,
    textXsSecondary,
    textXsItalicMuted,
} from '../../styles/common';

interface Props {
    weightProfiles: Record<string, unknown> | undefined;
    activeProfile: string | undefined;
    onSetActive: (name: string) => Promise<void>;
}

const WeightProfilesSection: React.FC<Props> = ({ weightProfiles, activeProfile, onSetActive }) => {
    const names = Object.keys(weightProfiles || {});
    return (
        <div className="glass-panel" style={glassPanel}>
            <h3 style={sectionHeader}>
                <Scale size={18} color="#8b5cf6" /> Weight Profiles
            </h3>
            <div style={flexColGap3}>
                <div
                    style={{
                        display: 'flex',
                        gap: '0.5rem',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                    }}
                >
                    <span style={textXsSecondary}>Active:</span>
                    {names.map((name) => (
                        <button
                            key={name}
                            onClick={() => onSetActive(name)}
                            style={{
                                padding: '0.35rem 0.75rem',
                                borderRadius: 6,
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                border: `1px solid ${name === activeProfile ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.08)'}`,
                                background:
                                    name === activeProfile
                                        ? 'rgba(139,92,246,0.15)'
                                        : 'rgba(0,0,0,0.2)',
                                color: name === activeProfile ? '#a855f7' : '#94a3b8',
                            }}
                        >
                            {name}
                            {name === 'default' ? ' (system)' : ''}
                        </button>
                    ))}
                </div>
                {names.filter((n) => n !== 'default').length === 0 && (
                    <div style={textXsItalicMuted}>
                        Create a new profile to experiment with weight tuning. Clone the default
                        profile and adjust parameters.
                    </div>
                )}
            </div>
        </div>
    );
};

export default WeightProfilesSection;
