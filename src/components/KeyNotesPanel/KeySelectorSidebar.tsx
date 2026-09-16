import { useTranslation } from '../../i18n/useTranslation';
import { textSecondaryXs } from '../../styles/common';

interface KeySelectorSidebarProps {
    keys: Array<{ id: string; provider: string; label: string; notes: unknown[] }>;
    selectedKeyId: string;
    onSelect: (id: string) => void;
}

export const KeySelectorSidebar: React.FC<KeySelectorSidebarProps> = ({
    keys,
    selectedKeyId,
    onSelect,
}) => {
    const { t } = useTranslation();
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', overflow: 'auto' }}>
            <div style={textSecondaryXs}>{t('key_notes.select_key')}</div>
            {keys.map((k) => (
                <button
                    key={k.id}
                    onClick={() => onSelect(k.id)}
                    style={{
                        padding: '0.5rem 0.75rem',
                        borderRadius: 8,
                        border: '1px solid',
                        borderColor: selectedKeyId === k.id ? '#f59e0b' : 'rgba(255,255,255,0.05)',
                        background:
                            selectedKeyId === k.id ? 'rgba(245,158,11,0.1)' : 'rgba(0,0,0,0.2)',
                        color: 'var(--slate-200)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontSize: '0.8rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    <span>{k.label}</span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--slate-400)' }}>{k.notes.length}</span>
                </button>
            ))}
        </div>
    );
};
