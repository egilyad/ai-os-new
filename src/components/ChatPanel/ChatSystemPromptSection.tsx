
interface Props {
    value: string;
    onChange: (value: string) => void;
    onSave: () => void;
    onClear: () => void;
    t: (key: string, params?: Record<string, string | number>) => string;
}

const ChatSystemPromptSection: React.FC<Props> = ({ value, onChange, onSave, onClear, t }) => (
    <div
        style={{
            padding: '0.75rem 1.25rem',
            borderBottom: '1px solid var(--border)',
            background: 'rgba(59,130,246,0.03)',
        }}
    >
        <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={t('chat.system_prompt_placeholder')}
            rows={3}
            style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: 8,
                background: 'rgba(0,0,0,0.2)',
                border: '1px solid var(--border)',
                color: 'var(--text-main)',
                fontSize: '0.85rem',
                resize: 'vertical',
                outline: 'none',
                fontFamily: 'inherit',
            }}
        />
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
            <button
                onClick={onSave}
                className="btn-primary"
                style={{ padding: '0.4rem 1rem', fontSize: '0.75rem' }}
            >
                {t('common.save')}
            </button>
            <button
                onClick={onClear}
                style={{
                    padding: '0.4rem 1rem',
                    borderRadius: 8,
                    background: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.15)',
                    color: 'var(--error)',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                }}
            >
                {t('chat.clear_prompt')}
            </button>
        </div>
    </div>
);

export default ChatSystemPromptSection;
