import { HardDrive, X } from 'lucide-react';

interface WorkspaceBarProps {
    workspaceName: string | null;
    onDetach: () => void;
}

const WorkspaceBar: React.FC<WorkspaceBarProps> = ({ workspaceName, onDetach }) => (
    <div
        style={{
            padding: '0.75rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            borderBottom: '1px solid rgba(255,255,255,0.03)',
        }}
    >
        <HardDrive size={14} color="#10b981" />
        <span
            style={{
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--success)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
            }}
        >
            {workspaceName}
        </span>
        <button
            onClick={onDetach}
            style={{
                marginLeft: 'auto',
                background: 'none',
                border: 'none',
                color: 'var(--error)',
                cursor: 'pointer',
                padding: '2px 6px',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
            }}
        >
            <X size={12} /> Detach
        </button>
    </div>
);

export default WorkspaceBar;
