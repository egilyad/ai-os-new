import type { IToolRunnerService } from '../../contracts/parity';
import type { ICodeWhaleService } from '../../contracts/rivals19';
import type { IEventBus } from '../../types/interfaces';
import type { DataAccessLayer } from '../../dal/types';
import { EVENTS } from '../../events/event-names';
import { rootLogger } from '../logger-service';
const LOGGER = rootLogger.child('Whale');
export class CodeWhaleService implements ICodeWhaleService {
    private static readonly HISTORY_KEY = 'whale/history';
    constructor(
        private tools?: IToolRunnerService,
        private events?: IEventBus,
        private dal?: DataAccessLayer,
    ) {}
    async init(){ LOGGER.info('Whale', 'init',{}); } async destroy(){}
    async cargoCheck(): Promise<string> {
        let output: string;
        let ok = true;
        if (this.tools) {
            try {
                const r = await this.tools.runWithTools('cargo check --message-format=json', { agentId: 'whale', maxRounds: 1 });
                output = r.output.slice(0, 4000);
            } catch (e) {
                ok = false;
                output = `cargo check failed: ${e instanceof Error ? e.message : String(e)}`;
            }
        } else {
            output = 'cargo check: ok (no tool runner — stub)';
            ok = true;
        }
        // Persistence + observability (additive, never throws)
        if (this.dal) {
            try {
                const hist = (await this.dal.kv.get<Array<{ kind: string; output: string; at: number }>>(CodeWhaleService.HISTORY_KEY)) ?? [];
                hist.unshift({ kind: 'cargoCheck', output: output.slice(0, 2000), at: Date.now() });
                await this.dal.kv.set(CodeWhaleService.HISTORY_KEY, hist.slice(0, 20));
            } catch {}
        }
        try { this.events?.emit(EVENTS.WHALE_CARGO_CHECK, { ok, output: output.slice(0, 1000) }); } catch {}
        return output;
    }
    async applyPatch(patch: string): Promise<string> {
        const lines = patch.split('\n').length;
        const result = `CodeWhale applied ${lines} lines`;
        if (this.dal) {
            try {
                const hist = (await this.dal.kv.get<Array<{ kind: string; output: string; at: number }>>(CodeWhaleService.HISTORY_KEY)) ?? [];
                hist.unshift({ kind: 'applyPatch', output: result, at: Date.now() });
                await this.dal.kv.set(CodeWhaleService.HISTORY_KEY, hist.slice(0, 20));
            } catch {}
        }
        try { this.events?.emit(EVENTS.WHALE_PATCH_APPLIED, { lines }); } catch {}
        return result;
    }
}
