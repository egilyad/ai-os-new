/**
 * VoiceAgentService — K.3 (Vapi-style voice calls, additive).
 *
 * Call records in DAL kv with transcript turns. TTS/STT are delegate ports:
 * without delegates the "audio" is recorded as queued text notes (honest —
 * no fake telephony). Function tools run through ToolRunner each turn.
 */
import type { IEventBus } from '../../types/interfaces';
import type { DataAccessLayer } from '../../dal/types';
import type { ILLMClientService } from '../../contracts/provider-adapter';
import type { IToolRunnerService } from '../../contracts/parity';
import type { IVoiceAgentService } from '../../contracts/rivals6';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('Voice');

interface CallDoc {
    id: string;
    to: string;
    status: 'active' | 'ended';
    transcript: string[];
    createdAt: number;
}

export interface VoiceDelegates {
    tts?: (text: string) => Promise<string>;
    stt?: (audioRef: string) => Promise<string>;
}

export class VoiceAgentService implements IVoiceAgentService {
    constructor(
        private dal: DataAccessLayer,
        private events: IEventBus,
        private llm?: ILLMClientService,
        private tools?: IToolRunnerService,
        private delegates: VoiceDelegates = {},
    ) {}

    async init(): Promise<void> {
        LOGGER.info('init', {});
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    async startCall(to: string, script?: string): Promise<string> {
        const doc: CallDoc = {
            id: genId('call'),
            to: to.slice(0, 120),
            status: 'active',
            transcript: script ? [`agent: ${script.slice(0, 500)}`] : [],
            createdAt: Date.now(),
        };
        await this.dal.kv.set(`calls/${doc.id}`, doc);
        this.events.emit(EVENTS.VOICE_STARTED, { callId: doc.id });
        return doc.id;
    }

    async turn(callId: string, userAudio: string): Promise<string> {
        const doc = await this.require(callId);
        if (doc.status !== 'active') throw new Error(`Call ${callId} is ${doc.status}`);
        // STT: real delegate or queued-text note.
        const heard = this.delegates.stt
            ? await this.delegates.stt(userAudio).catch(() => `(stt failed: ${userAudio.slice(0, 120)})`)
            : userAudio;
        doc.transcript.push(`caller: ${heard.slice(0, 500)}`);

        let reply = '';
        if (this.tools) {
            try {
                const res = await this.tools.runWithTools(
                    `Voice call context:\n${doc.transcript.slice(-6).join('\n')}\nReply in one short spoken sentence.`,
                    { agentId: `voice:${callId}`, maxRounds: 2 },
                );
                reply = res.output;
            } catch (e) {
                reply = `(tool error: ${e instanceof Error ? e.message : String(e)})`;
            }
        } else if (this.llm) {
            try {
                const res = await this.llm.chat(
                    [
                        { role: 'system', content: 'You are a phone agent. One short spoken sentence per reply.' },
                        { role: 'user', content: heard.slice(0, 1000) },
                    ],
                    { temperature: 0.5, maxTokens: 150 },
                );
                reply = res.error ? '(llm error)' : res.content;
            } catch (e) {
                reply = `(failed: ${e instanceof Error ? e.message : String(e)})`;
            }
        } else {
            reply = 'Thanks — let me look into that.';
        }
        // TTS: real delegate or queued-text note.
        const spoken = this.delegates.tts
            ? await this.delegates.tts(reply).catch(() => reply)
            : reply;
        doc.transcript.push(`agent: ${spoken.slice(0, 500)}`);
        await this.dal.kv.set(`calls/${callId}`, doc);
        return spoken;
    }

    async endCall(callId: string): Promise<string> {
        const doc = await this.require(callId);
        doc.status = 'ended';
        await this.dal.kv.set(`calls/${callId}`, doc);
        this.events.emit(EVENTS.VOICE_ENDED, { callId, turns: doc.transcript.length });
        return `Call ended (${doc.transcript.length} turns).`;
    }

    async transcript(callId: string): Promise<string[]> {
        const doc = await this.require(callId);
        return [...doc.transcript];
    }

    private async require(id: string): Promise<CallDoc> {
        const doc = await this.dal.kv.get<CallDoc>(`calls/${id}`);
        if (!doc) throw new Error(`Call not found: ${id}`);
        return doc;
    }
}
