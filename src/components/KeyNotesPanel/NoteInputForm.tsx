import React, { useRef } from 'react';
import { Plus, Paperclip, Image as ImageIcon, FileText, X, Loader2 } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';
import type { AttachedFile } from './key-notes-types';
import { rootLogger } from '../../kernel/instances';
const LOGGER = rootLogger.child('NoteInputForm');

interface NoteInputFormProps {
    text: string;
    tags: string;
    attachments: AttachedFile[];
    adding: boolean;
    onTextChange: (text: string) => void;
    onTagsChange: (tags: string) => void;
    onAttachmentsChange: (files: AttachedFile[]) => void;
    onAdd: () => void;
    onFileError?: (fileName: string, error: unknown) => void;
}

export const NoteInputForm: React.FC<NoteInputFormProps> = ({
    text,
    tags,
    attachments,
    adding,
    onTextChange,
    onTagsChange,
    onAttachmentsChange,
    onAdd,
    onFileError,
}) => {
    const { t } = useTranslation();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (files: FileList | null) => {
        if (!files) return;
        const next: AttachedFile[] = [];
        let total = attachments.reduce((s, f) => s + f.size, 0);
        for (let i = 0; i < files.length; i++) {
            const file = files[i]!;
            if (file.size > 1024 * 1024) {
                onFileError?.(file.name, new Error('File exceeds 1MB limit, skipped'));
                continue;
            }
            if (total + file.size > 3 * 1024 * 1024) break;
            const reader = new FileReader();
            reader.onerror = () => {
                LOGGER.error('FileReader failed', file.name, undefined, reader.error);
                onFileError?.(file.name, reader.error);
            };
            reader.onload = () => {
                onAttachmentsChange([
                    ...attachments,
                    ...next,
                    {
                        name: file.name,
                        size: file.size,
                        type: file.type,
                        dataUrl: String(reader.result ?? ''),
                    },
                ]);
            };
            reader.readAsDataURL(file);
            total += file.size;
            next.push({ name: file.name, size: file.size, type: file.type, dataUrl: '' });
        }
    };

    return (
        <div
            style={{
                padding: '0.75rem 1rem',
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.05)',
                background: 'rgba(0,0,0,0.2)',
            }}
        >
            <textarea
                value={text}
                onChange={(e) => onTextChange(e.target.value)}
                placeholder={t('key_notes.placeholder')}
                style={{
                    width: '100%',
                    minHeight: 60,
                    padding: '0.5rem',
                    borderRadius: 6,
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(0,0,0,0.3)',
                    color: 'var(--slate-200)',
                    fontSize: '0.85rem',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                }}
            />
            <div
                style={{
                    display: 'flex',
                    gap: '0.5rem',
                    marginTop: '0.5rem',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                }}
            >
                <input
                    value={tags}
                    onChange={(e) => onTagsChange(e.target.value)}
                    placeholder={t('key_notes.tags_placeholder')}
                    style={{
                        flex: 1,
                        minWidth: 140,
                        padding: '0.4rem 0.6rem',
                        borderRadius: 6,
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'rgba(0,0,0,0.3)',
                        color: 'var(--slate-200)',
                        fontSize: '0.8rem',
                    }}
                />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                        padding: '0.4rem 0.6rem',
                        borderRadius: 6,
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'transparent',
                        color: 'var(--slate-400)',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                    }}
                >
                    <Paperclip size={12} /> {t('key_notes.attach')}
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    style={{ display: 'none' }}
                    onChange={(e) => handleFileSelect(e.target.files)}
                />
                <button
                    onClick={onAdd}
                    disabled={!text.trim() || adding}
                    style={{
                        padding: '0.4rem 0.8rem',
                        borderRadius: 6,
                        border: 'none',
                        background: text.trim() && !adding ? '#f59e0b' : 'rgba(245,158,11,0.3)',
                        color: '#fff',
                        cursor: text.trim() && !adding ? 'pointer' : 'not-allowed',
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        fontWeight: 600,
                    }}
                >
                    {adding ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}{' '}
                    {t('key_notes.add')}
                </button>
            </div>
            {attachments.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                    {attachments.map((f, i) => (
                        <div
                            key={f.name}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '0.2rem 0.5rem',
                                borderRadius: 6,
                                background: 'var(--purple-tint)',
                                border: '1px solid rgba(168,85,247,0.3)',
                                fontSize: '0.7rem',
                            }}
                        >
                            {f.type.startsWith('image/') ? (
                                <ImageIcon size={10} />
                            ) : (
                                <FileText size={10} />
                            )}
                            <span>{f.name}</span>
                            <button
                                onClick={() =>
                                    onAttachmentsChange(attachments.filter((_, idx) => idx !== i))
                                }
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#fca5a5',
                                    cursor: 'pointer',
                                    padding: 0,
                                }}
                            >
                                <X size={10} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
