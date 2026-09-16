import { CheckCircle2 } from 'lucide-react';
import { STEPS } from './wizard-constants';

interface WizardStepIndicatorProps {
    step: number;
    onNavigate: (i: number) => void;
    t: (key: string) => string;
}

const WizardStepIndicator: React.FC<WizardStepIndicatorProps> = ({ step, onNavigate, t }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
        {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = i === step;
            const isDone = i < step;
            return (
                <button
                    key={s.key}
                    onClick={() => {
                        if (i < step) onNavigate(i);
                    }}
                    disabled={i > step}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '0.5rem 1rem',
                        borderRadius: 12,
                        border: '1px solid',
                        background: isActive
                            ? 'rgba(168,85,247,0.12)'
                            : isDone
                              ? 'rgba(16,185,129,0.1)'
                              : 'transparent',
                        borderColor: isActive
                            ? 'rgba(168,85,247,0.3)'
                            : isDone
                              ? 'rgba(16,185,129,0.25)'
                              : 'rgba(255,255,255,0.06)',
                        color: isActive ? '#a855f7' : isDone ? '#10b981' : '#64748b',
                        cursor: i > step ? 'default' : 'pointer',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        opacity: i > step ? 0.4 : 1,
                    }}
                >
                    <Icon size={16} />
                    <span>{t(s.labelKey)}</span>
                    {isDone && <CheckCircle2 size={14} />}
                </button>
            );
        })}
    </div>
);

export default WizardStepIndicator;
