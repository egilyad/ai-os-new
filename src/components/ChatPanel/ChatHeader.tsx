import { MessageSquare, Search, FileDown, Activity, Split, Settings } from 'lucide-react';
import ModuleInfo from '../ModuleInfo';
import { iconBtnMuted } from '../../styles/common';

interface Props {
    showSidebar: boolean;
    onToggleSidebar: () => void;
    activeSessionTitle?: string;
    activeModel?: string;
    onSearchClick: () => void;
    onToggleSearchWithinChat: () => void;
    displayMode: 'standard' | 'technical';
    onToggleDisplayMode: () => void;
    isSplitView: boolean;
    onToggleSplitView: () => void;
    showSystemPromptInput: boolean;
    onToggleSystemPrompt: () => void;
    onExportClick: () => void;
    t: (key: string, params?: Record<string, string | number>) => string;
}

const ChatHeader: React.FC<Props> = ({
    showSidebar,
    onToggleSidebar,
    activeSessionTitle,
    activeModel,
    onSearchClick,
    onToggleSearchWithinChat,
    displayMode,
    onToggleDisplayMode,
    isSplitView,
    onToggleSplitView,
    showSystemPromptInput,
    onToggleSystemPrompt,
    onExportClick,
    t,
}) => (
    <div
        style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.75rem 1.25rem',
            borderBottom: '1px solid var(--border)',
            background: 'var(--bg-panel)',
        }}
    >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
                onClick={onToggleSidebar}
                style={{
                    padding: 6,
                    borderRadius: 8,
                    background: 'none',
                    border: 'none',
                    color: showSidebar ? '#3b82f6' : 'var(--text-muted)',
                    cursor: 'pointer',
                }}
                title={t('chat.toggle_sidebar')}
                aria-label={t('chat.toggle_sidebar')}
            >
                <MessageSquare size={18} aria-hidden="true" />
            </button>
            <div>
                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                    {activeSessionTitle || t('chat.no_session')}
                </span>
                {activeModel && (
                    <span
                        style={{
                            marginLeft: '0.5rem',
                            fontSize: '0.7rem',
                            color: 'var(--text-muted)',
                        }}
                    >
                        {activeModel}
                    </span>
                )}
            </div>
        </div>
        <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
            <button
                onClick={onSearchClick}
                style={iconBtnMuted}
                title={t('chat.search_messages')}
                aria-label={t('chat.search_messages')}
            >
                <Search size={16} />
            </button>
            <button
                onClick={onToggleSearchWithinChat}
                style={iconBtnMuted}
                title={t('chat.search_in_chat')}
                aria-label={t('chat.search_in_chat')}
            >
                <Search size={16} />
            </button>
            <ModuleInfo moduleKey="chat" />
            <button
                onClick={onExportClick}
                style={iconBtnMuted}
                title={t('chat.export')}
                aria-label={t('chat.export_aria')}
            >
                <FileDown size={16} />
            </button>
            <button
                onClick={onToggleDisplayMode}
                style={{
                    ...iconBtnMuted,
                    color: displayMode === 'technical' ? '#a855f7' : 'var(--text-muted)',
                    background:
                        displayMode === 'technical' ? 'rgba(168,85,247,0.1)' : 'transparent',
                }}
                title={
                    displayMode === 'technical' ? t('chat.standard_mode') : t('chat.technical_mode')
                }
                aria-label={
                    displayMode === 'technical' ? t('chat.standard_mode') : t('chat.technical_mode')
                }
            >
                <Activity size={16} />
            </button>
            <button
                onClick={onToggleSplitView}
                style={{
                    ...iconBtnMuted,
                    color: isSplitView ? '#a855f7' : 'var(--text-muted)',
                    background: isSplitView ? 'rgba(168,85,247,0.1)' : 'transparent',
                }}
                title={t('chat.split_view')}
                aria-label={t('chat.split_view')}
            >
                <Split size={16} />
            </button>
            <button
                onClick={onToggleSystemPrompt}
                style={{
                    ...iconBtnMuted,
                    color: showSystemPromptInput ? '#3b82f6' : 'var(--text-muted)',
                }}
                title={t('chat.system_prompt')}
                aria-label={t('chat.system_prompt')}
            >
                <Settings size={16} />
            </button>
        </div>
    </div>
);

export default ChatHeader;
