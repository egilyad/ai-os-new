import { FileText, FileJson, Code } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';

interface FormatPanelProps {
    format: 'md' | 'json' | 'html';
    includeMeta: boolean;
    includeStats: boolean;
    onFormatChange: (format: 'md' | 'json' | 'html') => void;
    onIncludeMetaChange: (v: boolean) => void;
    onIncludeStatsChange: (v: boolean) => void;
}

export const FormatPanel: React.FC<FormatPanelProps> = ({
    format,
    includeMeta,
    includeStats,
    onFormatChange,
    onIncludeMetaChange,
    onIncludeStatsChange,
}) => {
    const { t } = useTranslation();
    return (
        <div
            style={{
                padding: '1rem',
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.05)',
                background: 'rgba(0,0,0,0.2)',
            }}
        >
            <h3
                style={{
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    color: 'var(--slate-100)',
                    margin: '0 0 0.75rem',
                }}
            >
                {t('chat_export.format')}
            </h3>
            <div style={{ display: 'flex', gap: 6, marginBottom: '0.75rem' }}>
                {(['md', 'json', 'html'] as const).map((f) => (
                    <button
                        key={f}
                        onClick={() => onFormatChange(f)}
                        style={{
                            padding: '0.4rem 0.8rem',
                            borderRadius: 6,
                            border: 'none',
                            background: format === f ? '#10b981' : 'rgba(16,185,129,0.15)',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                        }}
                    >
                        {f === 'md' ? (
                            <FileText size={14} />
                        ) : f === 'json' ? (
                            <FileJson size={14} />
                        ) : (
                            <Code size={14} />
                        )}
                        {f.toUpperCase()}
                    </button>
                ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.8rem' }}>
                <label
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        color: 'var(--slate-300)',
                        cursor: 'pointer',
                    }}
                >
                    <input
                        type="checkbox"
                        checked={includeMeta}
                        onChange={(e) => onIncludeMetaChange(e.target.checked)}
                    />
                    {t('chat_export.include_meta')}
                </label>
                <label
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        color: 'var(--slate-300)',
                        cursor: 'pointer',
                    }}
                >
                    <input
                        type="checkbox"
                        checked={includeStats}
                        onChange={(e) => onIncludeStatsChange(e.target.checked)}
                    />
                    {t('chat_export.include_stats')}
                </label>
            </div>
        </div>
    );
};
