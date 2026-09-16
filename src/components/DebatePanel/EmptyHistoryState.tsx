import { Clock } from 'lucide-react';
import { textWeight600 } from '../../styles/common';

interface EmptyHistoryStateProps {
    t: (key: string) => string;
}

const EmptyHistoryState: React.FC<EmptyHistoryStateProps> = ({ t }) => (
    <div
        className="glass-panel"
        style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            borderRadius: 24,
            border: '1px solid rgba(255,255,255,0.05)',
            padding: '2rem',
        }}
    >
        <h3
            style={{
                margin: 0,
                marginBottom: '1.5rem',
                fontSize: '1.2rem',
                fontWeight: 800,
                color: 'var(--slate-50)',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
            }}
        >
            <Clock size={20} color="#3b82f6" /> {t('debate_runtime.title')}
        </h3>
        <div
            style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--slate-500)',
                gap: '1rem',
                padding: '4rem',
            }}
        >
            <Clock size={48} opacity={0.3} />
            <span style={textWeight600}>{t('debate.empty_history')}</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--slate-600)' }}>
                {t('debate.empty_history_desc')}
            </span>
        </div>
    </div>
);

export default EmptyHistoryState;
