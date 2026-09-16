import React from 'react';
import { FlaskConical, MessageCircle } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';
import { QuickActionBtn } from './DashboardComponents';

interface QuickActionBarProps {
    onNavigate: (page: string) => void;
}

const QuickActionBar: React.FC<QuickActionBarProps> = ({ onNavigate }) => {
    const { t } = useTranslation();

    return (
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <QuickActionBtn
                icon={<MessageCircle size={14} />}
                label={t('dashboard.new_debate')}
                onClick={() => onNavigate('debate')}
            />
            <QuickActionBtn
                icon={<FlaskConical size={14} />}
                label={t('dashboard.open_sandbox')}
                onClick={() => onNavigate('keys')}
            />
        </div>
    );
};

export default QuickActionBar;
