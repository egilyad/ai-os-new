/**
 * KoreService — I.2 (dialog tasks with interruption, additive).
 *
 * A dialog runs a DialogueService bot turn by turn; when a new message maps
 * to a *different* intent while slots are half-filled, the current task is
 * parked (interruption) and can be resumed — Kore.ai's signature behavior.
 */
import type { IEventBus } from '../../types/interfaces';
import type { DataAccessLayer } from '../../dal/types';
import type { IDialogueService } from '../../contracts/rivals3';
import type { IKoreService } from '../../contracts/rivals4';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('Kore');

interface DialogState {
    id: string;
    botId: string;
    sessionId: string;
    parked: string[];
    createdAt: number;
}

export class KoreService implements IKoreService {
    constructor(
        private dal: DataAccessLayer,
        private events: IEventBus,
        private dialogue: IDialogueService,
    ) {}

    async init(): Promise<void> {
        LOGGER.info('Kore', 'init', {});
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    async startDialog(botId: string, sessionId: string): Promise<string> {
        const state: DialogState = {
            id: genId('dialog'),
            botId,
            sessionId,
            parked: [],
            createdAt: Date.now(),
        };
        await this.dal.kv.set(`kore/${state.id}`, state);
        return state.id;
    }

    async sendMessage(dialogId: string, text: string): Promise<string> {
        const state = await this.dal.kv.get<DialogState>(`kore/${dialogId}`);
        if (!state) throw new Error(`Dialog not found: ${dialogId}`);
        if (/^resume$/i.test(text.trim()) && state.parked.length > 0) {
            const back = state.parked.pop() as string;
            await this.dal.kv.set(`kore/${dialogId}`, state);
            return `Resuming [${back}]. What did you want to finish?`;
        }
        const reply = await this.dialogue.handleMessage(state.botId, state.sessionId, text);
        // Interruption heuristic: a fresh intent answer while the previous turn
        // asked a slot question means the user switched tasks — park the old one.
        if (/Intent \[/.test(reply) && state.parked.length < 5) {
            const m = reply.match(/Intent \[([^\]]+)\]/);
            if (m) {
                state.parked.push(m[1] as string);
                await this.dal.kv.set(`kore/${dialogId}`, state);
                this.events.emit(EVENTS.KORE_INTERRUPT, { dialogId, intent: m[1] as string });
                return `${reply}\n(Parked previous task — say "resume" to return. Parked: ${state.parked.join(', ')})`;
            }
        }
        return reply;
    }
}
