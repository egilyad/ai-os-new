import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Image as ImageIcon, FileText, Trash2 } from 'lucide-react';
import { textMutedXs, textWhiteXs, flexBetween } from '../../styles/common';
import type { EnhancedNote } from './key-notes-types';

interface NoteCardProps {
    note: EnhancedNote;
    onDelete: (id: string) => void;
    onPreview: (file: NonNullable<EnhancedNote['attachments']>[number]) => void;
}

export const NoteCard: React.FC<NoteCardProps> = memo(({ note, onDelete, onPreview }) => (
    <motion.div
        key={note.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        style={{
            padding: '0.75rem 1rem',
            borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.05)',
            background: 'rgba(0,0,0,0.2)',
        }}
    >
        <div style={flexBetween}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.7rem' }}>
                <span
                    style={{
                        padding: '0.1rem 0.5rem',
                        borderRadius: 6,
                        background:
                            note.type === 'system'
                                ? 'rgba(59,130,246,0.2)'
                                : 'rgba(168,85,247,0.2)',
                        color: note.type === 'system' ? '#93c5fd' : '#c4b5fd',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                    }}
                >
                    {note.type}
                </span>
                {note.author && <span style={{ color: 'var(--slate-400)' }}>{note.author}</span>}
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
                <span style={textMutedXs}>{new Date(note.timestamp).toLocaleString()}</span>
                <button
                    onClick={() => onDelete(note.id)}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--error)',
                        cursor: 'pointer',
                        padding: 2,
                    }}
                >
                    <Trash2 size={12} />
                </button>
            </div>
        </div>
        <div style={{ ...textWhiteXs, marginTop: 4, lineHeight: 1.5 }}>{note.text}</div>
        {note.tags && note.tags.length > 0 && (
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
                {note.tags.map((tag) => (
                    <span
                        key={tag}
                        style={{
                            padding: '0.1rem 0.4rem',
                            borderRadius: 8,
                            background: 'var(--warning-tint)',
                            color: 'var(--warning)',
                            fontSize: '0.65rem',
                        }}
                    >
                        #{tag}
                    </span>
                ))}
            </div>
        )}
        {note.attachments && note.attachments.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                {note.attachments.map((f) => (
                    <button
                        key={f.name}
                        onClick={() => onPreview(f)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '0.2rem 0.5rem',
                            borderRadius: 6,
                            background: 'rgba(0,0,0,0.3)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: 'var(--slate-300)',
                            fontSize: '0.7rem',
                            cursor: 'pointer',
                        }}
                    >
                        {f.type.startsWith('image/') ? (
                            <ImageIcon size={10} />
                        ) : (
                            <FileText size={10} />
                        )}
                        <span>{f.name}</span>
                        <span style={{ color: 'var(--slate-500)' }}>{(f.size / 1024).toFixed(0)}KB</span>
                    </button>
                ))}
            </div>
        )}
    </motion.div>
));
