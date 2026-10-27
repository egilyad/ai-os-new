/** 12 классов дефектов (см. вики: аудит-defect-*). */
export const DEFECT_CLASSES = [
    'memory-leaks',
    'security',
    'data-integrity',
    'race-lifecycle',
    'types-contracts',
    'performance',
    'ux-correctness',
    'build-deploy-config',
    'observability',
    'logic',
    'state-consistency',
    'contract-violations',
] as const;

export type DefectClass = (typeof DEFECT_CLASSES)[number];

export type DefectSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface DefectFinding {
    id: string;
    defectClass: DefectClass;
    module: string;
    severity: DefectSeverity;
    description: string;
    createdAt: number;
    resolved?: boolean;
}
