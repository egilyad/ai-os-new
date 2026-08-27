import React, { useRef } from 'react';
import { useTranslation } from '../../i18n/useTranslation';

interface SourcePanelProps {
    sourceMode: 'paste' | 'file' | 'session';
    pasted: string;
    onSourceModeChange: (mode: 'paste' | 'file' | 'session') => void;
    onPasteChange: (text: string) => void;
    onLoadPaste: () => void;
    onFileSelected: (file: File) => void;
    onLoadSession: () => void;
}

export const SourcePanel: React.FC<SourcePanelProps> = ({
    sourceMode,
    pasted,
    onSourceModeChange,
    onPasteChange,
    onLoadPaste,
    onFileSelected,
    onLoadSession,
}) => {
    const { t } = useTranslation();
    const fileInputRef = useRef<HTMLInputElement>(null);

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
                {t('chat_export.source')}
            </h3>
            <div style={{ display: 'flex', gap: 6, marginBottom: '0.75rem' }}>
                <button
                    onClick={() => onSourceModeChange('paste')}
                    style={{
                        padding: '0.4rem 0.8rem',
                        borderRadius: 6,
                        border: 'none',
                        background: sourceMode === 'paste' ? '#3b82f6' : 'rgba(59,130,246,0.15)',
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                    }}
                >
                    {t('chat_export.paste')}
                </button>
                <button
                    onClick={() => {
                        onSourceModeChange('file');
                        fileInputRef.current?.click();
                    }}
                    style={{
                        padding: '0.4rem 0.8rem',
                        borderRadius: 6,
                        border: 'none',
                        background: sourceMode === 'file' ? '#3b82f6' : 'rgba(59,130,246,0.15)',
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                    }}
                >
                    {t('chat_export.from_file')}
                </button>
                <button
                    onClick={() => {
                        onSourceModeChange('session');
                        onLoadSession();
                    }}
                    style={{
                        padding: '0.4rem 0.8rem',
                        borderRadius: 6,
                        border: 'none',
                        background: sourceMode === 'session' ? '#a855f7' : 'rgba(168,85,247,0.15)',
                        color: sourceMode === 'session' ? '#fff' : '#c4b5fd',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                    }}
                >
                    {t('chat_export.from_session')}
                </button>
            </div>
            <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                style={{ display: 'none' }}
                onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onFileSelected(f);
                }}
            />
            {sourceMode === 'paste' && (
                <>
                    <textarea
                        value={pasted}
                        onChange={(e) => onPasteChange(e.target.value)}
                        placeholder='{"messages": [{"role":"user","content":"hi"}]}'
                        style={{
                            width: '100%',
                            height: 140,
                            padding: '0.5rem',
                            borderRadius: 6,
                            border: '1px solid rgba(255,255,255,0.1)',
                            background: 'rgba(0,0,0,0.3)',
                            color: 'var(--slate-200)',
                            fontFamily: 'monospace',
                            fontSize: '0.75rem',
                            resize: 'vertical',
                        }}
                    />
                    <button
                        onClick={onLoadPaste}
                        style={{
                            marginTop: '0.5rem',
                            padding: '0.4rem 0.8rem',
                            borderRadius: 6,
                            border: 'none',
                            background: 'var(--success)',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                        }}
                    >
                        {t('chat_export.load')}
                    </button>
                </>
            )}
        </div>
    );
};
