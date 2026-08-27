// ── Logical Form Extractor / Enthymeme Detector (P1.25) ──────────────────
// Extracts logical form (major/minor premise + conclusion) from opponent
// arguments. Detects hidden premises (enthymemes) and surfaces them as
// attack targets for the next agent's turn.
// Affects all debate modes, all agents, all rounds — infrastructure service.

export type LogicalFormType =
    | 'syllogism'
    | 'modus_ponens'
    | 'modus_tollens'
    | 'disjunctive_syllogism'
    | 'hypothetical_syllogism'
    | 'categorical_syllogism'
    | 'analogy'
    | 'generalization'
    | 'cause_effect'
    | 'authority'
    | 'unknown';

export interface LogicalPremise {
    text: string;
    isExplicit: boolean; // false = enthymeme (hidden premise)
    confidence: number; // 0-1 heuristic confidence
}

export interface LogicalForm {
    type: LogicalFormType;
    majorPremise: LogicalPremise;
    minorPremise: LogicalPremise;
    conclusion: string;
    isValid: boolean; // whether the logical form is structurally valid
    hasEnthymeme: boolean; // whether a hidden premise was detected
}

export interface EnthymemeTarget {
    agentId: string;
    round: number;
    hiddenPremise: string; // the reconstructed hidden premise
    originalClaim: string;
    confidence: number; // 0-1
}

export interface ILogicalFormExtractor {
    analyzeArgument(agentId: string, round: number, content: string): LogicalForm | null;

    getEnthymemeTargets(agentId: string, round: number): EnthymemeTarget[];

    getFormattedTargets(agentId: string, round: number, language?: string): string;

    clearSession(): void;
}
