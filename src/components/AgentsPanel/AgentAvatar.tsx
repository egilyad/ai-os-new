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
    const id = `mascot-${agentId || 'unknown'}-${h % 97}`;
    const wink = h % 4 === 0; // вариант: одно «подмигивающее» око

    return (
        <div style={{ position: 'relative', width: px, height: px, flexShrink: 0 }}>
            <style>{ANIM_STYLE}</style>
            <div style={{ position: 'absolute', inset: 0, animation: `agentMascotFloat ${4 + (h % 2)}s ease-in-out infinite` }}>
                <svg viewBox="0 0 64 64" width={px} height={px} aria-hidden="true">
                    <defs>
                        <radialGradient id={`${id}-g`} cx="38%" cy="28%" r="80%">
                            <stop offset="0%" stopColor="#fff" stopOpacity="0.95" />
                            <stop offset="40%" stopColor={resolvedColor} stopOpacity="0.9" />
                            <stop offset="100%" stopColor="#1e293b" stopOpacity="0.5" />
                        </radialGradient>
                    </defs>
                    {/* Голова — большая, мягкая, дружелюбная */}
                    <ellipse cx="32" cy="34" rx="26" ry="24" fill={`url(#${id}-g)`} />
                    {/* Большие добрые глаза */}
                    {wink ? (
                        <g>
                            <ellipse cx="22" cy="33" rx="6.5" ry="7" fill="#fff" />
                            <circle cx="24" cy="34" r="3.6" fill="#1e293b" />
                            <circle cx="25.2" cy="32.4" r="1.3" fill="#fff" />
                            <path d="M37 34 Q40 31 43 34" stroke="#1e293b" strokeWidth="2.4" strokeLinecap="round" fill="none" />
                        </g>
                    ) : (
                        <g>
                            <ellipse cx="22" cy="33" rx="6.5" ry="7" fill="#fff" />
                            <circle cx="24" cy="34" r="3.6" fill="#1e293b" />
                            <circle cx="25.2" cy="32.4" r="1.3" fill="#fff" />
                            <ellipse cx="42" cy="33" rx="6.5" ry="7" fill="#fff" />
                            <circle cx="44" cy="34" r="3.6" fill="#1e293b" />
                            <circle cx="45.2" cy="32.4" r="1.3" fill="#fff" />
                        </g>
                    )}
                    {/* Тёплая улыбка */}
                    <path d="M26 45 Q32 52 38 45" fill="none" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" />
                    {/* Щёчки */}
                    <ellipse cx="15" cy="41" rx="3.6" ry="2.6" fill={resolvedColor} opacity="0.55" />
                    <ellipse cx="49" cy="41" rx="3.6" ry="2.6" fill={resolvedColor} opacity="0.55" />
                </svg>
            </div>
            {showStatus && dotColor && <span style={{ position: 'absolute', right: -1, bottom: -1, width: px * 0.28, height: px * 0.28, borderRadius: '50%', background: dotColor, border: `2px solid #0f172a`, zIndex: 2 }} />}
        </div>
    );
};
