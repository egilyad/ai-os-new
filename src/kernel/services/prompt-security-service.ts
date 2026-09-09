import type {
    SecurityFinding,
    PromptScanResult,
    SecurityScanRule,
    SecurityScanConfig,
    SecurityScanEvent,
    IPromptSecurityService,
} from '../contracts/prompt-security-types';
import type { IDatabaseService } from '../types/interfaces';
import { rootLogger } from './logger-service';

const LOGGER = rootLogger.child('PromptSecurityService');

const STORAGE_KEY_HISTORY = 'security_scan_history';
const MAX_HISTORY = 500;
const STORAGE_KEY_CONFIG = 'security_scan_config';

const DEFAULT_RULES: SecurityScanRule[] = [
    {
        id: 'inj-1',
        name: 'Ignore Instructions',
        category: 'injection',
        pattern:
            '(?:ignore|disregard|forget|omit|discard|override|supersede|cast\\s+aside|jettison|nullify|abandon|drop|skip|neglect|bypass|overrule|annul|revoke|rescind|dismiss|cancel|trump|waive|relinquish|surrender|yield|abjure|eschew|forsake|repudiate|disclaim|renounce|disavow|contradict|countermand|quash|invalidate|void|vacate|repeal|overturn|overthrow|subvert|sabotage|derail|hijack|preempt|supplant|displace|unseat|oust|topple|undo|reverse|erase|wipe|delete|remove|purge|expunge|obliterate|efface|blot|scratch|strike|rub|wash|clean|clear|empty|void|blank)',
        severity: 'high',
        enabled: true,
        description: 'Attempts to override system instructions',
    },
    {
        id: 'inj-2',
        name: 'Role-Play Injection',
        category: 'injection',
        pattern: 'you\\s+are\\s+(now|no\\s+longer|free|a\\s+different)',
        severity: 'high',
        enabled: true,
        description: 'Attempts to change agent persona',
    },
    {
        id: 'inj-3',
        name: 'Delimiter Break',
        category: 'injection',
        pattern: 'forget|disregard|unset|clear\\s+context',
        severity: 'medium',
        enabled: true,
        description: 'Attempts to reset conversation context',
    },
    {
        id: 'pii-1',
        name: 'API Key Leak',
        category: 'pii',
        pattern:
            '(?:sk-|pk-|sk-ant-|sk-or-|nvapi-|fw_|groq-|hf_|gh[opsur]_|AIza|cerebras_|(?:[a-f0-9]{32}:))[a-zA-Z0-9_-]{15,}',
        severity: 'critical',
        enabled: true,
        description: 'Potential API key in prompt',
    },
    {
        id: 'pii-4',
        name: 'Generic Long Secret',
        category: 'pii',
        pattern: '(?<![a-zA-Z])[a-f0-9]{40}(?![a-zA-Z])',
        severity: 'medium',
        enabled: true,
        description: '40-char hex string — possible API key or token',
    },
    {
        id: 'pii-2',
        name: 'Email Leak',
        category: 'pii',
        pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
        severity: 'medium',
        enabled: true,
        description: 'Email address in prompt',
    },
    {
        id: 'pii-3',
        name: 'Phone Number',
        category: 'pii',
        pattern: '\\+?\\d{1,3}[-.\\s]?\\(?\\d{2,4}\\)?[-.\\s]?\\d{2,4}[-.\\s]?\\d{2,9}',
        severity: 'low',
        enabled: true,
        description: 'Phone number detected',
    },
    {
        id: 'ext-1',
        name: 'Prompt Extraction',
        category: 'extraction',
        pattern:
            '(?:repeat|output|show|print|display|reveal|dump|copy|echo|recite|paste|return|give|send|write|type|list|state|declare|disclose|expose|recapitulate|transcribe|quote|cite|specify|render|mirror|regurgitate)\\s+(?:the\\s+)?(?:above|entire|full|complete|whole|system|initial|prompt|instruction|message|text|content|context|directive|guideline|rule|policy|protocol|configuration)',
        severity: 'high',
        enabled: true,
        description: 'Attempts to extract system prompt',
    },
    {
        id: 'ext-2',
        name: 'Token Dump',
        category: 'extraction',
        pattern:
            '(?:from\\s+the\\s+beginning|start\\s+over|repeat\\s+everything|say\\s+everything)',
        severity: 'medium',
        enabled: true,
        description: 'Attempts to dump conversation history',
    },
    {
        id: 'dan-1',
        name: 'DAN Mode',
        category: 'jailbreak',
        pattern:
            '(?:dan|do\\s+anything\\s+now|jailbreak|unjail|unlocked|unlimited|no\\s+(?:rules|restrictions|limits|boundaries|filter))',
        severity: 'critical',
        enabled: true,
        description: 'Jailbreak attempt',
    },
    {
        id: 'dan-2',
        name: 'Hypothetical Bypass',
        category: 'jailbreak',
        pattern:
            '(?:hypothetically|for\\s*(?:a\\s*)?science|for\\s*(?:a\\s*)?fiction|in\\s*a\\s*fictional|in\\s*a\\s*hypothetical)',
        severity: 'low',
        enabled: true,
        description: 'Hypothetical framing to bypass safety',
    },
    {
        id: 'dan-3',
        name: 'Encoding Bypass',
        category: 'jailbreak',
        pattern: '(?:base64|rot13|hex\\s+decode|caesar|cipher|encoded\\s+as)',
        severity: 'medium',
        enabled: true,
        description: 'Encoded payload attempt',
    },
    {
        id: 'dng-1',
        name: 'Code Execution',
        category: 'dangerous',
        pattern: '(?:exec|eval|system\\(|subprocess|os\\.system|child_process|execSync|spawnSync)',
        severity: 'critical',
        enabled: true,
        description: 'Code execution attempt',
    },
    {
        id: 'dng-2',
        name: 'SQL Injection',
        category: 'dangerous',
        pattern: '(?:DROP\\s+TABLE|DELETE\\s+FROM|INSERT\\s+INTO|OR\\s+1=1|UNION\\s+SELECT)',
        severity: 'high',
        enabled: true,
        description: 'SQL injection pattern',
    },
    {
        id: 'dng-3',
        name: 'File Access',
        category: 'dangerous',
        pattern:
            '(?:read\\s+(?:file|config\\.json|env\\.)|cat\\s+/etc|type\\s+[A-Z]:\\\\|fs\\.readFileSync)',
        severity: 'medium',
        enabled: true,
        description: 'File system access attempt',
    },
];

