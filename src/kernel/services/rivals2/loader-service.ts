/**
 * LoaderService — G.1 (LangChain-style loaders + splitter, additive).
 *
 * text/url/workspace loaders → LoadedDoc; recursive char splitter with
 * overlap; toDoc converter (Haystack-style text→doc). Stateles except an
 * in-memory doc cache (durable copy lives in KnowledgeService).
 */
import type { ILoaderService } from '../../contracts/rivals2';
import type { LoadedDoc } from '../../types/rival2-types';
import type { IWorkspaceService } from '../../contracts/workspace';
import type { ILLMClientService } from '../../contracts/provider-adapter';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';

const LOGGER = rootLogger.child('Loader');

function now(): number {
    return Date.now();
}

export class LoaderService implements ILoaderService {
    private cache = new Map<string, LoadedDoc>();

    constructor(
        private workspace?: IWorkspaceService,
        private llm?: ILLMClientService,
    ) {}

    async init(): Promise<void> {
        LOGGER.info('Loader', 'init', {});
    }

    async destroy(): Promise<void> {
        this.cache.clear();
    }

    async loadText(title: string, content: string): Promise<LoadedDoc> {
        const doc: LoadedDoc = {
            id: genId('doc'),
            title: title.slice(0, 200),
            chunks: this.split(content, 800, 120),
            createdAt: now(),
        };
        this.cache.set(doc.id, doc);
        return doc;
    }

    async loadUrl(title: string, url: string): Promise<LoadedDoc> {
        let content = '';
        try {
            const ctrl = new AbortController();
            const timer = setTimeout(() => ctrl.abort(), 12000);
            try {
                const res = await fetch(url, { signal: ctrl.signal });
                if (res.ok) {
                    content = (await res.text())
                        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
                        .replace(/<[^>]+>/g, ' ')
                        .replace(/\s+/g, ' ')
                        .trim()
                        .slice(0, 60000);
                }
            } finally {
                clearTimeout(timer);
            }
        } catch (e) {
            LOGGER.warn('Loader', 'url load failed', { url, error: e instanceof Error ? e.message : String(e) });
        }
        const doc: LoadedDoc = {
            id: genId('doc'),
            title: title.slice(0, 200),
            uri: url,
            chunks: this.split(content, 800, 120),
            createdAt: now(),
        };
        this.cache.set(doc.id, doc);
        return doc;
    }

    async loadWorkspace(path: string): Promise<LoadedDoc> {
        if (!this.workspace?.isAttached()) {
            throw new Error('No workspace attached');
        }
        const content = await this.workspace.readFile(path);
        return this.loadText(path, content);
    }

    /** Recursive splitter: paragraphs → sentences → hard windows. */
    split(text: string, chunkSize = 800, overlap = 120): string[] {
        const paras = text.split(/\n\s*\n/u).map((p) => p.trim()).filter((p) => p.length > 0);
        const out: string[] = [];
        for (const para of paras) {
            if (para.length <= chunkSize) {
                out.push(para);
                continue;
            }
            const sentences = para.split(/(?<=[.!?])\s+/u);
            let buf = '';
            const flush = () => {
                if (buf.trim()) out.push(buf.trim());
                buf = buf.slice(-overlap);
            };
            for (const s of sentences) {
                if ((buf + ' ' + s).length > chunkSize && buf.trim()) flush();
                buf = buf ? `${buf} ${s}` : s;
            }
            if (buf.trim()) out.push(buf.trim().slice(0, chunkSize));
        }
        return out.slice(0, 300);
    }

    toDoc(text: string): { title: string; chunks: string[] } {
        const first = text.split('\n')[0]?.trim().slice(0, 120) || 'untitled';
        return { title: first, chunks: this.split(text) };
    }

    /** Agno-style proposition chunking: atomic claims via LLM, fallback split. */
    async agenticChunk(text: string): Promise<string[]> {
        if (this.llm) {
            try {
                const res = await this.llm.chat(
                    [
                        {
                            role: 'system',
                            content:
                                'Split the text into atomic factual propositions, one per line starting with "- ". No preamble.',
                        },
                        { role: 'user', content: text.slice(0, 6000) },
                    ],
                    { temperature: 0.1, maxTokens: 1500 },
                );
                if (!res.error) {
                    const props = res.content
                        .split('\n')
                        .map((l) => l.replace(/^-\s*/, '').trim())
                        .filter((l) => l.length > 0)
                        .slice(0, 100);
                    if (props.length > 0) return props;
                }
            } catch (e) {
                LOGGER.warn('Loader', 'agentic chunk failed, fallback split', {
                    error: e instanceof Error ? e.message : String(e),
                });
            }
        }
        return this.split(text);
    }
}
