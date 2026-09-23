/**
 * LiveBridgeService — P.2 (realtime barge-in + tool bridge, additive).
 *
 * Tracks live sessions in kv (`live/*`): bargeIn parks the current turn
 * with a note and marks interruption; resume replays the parked turn;
 * liveTool runs a ToolRunner tool mid-stream and returns the result for
 * injection into the stream.
 */
import type { IEventBus } from '../../types/interfaces';
import type { DataAccessLayer } from '../../dal/types';
import type { IToolRunnerService } from '../../contracts/parity';
import type { ILiveBridgeService } from '../../contracts/rivals10';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('LiveBridge');

interface LiveSession {
    id: string;
    parked?: string;
    interruptions: number;
}

export class LiveBridgeService implements ILiveBridgeService {
    constructor(
        private dal: DataAccessLayer,
        private events: IEventBus,
        private tools?: IToolRunnerService,
    ) {}

    async init(): Promise<void> {
        LOGGER.info('LiveBridge', 'init', {});
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    async bargeIn(sessionId: string, note = 'user interrupted'): Promise<string> {
        const key = `live/${sessionId.slice(0, 120)}`;
        const session: LiveSession =
            (await this.dal.kv.get<LiveSession>(key)) ?? { id: sessionId, interruptions: 0 };
        session.parked = note.slice(0, 500);
        session.interruptions += 1;
        await this.dal.kv.set(key, session);
        this.events.emit(EVENTS.LIVE_BARGE, { sessionId, interruptions: session.interruptions });
        return `Parked turn (${session.interruptions} interruptions). Say resume to continue.`;
    }

    async resume(sessionId: string): Promise<string> {
        const key = `live/${sessionId.slice(0, 120)}`;
        const session = await this.dal.kv.get<LiveSession>(key);
        if (!session?.parked) return 'Nothing parked — stream is live.';
        const parked = session.parked;
        session.parked = undefined;
        await this.dal.kv.set(key, session);
        return `Resuming parked turn: ${parked}`;
    }

    async liveTool(sessionId: string, tool: string, args: Record<string, unknown> = {}): Promise<string> {
        if (!this.tools) throw new Error('Tool runner unavailable for live injection');
        const out = await this.tools.callTool(`live:${sessionId.slice(0, 80)}`, tool, args);
        this.events.emit(EVENTS.LIVE_TOOL, { sessionId, tool });
        return out.slice(0, 3000);
    }
}
