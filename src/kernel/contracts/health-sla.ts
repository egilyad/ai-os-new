export interface SlaRule {
    id: string;
    name: string;
    metric: 'latency' | 'uptime' | 'error_rate' | 'throughput';
    operator: 'gt' | 'lt' | 'gte' | 'lte' | 'eq';
    threshold: number;
    unit: string;
    severity: 'critical' | 'warning' | 'info';
    enabled: boolean;
}

export interface SlaProfile {
    id: string;
    name: string;
    description: string;
    rules: SlaRule[];
    providers: string[];
    createdAt: number;
    updatedAt: number;
}

export interface IHealthSlaService {
    getProfiles(): SlaProfile[];
    getProfile(id: string): SlaProfile | undefined;
    createProfile(name: string, description: string): SlaProfile;
    updateProfile(id: string, updates: Partial<SlaProfile>): SlaProfile;
    deleteProfile(id: string): void;
    addRule(profileId: string, rule: Omit<SlaRule, 'id'>): SlaRule;
    updateRule(profileId: string, ruleId: string, updates: Partial<SlaRule>): void;
    removeRule(profileId: string, ruleId: string): void;
    evaluateProfile(profileId: string): { ruleId: string; passed: boolean; actual: number }[];
}
