/**
 * NotebookService — P.1 (NotebookLM-style notebooks, additive).
 *
 * Notebooks bind knowledge source ids (kv). audioScript builds a
 * two-host podcast script via LLM (or outline fallback); TTS rendering is
 * a delegate port (queued note without one). mindmap builds a topic tree
 * JSON from chunk keywords. askNotebook scopes RAG to member sources.
 */
import type { IEventBus } from '../../types/interfaces';
import type { DataAccessLayer } from '../../dal/types';
import type { ILLMClientService } from '../../contracts/provider-adapter';
import type { IKnowledgeService } from '../../contracts/parity';
import type { INotebookService } from '../../contracts/rivals10';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('Notebook');

interface NotebookDoc {
    id: string;
    title: string;
    sourceIds: string[];
}

export class NotebookService implements INotebookService {
    constructor(
        private dal: DataAccessLayer,
        private events: IEventBus,
        private knowledge?: IKnowledgeService,
        private llm?: ILLMClientService,
        private tts?: (script: string) => Promise<string>,
    ) {}

    async init(): Promise<void> {
        LOGGER.info('init', {});
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    async createNotebook(title: string, sourceIds: string[] = []): Promise<string> {
        const doc: NotebookDoc = {
            id: genId('notebook'),
            title: title.slice(0, 160),
            sourceIds: [...sourceIds],
        };
        await this.dal.kv.set(`notebooks/${doc.id}`, doc);
        return doc.id;
    }

    async audioScript(notebookId: string): Promise<string> {
        const passages = await this.passages(notebookId, 6);
        const material = passages.map((p) => `[${p.title}] ${p.chunk}`).join('\n');
        let script: string;
        if (this.llm && material) {
            try {
                const res = await this.llm.chat(
                    [
                        { role: 'system', content: 'Write a 2-host podcast script (HOST A / HOST B turns) summarizing these passages. 400 words max.' },
                        { role: 'user', content: material.slice(0, 6000) },
                    ],
                    { temperature: 0.6, maxTokens: 1200 },
                );
                script = res.error ? this.outlineScript(material) : res.content;
            } catch (e) {
                LOGGER.warn('audio script failed', { error: e instanceof Error ? e.message : String(e) });
                script = this.outlineScript(material);
            }
        } else {
            script = this.outlineScript(material);
        }
        this.events.emit(EVENTS.NOTEBOOK_AUDIO, { notebookId, chars: script.length });
        if (this.tts) {
            try {
                const ref = await this.tts(script);
                return `${script}\n\n[tts: ${ref}]`;
            } catch {
                return `${script}\n\n[tts queued — renderer unavailable]`;
            }
        }
        return `${script}\n\n[tts queued — no renderer attached]`;
    }

    async mindmap(notebookId: string): Promise<string> {
        const passages = await this.passages(notebookId, 20);
        const topics = new Map<string, number>();
        for (const p of passages) {
            for (const w of p.chunk.toLowerCase().split(/[^a-zа-яё0-9]+/u).filter((t) => t.length > 4)) {
                topics.set(w, (topics.get(w) ?? 0) + 1);
            }
        }
        const top = [...topics.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);
        const tree = {
            root: notebookId,
            children: top.map(([topic, weight]) => ({ topic, weight })),
        };
        return JSON.stringify(tree, null, 2);
    }

    async askNotebook(notebookId: string, question: string): Promise<string> {
        const doc = await this.dal.kv.get<NotebookDoc>(`notebooks/${notebookId}`);
        if (!doc) throw new Error(`Notebook not found: ${notebookId}`);
        if (!this.knowledge) return '(no knowledge backend)';
        const hits = await this.knowledge.retrieve(question, 10);
        const scoped = doc.sourceIds.length > 0 ? hits.filter((h) => doc.sourceIds.includes(h.sourceId)) : hits;
        const top = scoped.slice(0, 4);
        if (top.length === 0) return 'Notebook has no passages for this question.';
        return top.map((h, i) => `[${i + 1}] ${h.title}: ${h.chunk.slice(0, 400)}`).join('\n');
    }

    private async passages(notebookId: string, limit: number): Promise<Array<{ title: string; chunk: string }>> {
        const doc = await this.dal.kv.get<NotebookDoc>(`notebooks/${notebookId}`);
        if (!doc) throw new Error(`Notebook not found: ${notebookId}`);
        if (!this.knowledge) return [];
        const sources = await this.knowledge.listSources();
        const membered = doc.sourceIds.length > 0 ? sources.filter((s) => doc.sourceIds.includes(s.id)) : sources;
        const out: Array<{ title: string; chunk: string }> = [];
        for (const s of membered) {
            for (const chunk of s.chunks.slice(0, 4)) {
                out.push({ title: s.title, chunk });
                if (out.length >= limit) return out;
            }
        }
        return out;
    }

    private outlineScript(material: string): string {
        if (!material) return 'HOST A: No sources in this notebook yet.\nHOST B: Add sources to generate an overview.';
        const first = material.split('\n')[0]?.slice(0, 300) ?? '';
        return `HOST A: Today we break down fresh material.\nHOST B: Starting point — ${first}\nHOST A: More in the full notes.`;
    }
}
