import { useLayout, LAYOUT_LABELS, LAYOUT_ICONS } from './LayoutContext';
import { useTranslation } from '../../i18n/useTranslation';

export const LayoutSelector: React.FC = () => {
    const { layout, setLayout, isGlobal, setIsGlobal, availableLayouts } = useLayout();
    const { t } = useTranslation();

    if (availableLayouts.length <= 1) return null;

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                background: 'rgba(255,255,255,0.04)',
                borderRadius: 6,
                padding: '0.15rem',
            }}
            title={t('layout.selector_title')}
        >
            {availableLayouts.map((mode) => (
                <button
                    key={mode}
                    onClick={() => setLayout(mode)}
                    style={{
                        background: layout === mode ? 'rgba(59,130,246,0.25)' : 'transparent',
                        border:
                            layout === mode
                                ? '1px solid rgba(59,130,246,0.4)'
                                : '1px solid transparent',
                        color:
                            layout === mode
                                ? 'var(--accent, #60a5fa)'
                                : 'var(--text-muted, #64748b)',
                        borderRadius: 4,
                        padding: '0.2rem 0.4rem',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        lineHeight: 1.2,
                        transition: 'all 0.15s',
                    }}
                    aria-label={`${LAYOUT_LABELS[mode]} layout`}
                >
                    {LAYOUT_ICONS[mode]}
                </button>
            ))}
            <div
                style={{
                    width: 1,
                    height: 16,
                    background: 'var(--border-default)',
                    margin: '0 0.25rem',
                }}
            />
            <label
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    fontSize: '0.65rem',
                    color: 'var(--text-muted, #64748b)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                }}
                title={t('layout.global_toggle')}
            >
                <input
                    type="checkbox"
                    checked={isGlobal}
                    onChange={() => setIsGlobal(!isGlobal)}
                    style={{ margin: 0, cursor: 'pointer' }}
                />
                {t('layout.global')}
            </label>
        </div>
    );
};
