export type VetoSurface = 'assistant' | 'chat';

export interface VetoGateMatch {
    templateId: string;
    name: string;
    text: string;
    matchMode: string;
}

export interface IVetoGate {
    check(output: string, surface?: VetoSurface): VetoGateMatch[];
}
