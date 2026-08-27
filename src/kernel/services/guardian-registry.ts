import type { IGuardian, IBridgeKeeperService } from '../contracts/guardian';
import type {
    GuardianAspect,
    GuardianBlessing,
    GuardianWarning,
    GuardianStatus,
} from '../contracts/guardian';

interface GuardianConfig {
    name: string;
    aspect: GuardianAspect;
    providers: string[];
    emoji: string;
    color: string;
    philosophy: string;
}

const GUARDIAN_CONFIGS: GuardianConfig[] = [
    {
        name: 'Sprinter',
        aspect: 'speed',
        providers: ['groq'],
        emoji: '⚡',
        color: '#22c55e',
        philosophy: 'Мгновенно — это единственная скорость',
    },
    {
        name: 'Guardian',
        aspect: 'security',
        providers: ['openai', 'anthropic', 'generic'],
        emoji: '🛡️',
        color: '#3b82f6',
        philosophy: 'Доверяй, но проверяй',
    },
    {
        name: 'Titan',
        aspect: 'power',
        providers: ['nvidia', 'together'],
        emoji: '🏔️',
        color: '#ef4444',
        philosophy: 'Нет задач, которые нельзя решить',
    },
    {
        name: 'Phantom',
        aspect: 'routing',
        providers: ['openrouter'],
        emoji: '👻',
        color: '#a855f7',
        philosophy: 'Все дороги ведут к ответу',
    },
    {
        name: 'Merchant',
        aspect: 'cost',
        providers: [],
        emoji: '💰',
        color: '#f59e0b',
        philosophy: 'Мудрость приходит с ценой',
    },
    {
        name: 'Hermit',
        aspect: 'local',
        providers: ['ollama', 'lmstudio'],
        emoji: '🏔️',
        color: '#92400e',
        philosophy: 'Лучший сервер — твой',
    },
    {
        name: 'Muse',
        aspect: 'creativity',
        providers: ['gemini'],
        emoji: '✨',
        color: '#ec4899',
        philosophy: 'Вдохновение — точная наука',
    },
];

class GuardianImpl implements IGuardian {
    public readonly name: string;
    public readonly aspect: GuardianAspect;
    public readonly providers: string[];
    public readonly emoji: string;
    public readonly color: string;
    public readonly philosophy: string;

    private _uptime = 0;
    private _lastActive = Date.now();
    private _active = true;

    constructor(config: GuardianConfig) {
        this.name = config.name;
        this.aspect = config.aspect;
        this.providers = config.providers;
        this.emoji = config.emoji;
        this.color = config.color;
        this.philosophy = config.philosophy;
    }

    getBlessing(provider: string, _request: Record<string, unknown>): GuardianBlessing | null {
        if (!this.providers.includes(provider) && this.providers.length > 0) return null;
        const baseScore = this.aspect === 'speed' ? 0.95 : this.aspect === 'power' ? 0.9 : 0.8;
        return {
            provider,
            score: baseScore + Math.random() * 0.1,
            reason: `${this.name} благословляет запрос к ${provider}: ${this.philosophy}`,
        };
    }

    getWarning(provider: string, status: Record<string, unknown>): GuardianWarning | null {
        if (!this.providers.includes(provider) && this.providers.length > 0) return null;
        if (status.latency && (status.latency as number) > 5000) {
            return {
                provider,
                severity: 'warning',
                message: `${this.name} предупреждает: высокая задержка у ${provider}`,
            };
        }
        return null;
    }

    getStatus(): GuardianStatus {
        return {
            name: this.name,
            aspect: this.aspect,
            active: this._active,
            providers: this.providers,
            providerCount: this.providers.length,
            uptime: this._uptime,
            lastActive: this._lastActive,
        };
    }

    ping(): void {
        this._lastActive = Date.now();
        this._uptime += 1;
    }
}

export class BridgeKeeperService implements IBridgeKeeperService {
    private guardians: Map<string, GuardianImpl> = new Map();

    constructor() {
        for (const config of GUARDIAN_CONFIGS) {
            this.guardians.set(config.name.toLowerCase(), new GuardianImpl(config));
        }
    }

    getGuardian(name: string): IGuardian | undefined {
        return this.guardians.get(name.toLowerCase());
    }

    getGuardiansByAspect(aspect: GuardianAspect): IGuardian[] {
        return Array.from(this.guardians.values()).filter((g) => g.aspect === aspect);
    }

    getAllGuardians(): IGuardian[] {
        return Array.from(this.guardians.values());
    }

    getGuardianForProvider(provider: string): IGuardian | undefined {
        const lower = provider.toLowerCase();
        return Array.from(this.guardians.values()).find((g) =>
            g.providers.some((p) => lower.includes(p) || p.includes(lower)),
        );
    }

    getBlessing(provider: string, request: Record<string, unknown>): GuardianBlessing | null {
        const guardian = this.getGuardianForProvider(provider);
        if (!guardian) return null;
        (guardian as GuardianImpl).ping();
        return guardian.getBlessing(provider, request);
    }

    getWarning(provider: string, status: Record<string, unknown>): GuardianWarning | null {
        const guardian = this.getGuardianForProvider(provider);
        if (!guardian) return null;
        return guardian.getWarning(provider, status);
    }
}
