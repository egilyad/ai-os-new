import type { ILifecycle } from './lifecycle';

export interface SpeakerCandidate {
    id: string;
    name: string;
    role?: string;
    lastMessage?: string;
}

export interface SpeakerDecision {
    speakerId: string;
    reason: string;
    confidence: number;
}

/** LLM-content-based next-speaker selection (AutoGen SelectorGroupChat). */
export interface ISpeakerSelectorService extends ILifecycle {
    select(input: {
        topic: string;
        candidates: SpeakerCandidate[];
        history: Array<{ speakerId: string; content: string }>;
    }): Promise<SpeakerDecision | null>;
}
