import { Loader2, Zap, Search, X } from 'lucide-react';

interface ControlsBarProps {
    scanning: boolean;
    canRun: boolean;
    searchQuery: string;
    onRunScan: () => void;
    onRefresh: () => void;
    onSearchChange: (v: string) => void;
    onClearSearch: () => void;
}

const ControlsBar: React.FC<ControlsBarProps> = ({
    scanning,
    canRun,
    searchQuery,
    onRunScan,
    onRefresh,
    onSearchChange,
    onClearSearch,
}) => (
    <div
        style={{
            padding: '0.75rem 1.25rem',
            display: 'flex',
            gap: 8,
            alignItems: 'center',
            borderBottom: '1px solid rgba(255,255,255,0.03)',
        }}
    >
        <button
            onClick={onRunScan}
            disabled={scanning || !canRun}
            style={{
                padding: '0.55rem 1.1rem',
                borderRadius: 7,
                border: 'none',
                background: '#a855f7',
                color: '#fff',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
            }}
        >
            {scanning ? <Loader2 size={14} /> : <Zap size={14} />}
            {scanning ? 'Scanning...' : 'Run Scan'}
        </button>
        <button
            onClick={onRefresh}
            style={{
                padding: '0.55rem 0.9rem',
                borderRadius: 7,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'transparent',
                color: 'var(--slate-400)',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.72rem',
            }}
        >
            Refresh
        </button>
        <div style={{ flex: 1 }} />
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                background: 'rgba(0,0,0,0.3)',
                borderRadius: 5,
                padding: '3px 7px',
            }}
        >
            <Search size={11} color="#64748b" />
            <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Filter..."
                style={{
                    width: 140,
                    background: 'none',
                    border: 'none',
                    outline: 'none',
                    color: 'var(--slate-200)',
                    fontSize: '0.72rem',
                }}
            />
            {searchQuery && (
                <button
                    onClick={onClearSearch}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--slate-500)',
                        cursor: 'pointer',
                        padding: 0,
                    }}
                >
                    <X size={10} />
                </button>
            )}
        </div>
    </div>
);

export default ControlsBar;
