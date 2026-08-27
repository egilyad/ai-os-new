import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { keyService } from '../../kernel/instances';
import type { ApiKey } from '../../types/metrics';
import type { KeyNote } from '../../kernel/types/metrics-types';

const NoteItem = React.memo<{ note: KeyNote }>(({ note }) => (
    <div
        key={note.id}
        style={{
            padding: '1rem',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '10px',
        }}
    >
        <div
            style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '0.5rem',
                fontSize: '0.7rem',
            }}
        >
            <span
                style={{ fontWeight: 800, color: note.type === 'system' ? '#3b82f6' : '#a855f7' }}
            >
                {note.type === 'system' ? 'SYSTEM' : 'OPERATOR'} •{' '}
                {note.author === 'Operator' ? 'Operator' : note.author}
            </span>
            <span style={{ color: 'var(--text-muted)' }}>
                {new Date(note.timestamp).toLocaleString()}
            </span>
        </div>
        <div style={{ fontSize: '0.9rem', lineHeight: 1.5 }}>{note.text}</div>
    </div>
));

interface NotesTabProps {
    apiKey: ApiKey;
}

const NotesTab: React.FC<NotesTabProps> = ({ apiKey }) => {
    const [newNote, setNewNote] = useState('');
    const [isAddingNote, setIsAddingNote] = useState(false);
    const [localNotes, setLocalNotes] = useState(apiKey.notes || []);

    useEffect(() => {
        setLocalNotes(apiKey.notes || []);
    }, [apiKey.notes]);

    const handleAddNote = async () => {
        if (!newNote.trim()) return;
        setIsAddingNote(true);
        await keyService.addNote(apiKey.id, newNote, 'admin');
        setLocalNotes((prev) => [
            ...prev,
            {
                id: crypto.randomUUID(),
                keyId: apiKey.id,
                text: newNote,
                author: 'Operator',
                type: 'admin',
                timestamp: Date.now(),
            },
        ]);
        setNewNote('');
        setIsAddingNote(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
        >
            <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add operator note..."
                    style={{
                        flex: 1,
                        padding: '0.75rem',
                        background: 'rgba(0,0,0,0.2)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        color: '#fff',
                    }}
                />
                <button
                    onClick={handleAddNote}
                    disabled={!newNote.trim() || isAddingNote}
                    className="btn-primary"
                    style={{ padding: '0.5rem 1.5rem' }}
                >
                    <Plus size={18} />
                </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {localNotes
                    .slice()
                    .sort((a, b) => b.timestamp - a.timestamp)
                    .map((note) => (
                        <NoteItem key={note.id} note={note} />
                    ))}
            </div>
        </motion.div>
    );
};

export default NotesTab;