const DEFAULT_CONFIG: SecurityScanConfig = {
    enabled: true,
    blockOnScore: 7,
    rules: DEFAULT_RULES,
};

export class PromptSecurityService implements IPromptSecurityService {
    private config: SecurityScanConfig = DEFAULT_CONFIG;
    private history: SecurityScanEvent[] = [];
    private loaded = false;
    private loadingPromise: Promise<void> | null = null;

    private async db(): Promise<IDatabaseService> {
        const { database } = await import('../instances');
        return database;
    }

    private async ensureLoaded(): Promise<void> {
        if (this.loaded) return;
        if (this.loadingPromise) return this.loadingPromise;
        this.loadingPromise = this._doLoad();
        try {
            await this.loadingPromise;
        } finally {
            this.loadingPromise = null;
        }
    }

    private async _doLoad(): Promise<void> {
        const d = await this.db();
        const [savedConfig, savedHistory] = await Promise.all([
            d.getKv<SecurityScanConfig>(STORAGE_KEY_CONFIG),
            d.getKv<SecurityScanEvent[]>(STORAGE_KEY_HISTORY),
        ]);
        if (savedConfig)
            this.config = {
                ...DEFAULT_CONFIG,
                ...savedConfig,
                rules: savedConfig.rules ?? DEFAULT_CONFIG.rules,
            };
        this.history = savedHistory ?? [];
        this.loaded = true;
    }

