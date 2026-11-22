/**
 * Selector-based speaker choice (AutoGen SelectorGroupChat inspiration).
 *
 * Asks the LLM to pick the next speaker from message content rather than a
 * fixed round-robin. Returns null on any failure — callers fall back to their
 * existing adaptive/round-robin strategy, so this is purely additive.
 */
import type {
    ISpeakerSelectorService,
    SpeakerCandidate,
    SpeakerDecision,
} from '../../contracts/speaker-selector';

export class SpeakerSelectorService implements ISpeakerSelectorService {
    constructor(
        private llm: {
            chat(messages: Array<{ role: string; content: string }>): Promise<{ content: string }>;
        },
    ) {}

    async init(): Promise<void> {}

    async destroy(): Promise<void> {}

    async select(input: {
        topic: string;
        candidates: SpeakerCandidate[];
        history: Array<{ speakerId: string; content: string }>;
    }): Promise<SpeakerDecision | null> {
        if (input.candidates.length === 0) return null;
        try {
            const ids = input.candidates.map((c) => c.id);
            const res = await this.llm.chat([
                {
                    role: 'system',
                    content:
                        'Pick the next speaker from the candidate list based on the conversation. ' +
                        'Reply ONLY with JSON: {"speakerId":"<one of the ids>","reason":"...","confidence":0..1}.',
                },
                {
                    role: 'user',
                    content: [
                        `Topic: ${input.topic}`,
                        `Candidates: ${JSON.stringify(input.candidates)}`,
                        `History: ${JSON.stringify(input.history.slice(-10))}`,
                    ].join('\n'),
                },
            ]);
            const start = res.content.indexOf('{');
            const end = res.content.lastIndexOf('}');
            if (start < 0 || end <= start) return null;
            const parsed = JSON.parse(
                res.content.slice(start, end + 1),
            ) as Partial<SpeakerDecision>;
            if (typeof parsed.speakerId !== 'string' || !ids.includes(parsed.speakerId))
                return null;
            return {
                speakerId: parsed.speakerId,
                reason: typeof parsed.reason === 'string' ? parsed.reason : '',
                confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0)),
            };
        } catch {
            return null;
        }
    }
}
