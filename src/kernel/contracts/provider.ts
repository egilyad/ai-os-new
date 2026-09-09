export type RequestIntent = 'code' | 'creative' | 'factual' | 'math' | 'analysis' | 'general';
export type RequestLanguage = 'en' | 'ru' | 'other';

export interface RequestClassification {
    complexity: 'simple' | 'medium' | 'complex';
    isCode: boolean;
    isLong: boolean;
    isMultimodal: boolean;
    intent: RequestIntent;
    language: RequestLanguage;
}

export interface RouterDecision {
    provider: string;
    model: string;
    keyId?: string;
    confidence: number;
    reasoning: string;
}
