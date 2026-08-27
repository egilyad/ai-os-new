export type ComplianceStandard = 'SOC2' | 'HIPAA' | 'GDPR' | 'ISO27001' | 'PCI_DSS';

export interface ComplianceStatus {
    standard: ComplianceStandard;
    certified: boolean;
    certifiedSince?: number;
    expiresAt?: number;
}

export interface SLARecord {
    period: string;
    uptime: number;
    p50Latency: number;
    p95Latency: number;
    p99Latency: number;
    totalRequests: number;
    errorRate: number;
}

export interface RegionStatus {
    region: string;
    name: string;
    available: boolean;
    latency: number;
    models: string[];
}

export interface EnterpriseFeature {
    id: string;
    name: string;
    description: string;
    enabled: boolean;
    category: 'security' | 'compliance' | 'performance' | 'management';
}

export interface NvidiaEnterpriseConfig {
    defaultRegion: string;
    enableCompliance: boolean;
    slaTarget: number;
    budgetAlert: number;
    costOptimization: boolean;
    ngcApiKey?: string;
    ngcOrg?: string;
}

export interface NgcConnectionStatus {
    connected: boolean;
    org?: string;
    lastCheck?: number;
    error?: string;
}

export interface INvidiaEnterpriseService {
    getConfig(): NvidiaEnterpriseConfig;
    updateConfig(config: Partial<NvidiaEnterpriseConfig>): void;
    getCompliance(): ComplianceStatus[];
    getSLAHistory(): SLARecord[];
    getRegions(): RegionStatus[];
    getFeatures(): EnterpriseFeature[];
    toggleFeature(id: string, enabled: boolean): void;
    getEstimatedCosts(): { model: string; costPer1k: number; usage: number; total: number }[];
    getConnectionStatus(): NgcConnectionStatus;
    connectNgc(apiKey: string, org?: string): Promise<NgcConnectionStatus>;
    disconnectNgc(): void;
}
