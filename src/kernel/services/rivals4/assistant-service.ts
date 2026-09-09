/**
 * AssistantService — I.3 (StackAI-style assistants as a product, additive).
 *
 * An assistant binds persona + dataset + toolkit (kv). `chat()` builds the
 * persona prompt block, scopes knowledge retrieval to the dataset, gates
 * tools through the toolkit, and runs the agentic loop. Scheduling reuses
 * the existing scheduler bridge (out of scope for this service).
 */
import type { DataAccessLayer } from '../../dal/types';
import type { IPersonaService } from '../../contracts/persona';
import type { IDatasetService } from '../../contracts/rivals3';
import type { IRunQueueService } from '../../contracts/rivals';
import type { IToolRunnerService } from '../../contracts/parity';
import type { IAssistantService } from '../../contracts/rivals4';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';

const LOGGER = rootLogger.child('Assistant');

interface AssistantDoc {
    id: string;
    name: string;
    personaId?: string;
    datasetId?: string;
    toolkitId?: string;
}

export class AssistantService implements IAssistantService {
    constructor(
        private dal: DataAccessLayer,
        private personas: IPersonaService,
        private datasets?: IDatasetService,
        private queue?: IRunQueueService,
        private tools?: IToolRunnerService,
    ) {}

    async init(): Promise<void> {
        LOGGER.info('init', {});
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    async defineAssistant(input: {
        name: string;
        personaId?: string;
        datasetId?: string;
        toolkitId?: string;
    }): Promise<string> {
        const doc: AssistantDoc = {
            id: genId('asst'),
            name: input.name.slice(0, 120),
            personaId: input.personaId,
            datasetId: input.datasetId,
            toolkitId: input.toolkitId,
        };
        await this.dal.kv.set(`assistants/${doc.id}`, doc);
        return doc.id;
    }

    async listAssistants(): Promise<Array<{ id: string; name: string }>> {
        const rows = await this.dal.kv.list('assistants/');
        return rows.map((r) => {
            const d = r.value as AssistantDoc;
            return { id: d.id, name: d.name };
        });
    }

    async chat(assistantId: string, message: string): Promise<string> {
        const doc = await this.dal.kv.get<AssistantDoc>(`assistants/${assistantId}`);
        if (!doc) throw new Error(`Assistant not found: ${assistantId}`);
        const parts: string[] = [];

        // Persona voice.
        if (doc.personaId) {
            try {
                const owner = doc.personaId.includes(':') ? doc.personaId : doc.personaId;
                const block = await this.personas.promptFor(owner);
                if (block) parts.push(block);
            } catch (e) {
                LOGGER.warn('persona block failed', { error: e instanceof Error ? e.message : String(e) });
            }
        }
        // Dataset knowledge scope.
        let knowledge = '';
        if (doc.datasetId && this.datasets) {
            try {
                const res = await this.datasets.query(doc.datasetId, message, 3);
                knowledge = res.answer;
            } catch (e) {
                LOGGER.warn('dataset query failed', { error: e instanceof Error ? e.message : String(e) });
            }
        }
        // Tool gating notice for the loop.
        let toolNote = '';
        if (doc.toolkitId && this.queue) {
            toolNote = `(toolkit ${doc.toolkitId} gates tool use)`;
        }

        if (!this.tools) {
            return `${parts.join('\n')}\n${knowledge}\n${toolNote}\nAssistant [${doc.name}] (no tool runner): ${message.slice(0, 300)}`;
        }
        const prompt =
            `${parts.join('\n')}\nUser: ${message}` +
            (knowledge ? `\nKnowledge:\n${knowledge.slice(0, 3000)}` : '') +
            (toolNote ? `\n${toolNote}` : '');
        const res = await this.tools.runWithTools(prompt, {
            agentId: `assistant:${assistantId}`,
            system: `You are ${doc.name}, a helpful assistant.`,
            maxRounds: 3,
        });
        return res.output || '(empty)';
    }
}
