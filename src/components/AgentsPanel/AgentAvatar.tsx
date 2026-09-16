const COLORS = [
    '#3b82f6',
    '#10b981',
    '#a855f7',
    '#f59e0b',
    '#ef4444',
    '#06b6d4',
    '#ec4899',
    '#8b5cf6',
    '#14b8a6',
    '#f97316',
    '#6366f1',
    '#84cc16',
];

const EMOJIS = [
    '🤖',
    '🧠',
    '⚡',
    '🔧',
    '📊',
    '🛡️',
    '🎯',
    '💡',
    '🔬',
    '🎨',
    '📝',
    '🚀',
    '🧪',
    '🏗️',
    '🔍',
    '⚙️',
    '🌐',
    '🧩',
    '💻',
    '🎪',
];

function hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
    }
    return Math.abs(hash);
}

export function getAgentAvatar(agentId: string): { color: string; emoji: string } {
    const safeId = agentId || 'unknown';
    const h = hashString(safeId);
    return {
        color: COLORS[h % COLORS.length]!,
        emoji: EMOJIS[h % EMOJIS.length]!,
    };
}

interface AgentAvatarProps {
    agentId: string;
    name?: string;
    size?: number;
    ring?: boolean;
    /** Optional canonical avatar override (emoji/color) from identity. */
    emoji?: string;
    color?: string;
    /** Optional persistent image; when present the avatar renders an <img>. */
    url?: string;
}

export const AgentAvatar: React.FC<AgentAvatarProps> = ({
    agentId,
    name,
    size = 40,
    ring = false,
    emoji,
    color,
    url,
}) => {
    const fallback = getAgentAvatar(agentId || 'unknown');
    const resolvedEmoji = emoji ?? fallback.emoji;
    const resolvedColor = color ?? fallback.color;

    if (url) {
        return (
            <img
                src={url}
                alt={name || agentId}
                title={name || agentId}
                width={size}
                height={size}
                style={{
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: ring ? `2px solid ${resolvedColor}` : '2px solid transparent',
                    flexShrink: 0,
                    userSelect: 'none',
                }}
            />
        );
    }

    return (
        <div
            title={name || agentId}
            style={{
                width: size,
                height: size,
                borderRadius: '50%',
                background: `${resolvedColor}20`,
                border: ring ? `2px solid ${resolvedColor}` : '2px solid transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: size * 0.5,
                lineHeight: 1,
                flexShrink: 0,
                userSelect: 'none',
            }}
        >
            {resolvedEmoji}
        </div>
    );
};
