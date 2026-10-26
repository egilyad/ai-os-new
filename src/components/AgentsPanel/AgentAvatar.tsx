const ANIM_STYLE = `
@keyframes agentMascotFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
@keyframes agentMascotBlink { 0%,92%,100% { transform: scaleY(1); } 96% { transform: scaleY(0.1); } }
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

    const h = hashString(agentId || 'unknown');
    const eyeStyle = h % 3; // 0 круг, 1 плоский, 2 моргающий
    const hasAntenna = h % 2 === 0;
    const id = `mascot-${agentId || 'unknown'}-${h % 97}`;

    return (
        <div style={{ position: 'relative', width: px, height: px, flexShrink: 0 }}>
            <style>{ANIM_STYLE}</style>
            <div style={{ position: 'absolute', inset: 0, animation: `agentMascotFloat ${3 + (h % 3)}s ease-in-out infinite` }}>
                <svg viewBox="0 0 64 64" width={px} height={px} aria-hidden="true">
                    <defs>
                        <radialGradient id={`${id}-g`} cx="35%" cy="30%" r="80%">
                            <stop offset="0%" stopColor="#fff" stopOpacity="0.9" />
                            <stop offset="35%" stopColor={resolvedColor} stopOpacity="0.95" />
                            <stop offset="100%" stopColor="#000" stopOpacity="0.4" />
                        </radialGradient>
                    </defs>
                    {/* Антенна (у части агентов) */}
                    {hasAntenna && (
                        <g>
                            <line x1="32" y1="14" x2="32" y2="6" stroke={resolvedColor} strokeWidth="3" strokeLinecap="round" />
                            <circle cx="32" cy="5" r="3.5" fill={resolvedColor} />
                        </g>
                    )}
                    {/* Тело/голова */}
                    <ellipse cx="32" cy="36" rx="24" ry="21" fill={`url(#${id}-g)`} stroke="#000" strokeOpacity="0.18" strokeWidth="2" />
                    {/* Глаза */}
                    {eyeStyle === 0 && (
                        <g>
                            <circle cx="23" cy="34" r="5" fill="#0f172a" />
                            <circle cx="41" cy="34" r="5" fill="#0f172a" />
                            <circle cx="25" cy="32" r="1.8" fill="#fff" />
                            <circle cx="43" cy="32" r="1.8" fill="#fff" />
                        </g>
                    )}
                    {eyeStyle === 1 && (
                        <g>
                            <rect x="18" y="30" width="10" height="6" rx="3" fill="#0f172a" />
                            <rect x="36" y="30" width="10" height="6" rx="3" fill="#0f172a" />
                        </g>
                    )}
                    {eyeStyle === 2 && (
                        <g>
                            <circle cx="23" cy="34" r="5" fill="#0f172a" style={{ transformOrigin: '23px 34px', animation: 'agentMascotBlink 4s infinite' }} />
                            <circle cx="41" cy="34" r="5" fill="#0f172a" style={{ transformOrigin: '41px 34px', animation: 'agentMascotBlink 4s infinite' }} />
                            <circle cx="25" cy="32" r="1.8" fill="#fff" />
                            <circle cx="43" cy="32" r="1.8" fill="#fff" />
                        </g>
                    )}
                    {/* Рот */}
                    <path d="M27 44 Q32 49 37 44" fill="none" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
                    {/* Щёчки */}
                    <circle cx="17" cy="40" r="3" fill={resolvedColor} opacity="0.5" />
                    <circle cx="47" cy="40" r="3" fill={resolvedColor} opacity="0.5" />
                </svg>
            </div>
            {showStatus && dotColor && <span style={{ position: 'absolute', right: -1, bottom: -1, width: px * 0.28, height: px * 0.28, borderRadius: '50%', background: dotColor, border: `2px solid #0f172a`, zIndex: 2 }} />}
        </div>
    );
};
