/**
 * Agent Avatar Service
 * Deterministic avatar generation from agent IDs
 */

import { rootLogger } from './logger-service';

const LOGGER = rootLogger.child('AgentAvatar');

export interface AvatarConfig {
    emojiPool: string[];
    colorPool: string[];
    shape: 'circle' | 'square' | 'rounded';
}

const DEFAULT_CONFIG: AvatarConfig = {
    emojiPool: [
        '🔴',
        '🔵',
        '🟢',
        '🟡',
        '🟣',
        '🟠',
        '⚫',
        '⚪',
        '🟤',
        '🔺',
        '🔸',
        '💎',
        '⭐',
        '🌙',
        '🔥',
        '💫',
        '🌊',
        '🌿',
        '🎯',
        '🎪',
    ],
    colorPool: [
        '#3498db',
        '#e74c3c',
        '#2ecc71',
        '#f39c12',
        '#9b59b6',
        '#1abc9c',
        '#e67e22',
        '#34495e',
        '#16a085',
        '#c0392b',
        '#8e44ad',
        '#27ae60',
    ],
    shape: 'circle',
};

export interface Avatar {
    emoji: string;
    color: string;
    initials: string;
    seed: string;
}

/**
 * Pure deterministic avatar generator (no instance state). Uses the same
 * emoji/color pools as `AgentAvatar.tsx` so a seeded `config.avatar` matches
 * the avatar that component renders for the same agent id.
 */
const SEED_EMOJI_POOL = [
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
const SEED_COLOR_POOL = [
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

export function generateDeterministicAvatar(agentId: string): { emoji: string; color: string } {
    const hash = hashString(agentId);
    const emojiIndex = hash % SEED_EMOJI_POOL.length;
    const colorIndex = (hash >> 4) % SEED_COLOR_POOL.length;
    return {
        emoji: SEED_EMOJI_POOL[emojiIndex]!,
        color: SEED_COLOR_POOL[colorIndex]!,
    };
}

const MAX_AVATARS = 200;

export class AgentAvatarService {
    private config: AvatarConfig;
    private customAvatars: Map<string, { emoji: string; color: string }> = new Map();

    constructor(config: Partial<AvatarConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    /**
     * Generate deterministic avatar from agent ID
     */
    generate(agentId: string): Avatar {
        // Check for custom avatar first
        const custom = this.customAvatars.get(agentId);
        if (custom) {
            return {
                ...custom,
                initials: this.getInitials(agentId),
                seed: agentId,
            };
        }

        // Generate deterministic values from ID
        const hash = this.hashString(agentId);

        const emojiIndex = hash % this.config.emojiPool.length;
        const colorIndex = (hash >> 4) % this.config.colorPool.length;

        const emoji = this.config.emojiPool[emojiIndex]!;
        const color = this.config.colorPool[colorIndex]!;
        const initials = this.getInitials(agentId);

        return {
            emoji,
            color,
            initials,
            seed: agentId,
        };
    }

    /**
     * Generate CSS for avatar
     */
    getAvatarCSS(avatar: Avatar): Record<string, string> {
        return {
            backgroundColor: avatar.color,
            borderRadius:
                this.config.shape === 'circle'
                    ? '50%'
                    : this.config.shape === 'rounded'
                      ? '30%'
                      : '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.2em',
            color: '#fff',
            fontWeight: 'bold',
            textShadow: '0 1px 2px rgba(0,0,0,0.3)',
        };
    }

    /**
     * Set custom avatar for an agent
     */
    setCustomAvatar(agentId: string, emoji: string, color: string): void {
        this.customAvatars.set(agentId, { emoji, color });
        if (this.customAvatars.size > MAX_AVATARS) {
            const oldest = this.customAvatars.keys().next().value;
            if (oldest !== undefined) this.customAvatars.delete(oldest);
        }
        LOGGER.info('AgentAvatar', 'Custom avatar set', { agentId, emoji, color });
    }

    /**
     * Get custom avatar for an agent
     */
    getCustomAvatar(agentId: string): { emoji: string; color: string } | undefined {
        return this.customAvatars.get(agentId);
    }

    /**
     * Remove custom avatar (revert to deterministic)
     */
    removeCustomAvatar(agentId: string): void {
        this.customAvatars.delete(agentId);
        LOGGER.info('AgentAvatar', 'Custom avatar removed', { agentId });
    }

    /**
     * Get available emojis for selection
     */
    getAvailableEmojis(): string[] {
        return [...this.config.emojiPool];
    }

    /**
     * Get available colors for selection
     */
    getAvailableColors(): string[] {
        return [...this.config.colorPool];
    }

    /**
     * Generate avatar preview (for UI selection)
     */
    generatePreview(seed: string): Avatar {
        const hash = this.hashString(seed + '-preview');

        const emojiIndex = hash % this.config.emojiPool.length;
        const colorIndex = (hash >> 4) % this.config.colorPool.length;

        return {
            emoji: this.config.emojiPool[emojiIndex]!,
            color: this.config.colorPool[colorIndex]!,
            initials: this.getInitials(seed),
            seed,
        };
    }

    private getInitials(agentId: string): string {
        // Extract meaningful initials from agent ID
        const words = agentId
            .replace(/[^a-zA-Z\s]/g, ' ')
            .split(/\s+/)
            .filter((w) => w.length > 0)
            .slice(0, 2);

        if (words.length >= 2) {
            return (words[0]![0]! + words[1]![0]!).toUpperCase();
        }

        if (words.length === 1 && words[0]!.length >= 2) {
            return words[0]!.substring(0, 2).toUpperCase();
        }

        // Fallback: first 2 chars of hash
        return agentId.substring(0, 2).toUpperCase();
    }

    private hashString(str: string): number {
        return hashString(str);
    }

    /**
     * Clear all custom avatars
     */
    clearCustomAvatars(): void {
        this.customAvatars.clear();
        LOGGER.info('AgentAvatar', 'All custom avatars cleared');
    }
}

function hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
    }
    return Math.abs(hash);
}
