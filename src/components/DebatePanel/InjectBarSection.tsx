import { Send, Loader2 } from 'lucide-react';
import { Button } from '../Common';

interface Props {
    userInjection: string;
    setUserInjection: (s: string) => void;
    actionLoading: 'start' | 'inject' | null;
    handleInject: () => void;
    t: (k: string) => string;
}

export const InjectBarSection: React.FC<Props> = ({
    userInjection,
    setUserInjection,
    actionLoading,
    handleInject,
    t,
}) => (
    <div className="debate-inject-bar">
        <input
            type="text"
            placeholder={t('debate.inject_placeholder')}
            aria-label="Human argument input"
            value={userInjection}
            onChange={(e) => setUserInjection(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !actionLoading && handleInject()}
            className="debate-inject-input"
            disabled={actionLoading === 'inject'}
        />
        <Button
            variant="success"
            onClick={handleInject}
            className="btn-primary"
            aria-label={t('debate.inject')}
            style={{ padding: '0 1.5rem', fontWeight: 800 }}
            disabled={actionLoading === 'inject'}
        >
            {actionLoading === 'inject' ? (
                <Loader2 size={20} className="spinning" />
            ) : (
                <Send size={20} aria-hidden="true" />
            )}{' '}
            {t('debate.inject')}
        </Button>
    </div>
);
