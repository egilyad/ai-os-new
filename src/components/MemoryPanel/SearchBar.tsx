import { Search, Network, Brain } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../../i18n/useTranslation';
import { positionRelativeFlex1, searchIconAbsolute, searchInputLarge } from '../../styles/common';

interface SearchBarProps {
    value: string;
    onChange: (val: string) => void;
    isSearching: boolean;
    semanticMode: boolean;
    onToggleSemantic: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
    value,
    onChange,
    isSearching,
    semanticMode,
    onToggleSemantic,
}) => {
    const { t } = useTranslation();
    return (
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={positionRelativeFlex1}>
                <Search size={16} style={searchIconAbsolute} aria-hidden="true" />
                <input
                    type="text"
                    placeholder={
                        semanticMode ? t('memory.search_semantic') : t('memory.search_exact')
                    }
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    style={searchInputLarge}
                    onFocus={(e) => (e.target.style.borderColor = '#10b981')}
                    onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.05)')}
                    aria-label={t('memory.title')}
                />
                <AnimatePresence>
                    {isSearching && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            style={{
                                position: 'absolute',
                                right: 14,
                                top: '50%',
                                transform: 'translateY(-50%)',
                            }}
                        >
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                            >
                                <Network size={16} color="#10b981" aria-hidden="true" />
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            <button
                onClick={onToggleSemantic}
                style={{
                    padding: '0.85rem 1.25rem',
                    background: semanticMode
                        ? 'linear-gradient(145deg, rgba(16,185,129,0.2) 0%, rgba(16,185,129,0.05) 100%)'
                        : 'rgba(0,0,0,0.3)',
                    border: `1px solid ${semanticMode ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.05)'}`,
                    borderRadius: 12,
                    color: semanticMode ? '#10b981' : '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                }}
                aria-label={t('memory.switch_search_aria').replace(
                    '{0}',
                    semanticMode ? 'full-text' : 'semantic',
                )}
            >
                <Brain size={18} aria-hidden="true" /> Semantic
            </button>
        </div>
    );
};

export default SearchBar;
