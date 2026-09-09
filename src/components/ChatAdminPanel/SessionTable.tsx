import { AnimatePresence } from 'framer-motion';
import { CheckSquare, Square, MessageSquare } from 'lucide-react';
import { tableHeaderCell } from '../../styles/common';
import SessionRow from './SessionRow';

interface SessionPreview {
    title: string;
    history: Array<{
        text: string;
        responses: Array<{ provider: string; content: string }>;
    }>;
}

interface SessionTableProps {
    sessions: Array<{
        id: string;
        title: string;
        history: Array<{ text: string; responses: Array<{ provider: string; content: string }> }>;
        updatedAt: number;
    }>;
    selectedIds: string[];
    allSelected: boolean;
    onToggleAll: () => void;
    onToggleOne: (id: string) => void;
    onPreview: (session: SessionPreview) => void;
    onOpenChat: (id: string) => void;
    onDelete: (session: { id: string; title: string }) => void;
}

const SessionTable: React.FC<SessionTableProps> = ({
    sessions,
    selectedIds,
    allSelected,
    onToggleAll,
    onToggleOne,
    onPreview,
    onOpenChat,
    onDelete,
}) => (
    <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.75rem' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 0.75rem' }}>
            <thead>
                <tr style={{ textAlign: 'left' }}>
                    <th style={tableHeaderCell}>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                cursor: 'pointer',
                            }}
                            onClick={onToggleAll}
                            role="button"
                            tabIndex={0}
                            aria-label="Toggle select all sessions"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    onToggleAll();
                                }
                            }}
                        >
                            {allSelected && sessions.length > 0 ? (
                                <CheckSquare size={18} color="#3b82f6" aria-hidden="true" />
                            ) : (
                                <Square size={18} color="#64748b" aria-hidden="true" />
                            )}
                            Select All
                        </div>
                    </th>
                    <th style={tableHeaderCell}>Session Details</th>
                    <th style={tableHeaderCell}>Stats</th>
                    <th style={tableHeaderCell}>Last Activity</th>
                    <th style={{ ...tableHeaderCell, textAlign: 'right' }}>Actions</th>
                </tr>
            </thead>
            <tbody>
                <AnimatePresence>
                    {sessions.map((session) => (
                        <SessionRow
                            key={session.id}
                            session={session}
                            isSelected={selectedIds.includes(session.id)}
                            onToggleSelect={() => onToggleOne(session.id)}
                            onPreview={() => onPreview(session)}
                            onOpenChat={() => onOpenChat(session.id)}
                            onDelete={() => onDelete(session)}
                        />
                    ))}
                </AnimatePresence>
            </tbody>
        </table>
        {sessions.length === 0 && (
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '6rem 0',
                    color: 'var(--slate-500)',
                    gap: '1.5rem',
                }}
            >
                <MessageSquare size={64} opacity={0.2} />
                <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>No conversations found</div>
                <p style={{ margin: 0, fontSize: '1rem' }}>
                    Try adjusting your search filters or start a new cognitive workflow.
                </p>
            </div>
        )}
    </div>
);

export default SessionTable;
