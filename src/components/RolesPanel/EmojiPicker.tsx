import React, { useState, useMemo } from 'react';

const EMOJI_CATEGORIES: Record<string, string[]> = {
    people: [
        '😀',
        '😂',
        '🤣',
        '😊',
        '😎',
        '🥳',
        '🤩',
        '😇',
        '🧐',
        '🤓',
        '😈',
        '👻',
        '👽',
        '🤖',
        '🎅',
        '🧙',
        '🧚',
        '🦸',
        '🧑‍💻',
        '👨‍🔬',
        '👩‍🎨',
        '👨‍🏫',
        '👩‍⚖️',
        '👨‍🔧',
    ],
    nature: [
        '🐶',
        '🐱',
        '🦊',
        '🐸',
        '🦋',
        '🐛',
        '🐝',
        '🦉',
        '🐺',
        '🦅',
        '🐬',
        '🐋',
        '🦈',
        '🐉',
        '🦕',
        '🌺',
        '🌻',
        '🌍',
        '🌙',
        '☀️',
    ],
    objects: [
        '💻',
        '⚙️',
        '🔧',
        '🛠️',
        '🔬',
        '🧪',
        '📡',
        '🛰️',
        '🤖',
        '💾',
        '📀',
        '🎮',
        '🕹️',
        '📱',
        '⌨️',
        '🖥️',
        '🗄️',
        '📦',
        '🔐',
        '🗝️',
        '🎯',
        '🧩',
        '🎲',
    ],
    symbols: [
        '❤️',
        '💡',
        '⚡',
        '🔥',
        '⭐',
        '🌈',
        '💎',
        '♟️',
        '🏆',
        '🥇',
        '🎖️',
        '🔮',
        '💊',
        '🧬',
        '⚕️',
        '☯️',
        '🛡️',
        '⚖️',
        '📊',
        '📈',
    ],
    tech: [
        '🚀',
        '🛸',
        '🔭',
        '🧲',
        '⚛️',
        '🧿',
        '🔋',
        '💿',
        '📟',
        '🎛️',
        '📡',
        '🛰️',
        '🧪',
        '🔬',
        '⚗️',
        '🧬',
        '🦾',
        '🦿',
    ],
    science: [
        '🧑‍🔬',
        '👨‍🔬',
        '🔬',
        '🧪',
        '🧬',
        '🔭',
        '⚗️',
        '📐',
        '📏',
        '🧮',
        '💉',
        '🧴',
        '📊',
        '📈',
        '📉',
        '🗺️',
        '🧭',
    ],
    creative: [
        '🎨',
        '🖌️',
        '✏️',
        '📝',
        '🎭',
        '🎪',
        '🎬',
        '🎵',
        '🎶',
        '🎸',
        '🎹',
        '🥁',
        '📷',
        '🎥',
        '🖼️',
        '🎯',
    ],
    business: [
        '💼',
        '📊',
        '📈',
        '📉',
        '📋',
        '📁',
        '🗂️',
        '📇',
        '📌',
        '📎',
        '✂️',
        '🔗',
        '📤',
        '📥',
        '📧',
        '📞',
    ],
    education: ['🎓', '📚', '📖', '📕', '✏️', '📝', '🧮', '🔤', '🔢', '🌐', '🗺️', '📜', '🏛️', '🎯'],
    medical: ['🩺', '💉', '💊', '🧬', '🦠', '🏥', '🧪', '🩸', '🧫', '🫀', '🫁', '🧠'],
    flags: ['🏁', '🚩', '🎌', '🏴‍☠️', '🏳️‍🌈', '🇺🇳', '🇪🇺', '🏅', '🎖️', '🎗️'],
};

const ALL_EMOJIS = Object.values(EMOJI_CATEGORIES).flat();
const CATEGORY_ICONS: Record<string, string> = {
    people: '😀',
    nature: '🌿',
    objects: '📦',
    symbols: '💡',
    tech: '🚀',
    science: '🔬',
    creative: '🎨',
    business: '💼',
    education: '🎓',
    medical: '🩺',
    flags: '🏁',
};

interface EmojiPickerProps {
    value?: string;
    onChange: (emoji: string | undefined) => void;
}

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ value, onChange }) => {
    const [category, setCategory] = useState('people');
    const [search, setSearch] = useState('');

    const filtered = useMemo(() => {
        if (!search.trim()) return EMOJI_CATEGORIES[category] || [];
        const q = search.toLowerCase();
        return ALL_EMOJIS.filter((e) => e.toLowerCase().includes(q));
    }, [category, search]);

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <input
                    type="text"
                    placeholder="Search emojis..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{
                        flex: 1,
                        padding: '0.4rem 0.6rem',
                        borderRadius: 6,
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'rgba(0,0,0,0.3)',
                        color: 'var(--slate-200)',
                        fontSize: '0.75rem',
                        outline: 'none',
                    }}
                />
                {value && (
                    <button
                        onClick={() => onChange(undefined)}
                        style={{
                            padding: '0.25rem 0.5rem',
                            borderRadius: 6,
                            border: '1px solid rgba(239,68,68,0.3)',
                            background: 'var(--error-tint)',
                            color: 'var(--error)',
                            fontSize: '0.65rem',
                            cursor: 'pointer',
                        }}
                        title="Clear"
                    >
                        ✕
                    </button>
                )}
            </div>
            {!search && (
                <div style={{ display: 'flex', gap: 2, marginBottom: 6, flexWrap: 'wrap' }}>
                    {Object.entries(EMOJI_CATEGORIES).map(([key]) => (
                        <button
                            key={key}
                            onClick={() => setCategory(key)}
                            style={{
                                padding: '0.2rem 0.4rem',
                                borderRadius: 4,
                                border: 'none',
                                background:
                                    category === key ? 'rgba(59,130,246,0.2)' : 'transparent',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                opacity: category === key ? 1 : 0.5,
                                transition: 'all 0.15s',
                            }}
                            title={key}
                        >
                            {CATEGORY_ICONS[key]}
                        </button>
                    ))}
                </div>
            )}
            <div
                style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 3,
                    maxHeight: 140,
                    overflowY: 'auto',
                }}
            >
                {filtered.map((emoji) => (
                    <button
                        key={emoji}
                        onClick={() => onChange(value === emoji ? undefined : emoji)}
                        style={{
                            width: 28,
                            height: 28,
                            borderRadius: 5,
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            background:
                                value === emoji
                                    ? 'rgba(59,130,246,0.25)'
                                    : 'rgba(255,255,255,0.03)',
                            outline: value === emoji ? '2px solid #3b82f6' : 'none',
                            transition: 'all 0.1s',
                        }}
                        title={emoji}
                    >
                        {emoji}
                    </button>
                ))}
                {filtered.length === 0 && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)', padding: '0.5rem' }}>
                        No emojis found
                    </span>
                )}
            </div>
        </div>
    );
};
