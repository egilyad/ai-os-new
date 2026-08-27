import { FolderOpen, Zap } from 'lucide-react';

interface EmptyAttachStateProps {
    onAttach: () => void;
    t: (key: string) => string;
}

const EmptyAttachState: React.FC<EmptyAttachStateProps> = ({ onAttach, t: _t }) => (
    <div
        style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            padding: '3rem',
            color: 'var(--slate-500)',
        }}
    >
        <Zap size={48} opacity={0.3} />
        <span style={{ fontSize: '0.95rem', fontWeight: 600, textAlign: 'center' }}>
            No project attached
        </span>
        <span
            style={{
                fontSize: '0.82rem',
                color: 'var(--slate-600)',
                textAlign: 'center',
                maxWidth: 350,
            }}
        >
            Attach a project to analyze its architecture — file sizes, directory nesting, and
            structure stats.
        </span>
        <button
            onClick={onAttach}
            style={{
                padding: '0.75rem 1.5rem',
                borderRadius: 12,
                fontSize: '0.9rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginTop: '0.5rem',
                border: 'none',
                background: '#a855f7',
                color: '#fff',
                cursor: 'pointer',
            }}
        >
            <FolderOpen size={18} /> Attach Project Folder
        </button>
    </div>
);

export default EmptyAttachState;
