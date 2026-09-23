/**
 * DeckService — K.3 (Gamma-style outline → slides, additive).
 *
 * LLM outline (JSON slides) with a deterministic fallback structure;
 * slides cap at 12; markdown export renders title/bullets/speaker notes.
 */
import type { ILLMClientService } from '../../contracts/provider-adapter';
import type { IDeckService } from '../../contracts/rivals6';
import { rootLogger } from '../logger-service';

const LOGGER = rootLogger.child('Deck');

interface Slide {
    title: string;
    bullets: string[];
    notes?: string;
}

export class DeckService implements IDeckService {
    constructor(private llm?: ILLMClientService) {}

    async init(): Promise<void> {
        LOGGER.info('Deck', 'init', {});
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    async buildDeck(topic: string, slides = 6): Promise<{
        title: string;
        slides: Slide[];
    }> {
        const count = Math.max(3, Math.min(12, slides));
        if (this.llm) {
            try {
                const res = await this.llm.chat(
                    [
                        {
                            role: 'system',
                            content: `Build a ${count}-slide outline. Reply as JSON ONLY: {"slides":[{"title":"...","bullets":["..."],"notes":"..."}]}. Max 5 bullets per slide.`,
                        },
                        { role: 'user', content: topic.slice(0, 1000) },
                    ],
                    { temperature: 0.5, maxTokens: 2000 },
                );
                if (!res.error) {
                    const start = res.content.indexOf('{');
                    if (start >= 0) {
                        const parsed = JSON.parse(
                            res.content.slice(start, res.content.lastIndexOf('}') + 1),
                        ) as { slides?: Array<{ title?: string; bullets?: string[]; notes?: string }> };
                        const out = (parsed.slides ?? [])
                            .filter((s) => s.title)
                            .map((s) => ({
                                title: String(s.title).slice(0, 160),
                                bullets: (s.bullets ?? []).map((b) => String(b).slice(0, 300)).slice(0, 5),
                                notes: s.notes ? String(s.notes).slice(0, 500) : undefined,
                            }))
                            .slice(0, count);
                        if (out.length > 0) return { title: topic.slice(0, 160), slides: out };
                    }
                }
            } catch (e) {
                LOGGER.warn('Deck', 'deck build failed, fallback structure', {
                    error: e instanceof Error ? e.message : String(e),
                });
            }
        }
        const fallback: Slide[] = [
            { title: topic.slice(0, 160), bullets: ['Goal', 'Audience', 'Key message'] },
        ];
        for (let i = 2; i <= count; i++) {
            fallback.push({ title: `Point ${i - 1}`, bullets: ['Evidence', 'Example', 'Takeaway'] });
        }
        return { title: topic.slice(0, 160), slides: fallback };
    }

    exportMarkdown(deck: { title: string; slides: Slide[] }): string {
        const parts = [`# ${deck.title}`, ''];
        for (const s of deck.slides) {
            parts.push(`## ${s.title}`, '');
            for (const b of s.bullets) parts.push(`- ${b}`);
            parts.push('');
            if (s.notes) parts.push(`> ${s.notes}`, '');
        }
        parts.push('---');
        return parts.join('\n').slice(0, 20000);
    }
}
