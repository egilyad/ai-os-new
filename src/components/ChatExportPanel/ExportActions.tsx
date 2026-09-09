import { FileDown, Copy, Check, Loader2, FileType } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';
import { textMutedXs, textWhiteXs } from '../../styles/common';

interface ExportActionsProps {
    title: string;
    messageCount: number;
    model?: string;
    copied: boolean;
    busy: boolean;
    onCopy: () => void;
    onDownload: () => void;
}

export const ExportActions: React.FC<ExportActionsProps> = ({
    title,
    messageCount,
    model,
    copied,
    busy,
    onCopy,
    onDownload,
}) => {
    const { t } = useTranslation();
    return (
        <div
            style={{
                display: 'flex',
                gap: '0.5rem',
                alignItems: 'center',
                padding: '0.75rem 1rem',
                borderRadius: 10,
                background: 'rgba(16,185,129,0.08)',
                border: '1px solid rgba(16,185,129,0.2)',
            }}
        >
            <FileType size={16} color="#10b981" />
            <div style={{ flex: 1 }}>
                <div style={textWhiteXs}>{title}</div>
                <div style={textMutedXs}>
                    {messageCount} {t('chat_export.messages')} ·{' '}
                    {model ? `model: ${model}` : 'no model'}
                </div>
            </div>
            <button
                onClick={onCopy}
                style={{
                    padding: '0.4rem 0.8rem',
                    borderRadius: 6,
                    border: 'none',
                    background: 'var(--border-default)',
                    color: copied ? '#10b981' : '#e2e8f0',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                }}
            >
                {copied ? <Check size={14} /> : <Copy size={14} />} {t('chat_export.copy')}
            </button>
            <button
                onClick={onDownload}
                disabled={busy}
                style={{
                    padding: '0.4rem 0.8rem',
                    borderRadius: 6,
                    border: 'none',
                    background: 'var(--success)',
                    color: '#fff',
                    cursor: busy ? 'wait' : 'pointer',
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontWeight: 600,
                }}
            >
                {busy ? <Loader2 size={14} /> : <FileDown size={14} />} {t('chat_export.download')}
            </button>
        </div>
    );
};
