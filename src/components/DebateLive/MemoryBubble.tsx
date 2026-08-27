import { motion } from 'framer-motion';

interface Props {
    debateLabel: string;
    similarity: number;
    relation: 'supports' | 'refutes' | 'extends' | 'contradicts';
}

const RELATION_ICONS: Record<string, string> = {
    supports: '✅',
    refutes: '❌',
    extends: '🔗',
    contradicts: '⚡',
};

const RELATION_COLORS: Record<string, string> = {
    supports: '#22c55e',
    refutes: '#ef4444',
    extends: '#3b82f6',
    contradicts: '#f59e0b',
};

export const MemoryBubble: React.FC<Props> = ({ debateLabel, similarity, relation }) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8, x: -8 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                background: `${RELATION_COLORS[relation]}20`,
                border: `1px solid ${RELATION_COLORS[relation]}40`,
                borderRadius: 8,
                padding: '2px 8px',
                fontSize: '0.55rem',
                color: RELATION_COLORS[relation],
                maxWidth: 160,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                cursor: 'default',
                pointerEvents: 'none',
                marginTop: 2,
            }}
            title={`${relation} — ${debateLabel} (similarity: ${(similarity * 100).toFixed(0)}%)`}
        >
            {RELATION_ICONS[relation]}{' '}
            {debateLabel.length > 20 ? debateLabel.slice(0, 20) + '...' : debateLabel}
        </motion.div>
    );
};
