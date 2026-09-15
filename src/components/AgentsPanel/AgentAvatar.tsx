import React from 'react';

const AVATAR_IMAGES = [
    '/avatars/alex.png',
    '/avatars/sophia.png',
    '/avatars/james.png',
    '/avatars/ava.png',
    '/avatars/lily.png',
];

function hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
    }
    return Math.abs(hash);
}

function getAgentAvatarImage(agentId: string): string {
    const safeId = agentId || 'unknown';
    const h = hashString(safeId);
    return AVATAR_IMAGES[h % AVATAR_IMAGES.length]!;
}

function getAgentFallbackColor(agentId: string): string {
    const COLORS = [
        '#667eea', '#f093fb', '#4facfe', '#43e97b', '#fa709a',
        '#a18cd1', '#fccb90', '#e0c3fc', '#f5576c', '#89f7fe',
    ];
    const h = hashString(agentId || 'unknown');
    return COLORS[h % COLORS.length]!;
}

function getInitials(name: string, agentId: string): string {
    const source = name || agentId;
    const parts = source.split(/[\s_-]+/).filter(Boolean);
    if (parts.length >= 2) {
        return (parts[0]![0] + parts[1]![0]).toUpperCase();
    }
    return source.slice(0, 2).toUpperCase();
}

export function getAgentAvatar(agentId: string): { color: string; emoji: string } {
    return {
        color: getAgentFallbackColor(agentId),
        emoji: '',
    };
}

interface AgentAvatarProps {
    agentId: string;
    name?: string;
    size?: number;
    ring?: boolean;
    emoji?: string;
    color?: string;
    url?: string;
}

export const AgentAvatar: React.FC<AgentAvatarProps> = ({
    agentId,
    name,
    size = 40,
    ring = false,
    color,
    url,
}) => {
    const imageUrl = url || getAgentAvatarImage(agentId || 'unknown');
    const fallbackColor = color || getAgentFallbackColor(agentId || 'unknown');
    const initials = getInitials(name || '', agentId || '');

    if (imageUrl) {
        return (
            <div
                title={name || agentId}
                style={{
                    width: size,
                    height: size,
                    borderRadius: '50%',
                    flexShrink: 0,
                    userSelect: 'none',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: ring
                        ? `0 0 0 2px ${fallbackColor}, 0 2px 8px ${fallbackColor}40`
                        : '0 1px 3px rgba(0,0,0,0.15)',
                }}
            >
                <img
                    src={imageUrl}
                    alt={name || agentId}
                    width={size}
                    height={size}
                    style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        objectFit: 'cover',
                    }}
                    onError={(e) => {
                        // Fallback to initials on image load error
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                            const fallback = document.createElement('div');
                            fallback.style.cssText = `
                                width: 100%; height: 100%;
                                display: flex; align-items: center; justify-content: center;
                                background: linear-gradient(135deg, ${fallbackColor}, ${fallbackColor}cc);
                                color: white; font-size: ${size * 0.38}px; font-weight: 600;
                                letter-spacing: 0.5px;
                            `;
                            fallback.textContent = initials;
                            parent.appendChild(fallback);
                        }
                    }}
                />
            </div>
        );
    }

    // Pure fallback: gradient + initials
    return (
        <div
            title={name || agentId}
            style={{
                width: size,
                height: size,
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${fallbackColor}, ${fallbackColor}cc)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                userSelect: 'none',
                position: 'relative',
                boxShadow: ring
                    ? `0 0 0 2px ${fallbackColor}, 0 2px 8px ${fallbackColor}40`
                    : '0 1px 3px rgba(0,0,0,0.15)',
                color: 'white',
                fontSize: size * 0.38,
                fontWeight: 600,
                letterSpacing: '0.5px',
            }}
        >
            {initials}
        </div>
    );
};
