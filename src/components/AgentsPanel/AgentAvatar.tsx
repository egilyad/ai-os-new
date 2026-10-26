const ORB_KEYFRAMES = `
@keyframes agentOrbSpin { to { transform: rotate(360deg); } }
@keyframes agentOrbGlow { 0%,100% { opacity: 0.55; } 50% { opacity: 0.95; } }
`;

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

    return (
        <div style={{ position: 'relative', width: px, height: px, flexShrink: 0 }}>
            <style>{ORB_KEYFRAMES}</style>
            <div
                title={name || agentId}
                style={{
                    width: px,
                    height: px,
                    borderRadius: '50%',
                    overflow: 'hidden',
                    position: 'relative',
                    background: 'rgba(255,255,255,0.04)',
                    border: ring ? `2px solid ${resolvedColor}` : '2px solid transparent',
                    boxShadow: `0 0 ${Math.round(px / 3)}px ${resolvedColor}55`,
                    userSelect: 'none',
                }}
            >
                {/* Анимированная «орбита» в стиле Anthropic — вместо эмодзи */}
                <div
                    style={{
                        position: 'absolute',
                        inset: -Math.round(px * 0.4),
                        background: `conic-gradient(from 0deg, ${resolvedColor}, ${resolvedColor}22, rgba(255,255,255,0.9), ${resolvedColor})`,
                        animation: 'agentOrbSpin 7s linear infinite',
                    }}
                />
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: '50%',
                        background: `radial-gradient(circle at 35% 30%, ${resolvedColor}66, transparent 60%)`,
                        animation: 'agentOrbGlow 3s ease-in-out infinite',
                    }}
                />
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: '50%',
                        boxShadow: 'inset 0 0 14px rgba(0,0,0,0.35)',
                    }}
                />
            </div>
            {showStatus && dotColor && <span style={{ position: 'absolute', right: -1, bottom: -1, width: px * 0.28, height: px * 0.28, borderRadius: '50%', background: dotColor, border: `2px solid #0f172a` }} />}
        </div>
    );
};
