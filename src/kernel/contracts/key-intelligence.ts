export interface RiskFactor {
  type: 'duplicate' | 'invalid_format' | 'unused' | 'high_latency' | 'high_error_rate' | 'quota_exhausted' | 'compromised' | 'low_reputation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

export interface KeyRiskAssessment {
  fingerprint: string;
  raw: string;
  provider: string | null;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  factors: RiskFactor[];
}

export interface AccountGroup {
  accountId: string;
  provider: string;
  label: string;
  keyCount: number;
  riskScore: number;
  keyFingerprints: string[];
}

export interface ParsedKeyResult {
  raw: string;
  provider: string | null;
  fingerprint: string;
  isValid: boolean;
  validationError?: string;
  accountId?: string;
}

export interface KeyImportReport {
  totalInput: number;
  parsed: ParsedKeyResult[];
  added: number;
  duplicates: number;
  invalid: number;
  groups: AccountGroup[];
  riskAssessments: KeyRiskAssessment[];
  recommendations: string[];
  timestamp: number;
}

export interface KeyIntelligenceInput {
  rawText: string;
  existingKeys?: { fingerprint: string; provider: string; label: string }[];
}

export interface IKeyIntelligencePipeline {
  run(input: KeyIntelligenceInput): Promise<KeyImportReport>;
  assessRisk(fingerprint: string, provider: string | null, rawKey?: string): Promise<KeyRiskAssessment>;
  groupByAccount(parsed: ParsedKeyResult[]): Promise<AccountGroup[]>;
}
