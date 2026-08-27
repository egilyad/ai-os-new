import { MessageSquare, Bot, Zap, Shield } from 'lucide-react';
import type { TranslationKey } from '../../i18n/translations';

interface Props {
    t: (key: TranslationKey) => string;
}

const FEATURES = (t: (key: TranslationKey) => string) => [
    { icon: <MessageSquare size={16} />, label: t('onboarding.feature_chat'), color: 'var(--success)' },
    { icon: <Bot size={16} />, label: t('onboarding.feature_debates'), color: '#a855f7' },
    { icon: <Zap size={16} />, label: t('onboarding.feature_agents'), color: 'var(--warning)' },
    { icon: <Shield size={16} />, label: t('onboarding.feature_private'), color: 'var(--accent)' },
];

const WelcomeStep: React.FC<Props> = ({ t }) => (
    <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
        <div
            style={{
                width: 64,
                height: 64,
                borderRadius: 16,
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
                boxShadow: '0 8px 32px rgba(59,130,246,0.4)',
            }}
        >
            <MessageSquare size={32} color="white" />
        </div>
        <h2
            style={{
                fontSize: '1.4rem',
                fontWeight: 700,
                margin: '0 0 0.5rem',
                color: 'var(--text-primary)',
            }}
        >
            {t('onboarding.welcome_title')}
        </h2>
        <p
            style={{
                fontSize: '0.9rem',
                color: 'var(--text-muted)',
                margin: '0 0 1.5rem',
                lineHeight: 1.6,
            }}
        >
            {t('onboarding.welcome_subtitle')}
        </p>
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.75rem',
                textAlign: 'left',
                marginBottom: '1.5rem',
            }}
        >
            {FEATURES(t).map((f) => (
                <div
                    key={f.label}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.6rem 0.75rem',
                        background: `${f.color}12`,
                        border: `1px solid ${f.color}30`,
                        borderRadius: 8,
                        fontSize: '0.8rem',
                        color: 'var(--text-secondary)',
                    }}
                >
                    <span style={{ color: f.color, flexShrink: 0 }}>{f.icon}</span>
                    {f.label}
                </div>
            ))}
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
            {t('onboarding.welcome_skip_hint')}
        </p>
    </div>
);

export default WelcomeStep;
