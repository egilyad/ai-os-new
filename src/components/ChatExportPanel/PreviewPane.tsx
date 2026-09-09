import { useTranslation } from '../../i18n/useTranslation';
import { textSecondaryXs } from '../../styles/common';

interface PreviewPaneProps {
    preview: string;
    hasChat: boolean;
    sourceMode: string;
}

export const PreviewPane: React.FC<PreviewPaneProps> = ({ preview, hasChat, sourceMode }) => {
    const { t } = useTranslation();
    if (hasChat) {
        return (
            <div
                style={{
                    flex: 1,
                    minHeight: 200,
                    maxHeight: '50vh',
                    overflow: 'auto',
                    borderRadius: 10,
                    border: '1px solid rgba(255,255,255,0.05)',
                    background: '#0a0e1a',
                }}
            >
                <pre
                    style={{
                        padding: '1rem',
                        margin: 0,
                        color: 'var(--slate-300)',
                        fontFamily: 'monospace',
                        fontSize: '0.75rem',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                    }}
                >
                    {preview.slice(0, 8000)}
                    {preview.length > 8000 ? '\n...' : ''}
                </pre>
            </div>
        );
    }
    if (sourceMode !== 'paste') {
        return (
            <div
                style={{
                    padding: '1rem',
                    borderRadius: 8,
                    background: 'rgba(0,0,0,0.15)',
                    color: 'var(--slate-400)',
                    fontSize: '0.8rem',
                }}
            >
                <p style={{ margin: '0 0 0.5rem' }}>{t('chat_export.how_to')}</p>
                <ul style={{ margin: 0, paddingLeft: '1.25rem', ...textSecondaryXs }}>
                    <li>{t('chat_export.how_1')}</li>
                    <li>{t('chat_export.how_2')}</li>
                    <li>{t('chat_export.how_3')}</li>
                </ul>
            </div>
        );
    }
    return null;
};
