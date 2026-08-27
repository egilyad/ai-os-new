import { motion } from 'framer-motion';
import { Database } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';

interface MemoryEmptyStateProps {
    isLoading: boolean;
    hasSearch: boolean;
}

const MemoryEmptyState: React.FC<MemoryEmptyStateProps> = ({ isLoading, hasSearch }) => {
    const { t } = useTranslation();
    if (isLoading) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ textAlign: 'center', padding: '6rem 0', color: 'var(--slate-500)' }}
                aria-live="polite"
                aria-busy="true"
            >
                <Database
                    size={56}
                    style={{ opacity: 0.2, margin: '0 auto 1.5rem' }}
                    className="pulsing"
                    aria-hidden="true"
                />
                <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>
                    {t('memory.loading')}
                </p>
            </motion.div>
        );
    }
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ textAlign: 'center', padding: '6rem 0', color: 'var(--slate-500)' }}
        >
            <Database size={56} style={{ opacity: 0.2, margin: '0 auto 1.5rem' }} />
            <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>
                {hasSearch ? t('memory.empty_search') : t('memory.empty_collection')}
            </p>
        </motion.div>
    );
};

export default MemoryEmptyState;
