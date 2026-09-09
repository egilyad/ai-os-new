export interface SecurityFinding {
    category: 'injection' | 'pii' | 'extraction' | 'dangerous' | 'jailbreak';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    match: string;
    position?: { start: number; end: number };
}

export interface PromptScanResult {
    safe: boolean;
    score: number;
    findings: SecurityFinding[];
    summary: string;
}

export interface SecurityScanRule {
    id: string;
    name: string;
    category: SecurityFinding['category'];
    pattern: string;
    severity: SecurityFinding['severity'];
    enabled: boolean;
    description: string;
}

export interface SecurityScanConfig {
    enabled: boolean;
    blockOnScore: number;
    rules: SecurityScanRule[];
}

export interface SecurityScanEvent {
    prompt: string;
    result: PromptScanResult;
    provider?: string;
    model?: string;
    timestamp: number;
    blocked: boolean;
}

export interface IPromptSecurityService {
    scan(prompt: string): PromptScanResult;
    getConfig(): SecurityScanConfig;
    updateConfig(config: Partial<SecurityScanConfig>): void;
    addEvent(event: SecurityScanEvent): Promise<void>;
    getHistory(): Promise<SecurityScanEvent[]>;
    clearHistory(): Promise<void>;
}
