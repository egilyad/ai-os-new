import { FolderOpen, Code } from 'lucide-react';

interface Props {
    onAttach: () => void;
}

const EmptyStateSection: React.FC<Props> = ({ onAttach }) => (
    <div
        style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            padding: '3rem',
            color: 'var(--slate-500)',
        }}
    >
        <Code size={48} opacity={0.3} />
        <span style={{ fontSize: '0.95rem', fontWeight: 600, textAlign: 'center' }}>
            No project attached
        </span>
        <span
            style={{
                fontSize: '0.8rem',
                color: 'var(--slate-600)',
                textAlign: 'center',
                maxWidth: 350,
            }}
        >
            Attach a folder to browse its structure, inspect source code, configs, and documentation
            for research analysis.
        </span>
        <button
            onClick={onAttach}
            style={{
                padding: '0.7rem 1.4rem',
                borderRadius: 10,
                fontSize: '0.85rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginTop: '0.25rem',
                border: 'none',
                background: 'var(--purple)',
                color: '#fff',
                cursor: 'pointer',
            }}
        >
            <FolderOpen size={16} /> Attach Project Folder
        </button>
    </div>
);

export default EmptyStateSection;
