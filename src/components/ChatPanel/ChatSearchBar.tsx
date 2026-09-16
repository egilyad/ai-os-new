import { Search, ChevronRight, X } from 'lucide-react';
import { iconBtnMuted } from '../../styles/common';

interface Props {
    value: string;
    onChange: (value: string) => void;
    resultCount: number;
    currentIndex: number;
    onPrev: () => void;
    onNext: () => void;
    onClose: () => void;
    t: (key: string, params?: Record<string, string | number>) => string;
}

const ChatSearchBar: React.FC<Props> = ({
    value,
    onChange,
    resultCount,
    currentIndex,
    onPrev,
    onNext,
    onClose,
    t,
}) => (
    <div
        style={{
            padding: '0.5rem 1.25rem',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(168,85,247,0.03)',
        }}
    >
        <Search
            size={14}
            style={{ color: 'var(--text-muted)', flexShrink: 0 }}
            aria-hidden="true"
        />
        <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={t('chat.search_in_chat_placeholder')}
            style={{
                flex: 1,
                padding: '0.35rem 0.5rem',
                borderRadius: 6,
                background: 'rgba(0,0,0,0.15)',
                border: '1px solid var(--border)',
                color: 'var(--text-main)',
                fontSize: '0.8rem',
                outline: 'none',
            }}
            autoFocus
        />
        {resultCount > 0 && (
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                }}
            >
                <button onClick={onPrev} style={iconBtnMuted} aria-label={t('chat.previous_match')}>
                    <ChevronRight size={14} style={{ transform: 'rotate(180deg)' }} />
                </button>
                <span>
                    {currentIndex + 1}/{resultCount}
                </span>
                <button onClick={onNext} style={iconBtnMuted} aria-label={t('chat.next_match')}>
                    <ChevronRight size={14} />
                </button>
                <button onClick={onClose} style={iconBtnMuted} aria-label={t('common.close')}>
                    <X size={14} />
                </button>
            </div>
        )}
    </div>
);

export default ChatSearchBar;
