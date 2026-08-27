import { Search, Upload, Download, Trash, Trash2 } from 'lucide-react';
import { flexColGap4, flexWrapGap4, inputLargeSelect } from '../../styles/common';
import { Button } from '../Common';

type FilterType = 'all' | 'recent' | 'today' | 'week' | 'month';
type MessageFilter = 'all' | 'short' | 'medium' | 'long';

interface AdminToolbarProps {
    searchQuery: string;
    filterType: FilterType;
    messageFilter: MessageFilter;
    selectedCount: number;
    onSearchChange: (v: string) => void;
    onFilterTypeChange: (v: FilterType) => void;
    onMessageFilterChange: (v: MessageFilter) => void;
    onImport: () => void;
    onExport: () => void;
    onDeleteSelected: () => void;
    onDeleteAll: () => void;
}

const AdminToolbar: React.FC<AdminToolbarProps> = ({
    searchQuery,
    filterType,
    messageFilter,
    selectedCount,
    onSearchChange,
    onFilterTypeChange,
    onMessageFilterChange,
    onImport,
    onExport,
    onDeleteSelected,
    onDeleteAll,
}) => (
    <div
        style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '1.75rem',
            paddingBottom: '1.75rem',
            borderBottom: '2px solid rgba(255,255,255,0.05)',
            flexWrap: 'wrap',
            gap: '1rem',
        }}
    >
        <div style={flexColGap4}>
            <div style={flexWrapGap4}>
                <div style={{ position: 'relative', flex: 1, minWidth: 300 }}>
                    <Search
                        style={{
                            position: 'absolute',
                            left: '1.25rem',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'var(--slate-500)',
                        }}
                        size={20}
                        aria-hidden="true"
                    />
                    <input
                        type="text"
                        placeholder="Search context or titles..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        style={{
                            padding: '1rem 1.25rem 1rem 3.5rem',
                            background: 'rgba(0,0,0,0.3)',
                            border: '2px solid rgba(255,255,255,0.1)',
                            borderRadius: 14,
                            color: 'white',
                            fontSize: '1rem',
                            width: '100%',
                            outline: 'none',
                            transition: 'border 0.2s',
                        }}
                        onFocus={(e) => (e.target.style.borderColor = '#3b82f6')}
                        onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                        aria-label="Search chat sessions"
                    />
                </div>
                <select
                    value={filterType}
                    onChange={(e) => onFilterTypeChange(e.target.value as FilterType)}
                    style={inputLargeSelect}
                    aria-label="Filter sessions by date"
                >
                    <option value="all">All Records</option>
                    <option value="recent">Sort by Recent</option>
                    <option value="today">Today</option>
                    <option value="week">Last Week</option>
                    <option value="month">Last Month</option>
                </select>
                <select
                    value={messageFilter}
                    onChange={(e) => onMessageFilterChange(e.target.value as MessageFilter)}
                    style={inputLargeSelect}
                    aria-label="Filter sessions by message length"
                >
                    <option value="all">All Lengths</option>
                    <option value="short">Short (≤3 msgs)</option>
                    <option value="medium">Medium (4-10 msgs)</option>
                    <option value="long">Long (&gt;10 msgs)</option>
                </select>
            </div>
        </div>
        <div style={flexWrapGap4}>
            <Button
                variant="ghost"
                size="lg"
                onClick={onImport}
                className="btn-secondary"
                aria-label="Import chat sessions from JSON file"
            >
                <Upload size={20} /> Import JSON
            </Button>
            <Button
                variant="ghost"
                size="lg"
                onClick={onExport}
                className="btn-secondary"
                aria-label="Export chat sessions to JSON file"
            >
                <Download size={20} /> Export JSON
            </Button>
            {selectedCount > 0 && (
                <button
                    onClick={onDeleteSelected}
                    className="btn-secondary"
                    style={{
                        padding: '1rem 1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        borderRadius: 14,
                        fontSize: '1rem',
                        color: 'var(--error)',
                        borderColor: 'rgba(239,68,68,0.3)',
                    }}
                    aria-label={`Delete ${selectedCount} selected chat sessions`}
                >
                    <Trash size={20} /> Delete {selectedCount}
                </button>
            )}
            <button
                onClick={onDeleteAll}
                className="btn-secondary"
                style={{
                    padding: '1rem 1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    borderRadius: 14,
                    fontSize: '1rem',
                    color: 'var(--error)',
                    borderColor: 'rgba(239,68,68,0.3)',
                }}
                aria-label="Delete all chat sessions"
            >
                <Trash2 size={20} /> Delete All
            </button>
        </div>
    </div>
);

export default AdminToolbar;
