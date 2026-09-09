import { motion } from 'framer-motion';

interface Props {
    draftPreview?: string;
    progress: number;
}

export const ThoughtBubble: React.FC<Props> = ({ draftPreview, progress }) => {
    if (!draftPreview) return null;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 4 }}
            animate={{ opacity: 0.85, scale: 1, y: 0 }}
            style={{
                position: 'absolute',
                top: -32,
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(30,41,59,0.95)',
                color: 'var(--slate-400)',
                padding: '4px 10px',
                borderRadius: 10,
                fontSize: '0.55rem',
                maxWidth: 100,
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                border: '1px solid rgba(255,255,255,0.08)',
                pointerEvents: 'none',
                zIndex: 15,
            }}
        >
            💭 {draftPreview.length > 30 ? draftPreview.slice(0, 30) + '...' : draftPreview}
            <div
                style={{
                    width: `${Math.min(100, Math.round(progress * 100))}%`,
                    height: 2,
                    background: 'var(--purple)',
                    borderRadius: 1,
                    marginTop: 3,
                    transition: 'width 0.5s',
                }}
            />
        </motion.div>
    );
};
