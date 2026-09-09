/**
 * BedrockService — I.1 (Bedrock Agents-style groups + KB + guardrails).
 *
 * Action groups map onto ToolRunner tools; KB profiles select LoaderService
 * chunking (fixed/semantic≈agentic/hierarchical≈recursive); guardrails deny
 * topics + redact PII patterns; every call appends to an in-memory trace
 * (cap 200, exposed for the console).
 */
import type { IEventBus } from '../../types/interfaces';
import type { DataAccessLayer } from '../../dal/types';
import type { IToolRunnerService, IKnowledgeService } from '../../contracts/parity';
import type { IBedrockService } from '../../contracts/rivals4';
import type { LoaderService } from '../rivals2/loader-service';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('Bedrock');

const PII_PATTERNS: Array<{ name: string; re: RegExp }> = [
    { name: 'email', re: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g },
    { name: 'phone', re: /\+?\d[\d\s\-()]{7,}\d/g },
    { name: 'card', re: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g },
];

export class BedrockService implements IBedrockService {
    private traceLog: string[] = [];

    constructor(
        private dal: DataAccessLayer,
        private events: IEventBus,
        private tools?: IToolRunnerService,
        private knowledge?: IKnowledgeService,
        private loader?: LoaderService,
    ) {}

    async init(): Promise<void> {
        LOGGER.info('init', {});
    }

    async destroy(): Promise<void> {
        this.traceLog = [];
    }

    private trace(line: string): void {
        this.traceLog.push(line.slice(0, 300));
        if (this.traceLog.length > 200) this.traceLog.splice(0, this.traceLog.length - 200);
    }

    async defineActionGroup(name: string, tools: string[]): Promise<string> {
        const id = genId('agroup');
        await this.dal.kv.set(`bedrock-ag/${id}`, { id, name: name.slice(0, 120), tools });
        this.trace(`action-group ${name}: ${tools.join(', ')}`);
        return id;
    }

    async callAction(groupId: string, tool: string, args: Record<string, unknown> = {}): Promise<string> {
        const group = await this.dal.kv.get<{ name: string; tools: string[] }>(`bedrock-ag/${groupId}`);
        if (!group) throw new Error(`Action group not found: ${groupId}`);
        if (!group.tools.includes(tool)) throw new Error(`Tool ${tool} not in group ${group.name}`);
        if (!this.tools) throw new Error('Tool runner unavailable');
        const out = await this.tools.callTool('bedrock-agent', tool, args);
        this.trace(`${group.name}.${tool} → ${out.length} chars`);
        this.events.emit(EVENTS.BEDROCK_ACTION, { groupId, tool });
        return out;
    }

    async ingestWithProfile(
        title: string,
        content: string,
        chunking: 'fixed' | 'semantic' | 'hierarchical' = 'fixed',
    ): Promise<string> {
        if (!this.knowledge) throw new Error('Knowledge backend unavailable');
        let chunks: string[];
        if (chunking === 'semantic' && this.loader) {
            chunks = await this.loader.agenticChunk(content);
        } else if (this.loader) {
            chunks = this.loader.split(content, chunking === 'hierarchical' ? 1600 : 800, 120);
        } else {
            chunks = [content.slice(0, 4000)];
        }
        const source = await this.knowledge.addSource({
            kind: 'text',
            title: `[${chunking}] ${title}`.slice(0, 200),
            content: chunks.join('\n\n'),
        });
        this.trace(`ingested ${title} (${chunks.length} chunks, ${chunking})`);
        return source.id;
    }

    async guard(text: string): Promise<{ ok: boolean; redacted: string; hits: string[] }> {
        const hits: string[] = [];
        const denied = await this.dal.kv.list('bedrock-denied/');
        const lower = text.toLowerCase();
        for (const row of denied) {
            const topic = String(row.value);
            if (topic && lower.includes(topic.toLowerCase())) hits.push(`denied-topic:${topic}`);
        }
        let redacted = text;
        for (const p of PII_PATTERNS) {
            if (p.re.test(text)) {
                hits.push(`pii:${p.name}`);
                redacted = redacted.replace(p.re, `[REDACTED:${p.name}]`);
            }
        }
        const ok = !hits.some((h) => h.startsWith('denied-topic:'));
        this.events.emit(EVENTS.BEDROCK_GUARD, { ok, hits: hits.length });
        return { ok, redacted, hits };
    }

    async addDeniedTopic(topic: string): Promise<void> {
        await this.dal.kv.set(`bedrock-denied/${genId('dt')}`, topic.slice(0, 200));
    }

    async trace(): Promise<string[]> {
        return [...this.traceLog];
    }
}
