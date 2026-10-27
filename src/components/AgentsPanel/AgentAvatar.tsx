// Clawd (Claude Code mascot) icon set — `public/icons/clawd/*.svg`.
// State icons used as deterministic per-agent avatars when no explicit status.
const CLAWD_STATE_ICONS = [
    'agent',
    'explore',
    'think',
    'answer',
    'ask',
    'focus',
    'plan',
    'eureka',
    'write',
    'review',
    'debug',
    'happy',
];

const STATUS_TO_CLAWD: Record<string, string> = {
    active: 'happy',
    paused: 'sleep',
    error: 'error',
};

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
    size?: number | 'sm' | 'md' | 'lg';
    ring?: boolean;
    /** Optional canonical avatar override (emoji/color) from identity. */
    emoji?: string;
    color?: string;
    /** Optional persistent image; when present the avatar renders an <img>. */
    url?: string;
    /** AGEMS 0.6: status dot (green=active, yellow=paused, red=error) */
    status?: 'active' | 'paused' | 'error';
    showStatus?: boolean;
}

const SIZE_MAP: Record<string, number> = { sm: 32, md: 40, lg: 64 };

export const AgentAvatar: React.FC<AgentAvatarProps> = ({
    agentId,
    name,
    size = 40,
    ring = false,
    emoji,
    color,
    url,
    status,
    showStatus = false,
}) => {
    const px = typeof size === 'string' ? SIZE_MAP[size] ?? 40 : size;
    const fallback = getAgentAvatar(agentId || 'unknown');
    const resolvedColor = color ?? fallback.color;
    const dotColor = status === 'active' ? '#22c55e' : status === 'paused' ? '#f59e0b' : status === 'error' ? '#ef4444' : null;

    if (url) {
        return (
            <div style={{ position: 'relative', width: px, height: px, flexShrink: 0 }}>
                <img
                    src={url}
                    alt={name || agentId}
                    title={name || agentId}
                    width={px}
                    height={px}
                    style={{
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: ring ? `2px solid ${resolvedColor}` : '2px solid transparent',
                        display: 'block',
                        userSelect: 'none',
                    }}
                />
                {showStatus && dotColor && <span style={{ position: 'absolute', right: -1, bottom: -1, width: px * 0.28, height: px * 0.28, borderRadius: '50%', background: dotColor, border: `2px solid #0f172a` }} />}
            </div>
        );
    }

    const h = hashString(agentId || 'unknown');
    const clawdIcon = status
        ? STATUS_TO_CLAWD[status]
        : CLAWD_STATE_ICONS[h % CLAWD_STATE_ICONS.length];
    const src = `/icons/clawd/clawd_${clawdIcon}.svg`;

    return (
        <div style={{ position: 'relative', width: px, height: px, flexShrink: 0 }}>
            <img
                src={src}
                alt={name || agentId}
                title={name || agentId}
                width={px}
                height={px}
                style={{
                    display: 'block',
                    borderRadius: Math.max(6, Math.round(px * 0.18)),
                    objectFit: 'cover',
                    border: ring ? `2px solid ${resolvedColor}` : '2px solid transparent',
                    background: 'rgba(255,255,255,0.04)',
                    userSelect: 'none',
                }}
            />
            {showStatus && dotColor && <span style={{ position: 'absolute', right: -1, bottom: -1, width: px * 0.28, height: px * 0.28, borderRadius: '50%', background: dotColor, border: `2px solid #0f172a`, zIndex: 2 }} />}
        </div>
    );
};
