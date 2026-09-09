import { motion } from 'framer-motion';
import { providerColors } from './pattern-constants';
import type { PatternNote } from './pattern-constants';

interface Props {
    note: PatternNote;
    onClick: () => void;
}

const PatternCard: React.FC<Props> = ({ note, onClick }) => (
    <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={onClick}
        className="glass-panel"
        style={{
            padding: '1.5rem',
            borderRadius: 20,
            border: '1px solid rgba(255,255,255,0.05)',
            background: 'rgba(255,255,255,0.02)',
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden',
        }}
    >
        <div
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: 4,
                height: '100%',
                background: providerColors[note.provider || 'all'],
            }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span
                style={{
                    fontSize: '0.7rem',
                    textTransform: 'uppercase',
                    color: providerColors[note.provider || 'all'],
                    fontWeight: 800,
                    letterSpacing: '0.05em',
                }}
            >
                {note.category.replace('-', ' ')}
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--slate-600)' }}>
                {new Date(note.timestamp).toLocaleDateString()}
            </span>
        </div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--slate-50)', marginBottom: '1rem' }}>
            {note.title}
        </h3>
        <p
            style={{
                fontSize: '0.9rem',
                color: 'var(--slate-400)',
                lineHeight: 1.6,
                marginBottom: '1.5rem',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
            }}
        >
            {note.content}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {note.tags.map((tag) => (
                <span
                    key={tag}
                    style={{
                        fontSize: '0.7rem',
                        padding: '0.2rem 0.6rem',
                        borderRadius: 6,
                        background: 'rgba(255,255,255,0.05)',
                        color: 'var(--slate-500)',
                    }}
                >
                    #{tag}
                </span>
            ))}
        </div>
    </motion.div>
);

export default PatternCard;
