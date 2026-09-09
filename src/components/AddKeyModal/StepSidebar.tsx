import { Key, CheckCircle2 } from 'lucide-react';
import { flexColGap6, textXsMutedAuto } from '../../styles/common';

interface StepSidebarProps {
    step: 1 | 2 | 3;
    t: (key: string) => string;
}

const StepSidebar: React.FC<StepSidebarProps> = ({ step, t }) => {
    const steps = [
        { label: t('add_key.step_provider'), fraction: '1/3' },
        { label: t('add_key.step_details'), fraction: '2/3' },
        { label: 'Default Model', fraction: '3/3' },
    ];

    return (
        <div className="modal-sidebar">
            <div className="modal-sidebar-header">
                <div className="modal-sidebar-header-icon">
                    <Key size={18} color="white" />
                </div>
                <span className="modal-sidebar-header-text">{t('add_key.section_connection')}</span>
            </div>
            <div style={flexColGap6}>
                {steps.map((s, i) => {
                    const stepNum = i + 1;
                    return (
                        <div
                            key={`step-${stepNum}`}
                            className="modal-step"
                            style={{ opacity: step === stepNum ? 1 : 0.4 }}
                        >
                            <div
                                className="modal-step-number"
                                style={{
                                    background:
                                        step === stepNum
                                            ? '#3b82f6'
                                            : step > stepNum
                                              ? '#3b82f6'
                                              : 'transparent',
                                }}
                            >
                                {step > stepNum ? <CheckCircle2 size={14} /> : String(stepNum)}
                            </div>
                            <span
                                className="modal-step-label"
                                style={{
                                    fontWeight: step === stepNum ? 700 : 500,
                                }}
                            >
                                {s.label}
                            </span>
                            <span style={textXsMutedAuto}>
                                {step === stepNum ? s.fraction : ''}
                            </span>
                        </div>
                    );
                })}
            </div>
            <div className="modal-sidebar-footer">
                <div className="modal-sidebar-footer-title">
                    <Key size={14} /> {t('add_key.section_connection')}
                </div>
                <p className="modal-sidebar-footer-text">{t('add_key.section_secure_desc')}</p>
            </div>
        </div>
    );
};

export default StepSidebar;
