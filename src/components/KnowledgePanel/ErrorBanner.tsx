import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { errorBanner, dismissBtn } from '../../styles/common';

interface ErrorBannerProps {
    error: string | null;
    onDismiss: () => void;
    t: (key: string) => string;
}

const ErrorBanner: React.FC<ErrorBannerProps> = ({ error, onDismiss, t }) => (
    <AnimatePresence>
        {error && (
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                style={errorBanner}
                role="alert"
                aria-live="polite"
            >
                <AlertTriangle size={14} aria-hidden="true" /> {error}
                <button
                    onClick={onDismiss}
                    style={dismissBtn}
                    aria-label={t('common.dismiss_error')}
                >
                    <X size={14} aria-hidden="true" />
                </button>
            </motion.div>
        )}
    </AnimatePresence>
);

export default ErrorBanner;
