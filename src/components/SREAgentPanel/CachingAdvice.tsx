import { Layers } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';
import { flexAlignCenterGap2Mb03 } from '../../styles/common';

interface Props {
    estimatedSavings?: string;
    details?: string;
}

const CachingAdvice: React.FC<Props> = ({ estimatedSavings, details }) => {
    const { t } = useTranslation();
    if (!estimatedSavings && !details) return null;
    return (
        <div
            style={{
                padding: '1rem 1.25rem',
                borderRadius: 12,
                background: 'rgba(16,185,129,0.05)',
                border: '1px solid rgba(16,185,129,0.2)',
            }}
        >
            <div style={flexAlignCenterGap2Mb03}>
                <Layers size={14} color="#10b981" />
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--slate-50)' }}>
                    {t('sre.caching_title')}
                </span>
            </div>
            {estimatedSavings && (
                <div
                    style={{
                        fontSize: '0.8rem',
                        color: 'var(--success)',
                        fontWeight: 600,
                        marginBottom: '0.25rem',
                    }}
                >
                    {estimatedSavings}
                </div>
            )}
            {details && <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>{details}</div>}
        </div>
    );
};

export default CachingAdvice;
