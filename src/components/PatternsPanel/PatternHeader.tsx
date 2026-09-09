import { Book, Search, Plus } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';

interface Props {
    searchQuery: string;
    onSearchChange: (q: string) => void;
    onCreateClick: () => void;
    createDisabled?: boolean;
}

const PatternHeader: React.FC<Props> = ({
    searchQuery,
    onSearchChange,
    onCreateClick,
    createDisabled,
}) => {
    const { t } = useTranslation();
    return (
        <header
            style={{
                marginBottom: '2rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
            }}
        >
            <div>
                <h1
                    style={{
                        fontSize: '1.5rem',
                        fontWeight: 800,
                        color: 'var(--slate-50)',
                        marginBottom: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                    }}
                >
                    <Book size={28} color="var(--accent-primary)" /> {t('patterns.title')}
                </h1>
                <p style={{ fontSize: '0.9rem', color: 'var(--slate-500)' }}>{t('patterns.subtitle')}</p>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="search-box" style={{ position: 'relative' }}>
                    <Search
                        style={{
                            position: 'absolute',
                            left: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'var(--slate-500)',
                        }}
                        size={18}
                    />
                    <input
                        type="text"
                        placeholder={t('patterns.search_placeholder')}
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        style={{
                            padding: '0.6rem 1rem 0.6rem 2.5rem',
                            borderRadius: 12,
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: 'var(--slate-50)',
                            width: 300,
                        }}
                    />
                </div>
                <button
                    className="btn-primary"
                    onClick={onCreateClick}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.6rem 1.2rem',
                        borderRadius: 12,
                        background: 'var(--accent-primary)',
                        color: 'white',
                        border: 'none',
                        fontWeight: 600,
                        cursor: 'pointer',
                        opacity: createDisabled ? 0.5 : 1,
                    }}
                >
                    <Plus size={18} /> {t('patterns.create')}
                </button>
            </div>
        </header>
    );
};

export default PatternHeader;
