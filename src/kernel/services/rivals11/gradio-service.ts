/**
 * GradioService — Q.2 (interfaces + flagging, additive).
 *
 * Interface definitions (named inputs → tool/crew execution → string
 * output) in DAL kv; predictions run the bound backend; flagging stores
 * reviewed samples for later hardening.
 */
import type { DataAccessLayer } from '../../dal/types';
import type { IToolRunnerService } from '../../contracts/parity';
import type { ICrewService } from '../../contracts/crew';
import type { IGradioService } from '../../contracts/rivals11';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';

const LOGGER = rootLogger.child('Gradio');

interface InterfaceDoc {
    id: string;
    name: string;
    inputs: string[];
    tool?: string;
    crewId?: string;
}

export class GradioService implements IGradioService {
    constructor(
        private dal: DataAccessLayer,
        private tools?: IToolRunnerService,
        private crews?: ICrewService,
    ) {}

    async init(): Promise<void> {
        LOGGER.info('init', {});
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    async defineInterface(input: { name: string; inputs: string[]; tool?: string; crewId?: string }): Promise<string> {
        if (input.inputs.length === 0) throw new Error('Interface needs inputs');
        if (!input.tool && !input.crewId) throw new Error('Interface needs a tool or crewId backend');
        const doc: InterfaceDoc = {
            id: genId('gradio'),
            name: input.name.slice(0, 120),
            inputs: input.inputs.map((i) => i.slice(0, 80)).slice(0, 12),
            tool: input.tool,
            crewId: input.crewId,
        };
        await this.dal.kv.set(`gradio/${doc.id}`, doc);
        return doc.id;
    }

    async predict(interfaceId: string, values: Record<string, string>): Promise<string> {
        const doc = await this.dal.kv.get<InterfaceDoc>(`gradio/${interfaceId}`);
        if (!doc) throw new Error(`Interface not found: ${interfaceId}`);
        const args: Record<string, unknown> = {};
        for (const name of doc.inputs) args[name] = (values[name] ?? '').slice(0, 4000);
        if (doc.tool) {
            if (!this.tools) throw new Error('Tool runner unavailable');
            return this.tools.callTool('gradio', doc.tool, args);
        }
        if (doc.crewId) {
            if (!this.crews) throw new Error('Crew runner unavailable');
            const res = await this.crews.startCrew(doc.crewId);
            return Object.values(res.outputs).join('\n---\n').slice(0, 4000) || `crew ${res.status}`;
        }
        throw new Error('Interface has no backend');
    }

    async flag(interfaceId: string, values: Record<string, string>, note = ''): Promise<void> {
        await this.dal.kv.set(`gradio-flags/${genId('flag')}`, {
            interfaceId,
            values,
            note: note.slice(0, 500),
            at: Date.now(),
        });
    }
}
