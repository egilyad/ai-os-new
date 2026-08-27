import React, { useState, useMemo, useDeferredValue, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { useChatStore } from '../../stores/useChatStore';
import { eventBus, EVENTS, rootLogger } from '../../kernel/instances';
const LOGGER = rootLogger.child('ChatAdminPanel');
import { ConfirmDialog } from '../ConfirmDialog';
import { safeJsonParse } from '../../kernel/utils/safe-json';
import AdminHeader from './AdminHeader';
import AdminStatsCards from './AdminStatsCards';
import AdminToolbar from './AdminToolbar';
import SessionTable from './SessionTable';
import PreviewModal from './PreviewModal';

type FilterType = 'all' | 'recent' | 'today' | 'week' | 'month';
type MessageFilter = 'all' | 'short' | 'medium' | 'long';

interface SessionPreview {
    title: string;
    history: Array<{
        text: string;
        responses: Array<{ provider: string; content: string }>;
    }>;
}

const ChatAdminPanel: React.FC = () => {
    const sessions = useChatStore((s) => s.sessions);
    const deleteSession = useChatStore((s) => s.deleteSession);
    const setActiveSessionId = useChatStore((s) => s.setActiveSessionId);
    const importSessions = useChatStore((s) => s.importSessions);
    const [searchQuery, setSearchQuery] = useState('');
    const deferredSearch = useDeferredValue(searchQuery);
    const [filterType, setFilterType] = useState<FilterType>('all');
    const [messageFilter, setMessageFilter] = useState<MessageFilter>('all');
    const [selectedSessionIds, setSelectedSessionIds] = useState<string[]>([]);
    const [previewSession, setPreviewSession] = useState<SessionPreview | null>(null);

    useEffect(() => {
        if (!previewSession) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setPreviewSession(null);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [previewSession]);
    const [error, setError] = useState<string | null>(null);
    const [confirmAction, setConfirmAction] = useState<{
        title: string;
        message: string;
        onConfirm: () => void;
    } | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleExportSessions = () => {
        const data = JSON.stringify(sessions, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chat-sessions-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleImportSessions = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const MAX_IMPORT_SIZE = 50 * 1024 * 1024;
        if (file.size > MAX_IMPORT_SIZE) {
            setError(`File too large (max ${MAX_IMPORT_SIZE / 1024 / 1024}MB)`);
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }
        if (file.size === 0) {
            setError('File is empty');
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const imported = safeJsonParse(event.target?.result as string);
                if (!Array.isArray(imported)) throw new Error('Expected an array of sessions');
                for (const item of imported) {
                    if (
                        !item ||
                        typeof item.id !== 'string' ||
                        typeof item.title !== 'string' ||
                        !Array.isArray(item.history)
                    ) {
                        throw new Error(
                            'Invalid session structure: each session must have id (string), title (string), and history (array)',
                        );
                    }
                }
                importSessions(imported);
                eventBus.emit(EVENTS.NOTIFICATION, {
                    message: `Successfully imported ${imported.length} session(s)`,
                    type: 'success',
                });
            } catch (e) {
                LOGGER.warn('ChatAdminPanel', 'Failed to parse imported file', { error: e });
                eventBus.emit(EVENTS.NOTIFICATION, {
                    message: 'Failed to parse the imported file. Please check the JSON format.',
                    type: 'error',
                });
            }
        };
        reader.readAsText(file);
    };

    const handleDeleteSelectedSessions = () => {
        setConfirmAction({
            title: 'Delete sessions',
            message: `Are you sure you want to delete ${selectedSessionIds.length} session(s)?`,
            onConfirm: () => {
                selectedSessionIds.forEach((id) => deleteSession(id));
                setSelectedSessionIds([]);
                setConfirmAction(null);
            },
        });
    };

    const handleDeleteAllSessions = () => {
        setConfirmAction({
            title: 'Delete all sessions',
            message: 'Are you sure you want to delete ALL chat sessions?',
            onConfirm: () => {
                sessions.forEach((session) => deleteSession(session.id));
                setSelectedSessionIds([]);
                setConfirmAction(null);
            },
        });
    };

    const toggleSessionSelection = (id: string) => {
        setSelectedSessionIds((prev) =>
            prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id],
        );
    };

    const toggleAllSessions = () => {
        if (selectedSessionIds.length === filteredSessions.length) {
            setSelectedSessionIds([]);
        } else {
            setSelectedSessionIds(filteredSessions.map((s) => s.id));
        }
    };

    const [todayStart] = useState(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d.getTime();
    });
    const [filterTimestamp] = useState(() => Date.now());

    const stats = useMemo(() => {
        const totalMessages = sessions.reduce((acc, s) => acc + s.history.length, 0);
        const totalResponses = sessions.reduce(
            (acc, s) => acc + s.history.reduce((a, e) => a + e.responses.length, 0),
            0,
        );
        const avgMessages =
            sessions.length > 0 ? (totalMessages / sessions.length).toFixed(1) : '0';
        return { totalSessions: sessions.length, totalMessages, totalResponses, avgMessages };
    }, [sessions]);

    // eslint-disable-next-line react-hooks/preserve-manual-memoization
    const filteredSessions = useMemo(() => {
        const query = deferredSearch;
        let result = sessions.filter(
            (s) =>
                s.title.toLowerCase().includes(query.toLowerCase()) ||
                s.id.toLowerCase().includes(query.toLowerCase()),
        );
        if (filterType === 'recent') result = [...result].sort((a, b) => b.updatedAt - a.updatedAt);
        else if (filterType === 'today') result = result.filter((s) => s.updatedAt >= todayStart);
        else if (filterType === 'week')
            result = result.filter((s) => s.updatedAt >= filterTimestamp - 7 * 24 * 60 * 60 * 1000);
        else if (filterType === 'month')
            result = result.filter(
                (s) => s.updatedAt >= filterTimestamp - 30 * 24 * 60 * 60 * 1000,
            );
        if (messageFilter === 'short') result = result.filter((s) => s.history.length <= 3);
        else if (messageFilter === 'medium')
            result = result.filter((s) => s.history.length > 3 && s.history.length <= 10);
        else if (messageFilter === 'long') result = result.filter((s) => s.history.length > 10);
        return result;
    }, [sessions, deferredSearch, filterType, messageFilter, todayStart, filterTimestamp]);

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '2rem',
                height: '100%',
                overflowY: 'auto',
            }}
        >
            <AdminHeader />

            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 16,
                            padding: '1rem 1.5rem',
                            background: 'var(--error-tint)',
                            border: '1px solid rgba(239,68,68,0.2)',
                            borderRadius: 16,
                            color: '#fca5a5',
                            fontSize: '1rem',
                        }}
                    >
                        <AlertCircle size={24} /> {error}
                        <button
                            onClick={() => setError(null)}
                            style={{
                                marginLeft: 'auto',
                                background: 'none',
                                border: 'none',
                                color: '#fca5a5',
                                cursor: 'pointer',
                                fontSize: '1.25rem',
                            }}
                        >
                            ✕
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <AdminStatsCards {...stats} />

            <div
                className="glass-panel"
                style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '2rem',
                    borderRadius: 20,
                    overflow: 'hidden',
                }}
            >
                <AdminToolbar
                    searchQuery={searchQuery}
                    filterType={filterType}
                    messageFilter={messageFilter}
                    selectedCount={selectedSessionIds.length}
                    onSearchChange={setSearchQuery}
                    onFilterTypeChange={setFilterType}
                    onMessageFilterChange={setMessageFilter}
                    onImport={() => fileInputRef.current?.click()}
                    onExport={handleExportSessions}
                    onDeleteSelected={handleDeleteSelectedSessions}
                    onDeleteAll={handleDeleteAllSessions}
                />

                <SessionTable
                    sessions={filteredSessions}
                    selectedIds={selectedSessionIds}
                    allSelected={selectedSessionIds.length === filteredSessions.length}
                    onToggleAll={toggleAllSessions}
                    onToggleOne={toggleSessionSelection}
                    onPreview={(s) => setPreviewSession(s)}
                    onOpenChat={(id) => {
                        setActiveSessionId(id);
                        document.getElementById('chat-tab')?.click();
                    }}
                    onDelete={(s) =>
                        setConfirmAction({
                            title: 'Delete session',
                            message: `Are you sure you want to delete session "${s.title}"?`,
                            onConfirm: () => {
                                deleteSession(s.id);
                                setConfirmAction(null);
                            },
                        })
                    }
                />
            </div>

            <PreviewModal session={previewSession} onClose={() => setPreviewSession(null)} />

            <input
                type="file"
                ref={fileInputRef}
                accept=".json"
                style={{ display: 'none' }}
                onChange={handleImportSessions}
            />

            <ConfirmDialog
                open={!!confirmAction}
                title={confirmAction?.title ?? ''}
                message={confirmAction?.message ?? ''}
                variant="danger"
                confirmLabel="Delete"
                onConfirm={() => confirmAction?.onConfirm()}
                onCancel={() => setConfirmAction(null)}
            />
        </div>
    );
};

export default ChatAdminPanel;
