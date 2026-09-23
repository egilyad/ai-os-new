/**
 * StudioPackService — P.3 (Chat-Studio one-click packs, additive).
 *
 * Agent packs (name+prompt+tools → crew role + persona distill),
 * MCP quick-add (→ MCPService), KB attach (→ KnowledgeService),
 * glossary translation (LLM with term replacements, offline fallback).
 */
import type { IEventBus } from '../../types/interfaces';
import type { ILLMClientService } from '../../contracts/provider-adapter';
import type { ICrewService } from '../../contracts/crew';
import type { IPersonaService } from '../../contracts/persona';
import type { MCPService } from '../mcp-service';
import type { IKnowledgeService } from '../../contracts/parity';
import type { IStudioPackService } from '../../contracts/rivals10';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('StudioPack');

export class StudioPackService implements IStudioPackService {
    constructor(
        private events: IEventBus,
        private crews: ICrewService,
        private personas?: IPersonaService,
        private mcp?: MCPService,
        private knowledge?: IKnowledgeService,
        private llm?: ILLMClientService,
    ) {}

    async init(): Promise<void> {
        LOGGER.info('StudioPack', 'init', {});
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    async importAgentPack(input: { name: string; prompt: string; tools?: string[] }): Promise<string> {
        const crew = await this.crews.createCrew({
            name: `Studio: ${input.name.slice(0, 80)}`,
            process: 'sequential',
            roles: [
                {
                    name: input.name.slice(0, 80),
                    role: 'Studio agent',
                    goal: input.prompt.slice(0, 500),
                    backstory: `Imported studio pack. Tools: ${(input.tools ?? []).join(', ') || 'none'}.`,
                    tools: input.tools,
                },
            ],
            tasks: [],
        });
        const role = crew.roles[0]!;
        if (this.personas) {
            try {
                await this.personas.distillPerson({
                    ownerId: role.id,
                    displayName: role.name,
                    samples: [input.prompt],
                });
            } catch (e) {
                LOGGER.warn('StudioPack', 'persona distill failed', { error: e instanceof Error ? e.message : String(e) });
            }
        }
        this.events.emit(EVENTS.STUDIO_PACK, { kind: 'agent', ref: role.id });
        return role.id;
    }

    async quickAddMcp(name: string, url: string): Promise<string> {
        if (!this.mcp) throw new Error('MCP bridge unavailable');
        const id = genId('mcp');
        this.mcp.addServer({ id, name: name.slice(0, 120), url });
        this.events.emit(EVENTS.STUDIO_PACK, { kind: 'mcp', ref: id });
        return id;
    }

    async attachKb(name: string, content: string): Promise<string> {
        if (!this.knowledge) throw new Error('Knowledge backend unavailable');
        const source = await this.knowledge.addSource({ kind: 'text', title: name.slice(0, 200), content });
        this.events.emit(EVENTS.STUDIO_PACK, { kind: 'kb', ref: source.id });
        return source.id;
    }

    async translate(text: string, targetLang: string, glossary: Record<string, string> = {}): Promise<string> {
        let out = text;
        for (const [from, to] of Object.entries(glossary)) {
            if (from) out = out.split(from).join(to);
        }
        if (this.llm) {
            try {
                const res = await this.llm.chat(
                    [
                        { role: 'system', content: `Translate to ${targetLang}. Keep glossary terms exact. Reply with the translation only.` },
                        { role: 'user', content: out.slice(0, 4000) },
                    ],
                    { temperature: 0.2, maxTokens: 2000 },
                );
                if (!res.error) return res.content;
            } catch (e) {
                LOGGER.warn('StudioPack', 'translate failed', { error: e instanceof Error ? e.message : String(e) });
            }
        }
        return `${out}\n\n[target: ${targetLang}]`;
    }
}
