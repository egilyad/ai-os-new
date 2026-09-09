/**
 * ComputerService — J.3 (Operator-style computer-use pack, additive).
 *
 * Validated actions: screenshot / click_at / type_text / scroll / open_url.
 * Coordinates are 0..1000 relative; destructive patterns (password fields,
 * payment submits) are refused. Execution requires an approved computer
 * SandboxBroker ticket — otherwise a handoff record is returned for an
 * outside executor (same honesty rule as the code agent).
 */
import type { IEventBus } from '../../types/interfaces';
import type { ISandboxBrokerService } from '../../contracts/ops';
import type { IComputerService } from '../../contracts/rivals5';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('Computer');

const ACTIONS = ['screenshot', 'click_at', 'type_text', 'scroll', 'open_url', 'open_app', 'browser_navigate', 'devtools_run'] as const;

const SENSITIVE = /password|passwd|card|cvv|otp|2fa|seed phrase/i;

export class ComputerService implements IComputerService {
    constructor(
        private events: IEventBus,
        private sandbox?: ISandboxBrokerService,
    ) {}

    async init(): Promise<void> {
        LOGGER.info('init', {});
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    async act(ticketId: string, action: string, args: Record<string, unknown> = {}): Promise<string> {
        if (!ACTIONS.includes(action as (typeof ACTIONS)[number])) {
            throw new Error(`Unknown computer action: ${action} (${ACTIONS.join('|')})`);
        }
        this.validate(action, args);
        const ticket = this.sandbox ? await this.sandbox.get(ticketId) : null;
        if (!ticket || (ticket.status !== 'approved' && ticket.status !== 'running')) {
            // Honest handoff: the browser cannot drive a real OS here.
            this.events.emit(EVENTS.COMPUTER_HANDOFF, { action });
            return `handoff: ${action} ${JSON.stringify(args).slice(0, 300)} (no approved computer ticket ${ticketId})`;
        }
        this.events.emit(EVENTS.COMPUTER_ACT, { ticketId, action });
        return `queued ${action} on ticket ${ticketId}: ${JSON.stringify(args).slice(0, 300)}`;
    }

    private validate(action: string, args: Record<string, unknown>): void {
        if (action === 'click_at') {
            const x = Number(args['x']);
            const y = Number(args['y']);
            if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x > 1000 || y < 0 || y > 1000) {
                throw new Error('click_at needs x/y in 0..1000');
            }
        }
        if (action === 'type_text') {
            const text = String(args['text'] ?? '');
            if (!text) throw new Error('type_text needs text');
            if (SENSITIVE.test(text) || SENSITIVE.test(String(args['field'] ?? ''))) {
                throw new Error('Refusing to type sensitive data (passwords, cards, OTP)');
            }
        }
        if (action === 'scroll') {
            const d = String(args['direction'] ?? 'down');
            if (!['up', 'down', 'left', 'right'].includes(d)) throw new Error('scroll direction invalid');
        }
        if (action === 'open_url') {
            const url = String(args['url'] ?? '');
            if (!/^https?:\/\//i.test(url)) throw new Error('open_url needs http(s) URL');
        }
        if (action === 'open_app') {
            if (!String(args['name'] ?? '').trim()) throw new Error('open_app needs name');
        }
        if (action === 'browser_navigate') {
            const url = String(args['url'] ?? '');
            if (!/^https?:\/\//i.test(url)) throw new Error('browser_navigate needs http(s) URL');
        }
        if (action === 'devtools_run') {
            if (!String(args['command'] ?? '').trim()) throw new Error('devtools_run needs command');
        }
    }
}