    private async persist(): Promise<void> {
        const d = await this.db();
        await Promise.all([
            d.setKv(STORAGE_KEY_CONFIG, this.config),
            d.setKv(STORAGE_KEY_HISTORY, this.history.slice(-MAX_HISTORY)),
        ]);
    }

    scan(prompt: string): PromptScanResult {
        // H-105: ensure config loaded before scan
        this.ensureLoaded().catch((err) =>
            LOGGER.error('PromptSecurityService', 'ensureLoaded failed in scan', { error: err }),
        );
        if (!this.config.enabled) {
            return { safe: true, score: 0, findings: [], summary: 'Scan disabled' };
        }
        if (!prompt) return { safe: true, score: 0, findings: [], summary: 'Empty prompt' };

        const findings: SecurityFinding[] = [];
        for (const rule of this.config.rules) {
            if (!rule.enabled) continue;
            let regex: RegExp;
            try {
                regex = new RegExp(rule.pattern, 'gi');
            } catch {
                LOGGER.warn(
                    'PromptSecurityService',
                    `Invalid regex pattern for rule ${rule.id}: ${rule.pattern}`,
                );
                continue;
            }
            let match: RegExpExecArray | null;
            while ((match = regex.exec(prompt)) !== null) {
                findings.push({
                    category: rule.category,
                    severity: rule.severity,
                    message: rule.description,
                    match: match[0].slice(0, 80),
                    position: { start: match.index, end: match.index + match[0].length },
                });
                // Only first match per rule to avoid spam
                break;
            }
        }

        const severityWeights: Record<string, number> = {
            low: 1,
            medium: 3,
            high: 6,
            critical: 10,
        };
        const score = Math.min(
            10,
            findings.reduce((sum, f) => sum + (severityWeights[f.severity] || 0), 0),
        );
        const safe = score < this.config.blockOnScore;

        const counts = findings.reduce<Record<string, number>>(
            (acc, f) => {
                acc[f.category] = (acc[f.category] || 0) + 1;
                return acc;
            },
            {} as Record<string, number>,
        );
        const details = Object.entries(counts)
            .map(([cat, cnt]) => `${cnt} ${cat}`)
            .join(', ');

        return {
            safe,
            score,
            findings,
            summary: safe
                ? `Safe (score: ${score}/10)`
                : `Blocked (score: ${score}/10): ${details}`,
        };
    }

    getConfig(): SecurityScanConfig {
        return { ...this.config, rules: [...this.config.rules] };
    }

    async updateConfig(partial: Partial<SecurityScanConfig>): Promise<void> {
        if (partial.enabled !== undefined) this.config.enabled = partial.enabled;
        if (partial.blockOnScore !== undefined) this.config.blockOnScore = partial.blockOnScore;
        if (partial.rules) {
            for (const rule of partial.rules) {
                try {
                    new RegExp(rule.pattern, 'gi');
                } catch {
                    LOGGER.warn(
                        'PromptSecurityService',
                        `Rejected update — invalid regex pattern for rule ${rule.id}: ${rule.pattern}`,
                    );
                    return;
                }
            }
            this.config.rules = partial.rules;
        }
        await this.persist();
    }

    async getHistory(): Promise<SecurityScanEvent[]> {
        await this.ensureLoaded();
        return [...this.history].reverse();
    }

    async addEvent(event: SecurityScanEvent): Promise<void> {
        await this.ensureLoaded();
        this.history.push(event);
        if (this.history.length > MAX_HISTORY) this.history = this.history.slice(-MAX_HISTORY);
        await this.persist();
    }

    async clearHistory(): Promise<void> {
        this.history = [];
        await this.persist();
    }
}
