/**
 * MobileAccessService — Wave 5.3 (Mistral Vibe-inspired remote + quick HITL).
 *
 * Pairing-code sessions for phones, notification inbox, and one-tap HITL:
 * approve/reject paused graph runs, council votes. Delegates to the real
 * Graph/Council services (constructor-injected, no direct imports of UI).
 */
import type { IEventBus } from '../../types/interfaces';
import type { OpsRepository } from '../../dal/ops-repository';
import type { IAuditService, IMobileAccessService } from '../../contracts/ops';
import type { IGraphService } from '../../contracts/graph';
import type { ICouncilService } from '../../contracts/council';
import type { MobileSession, PushNotification } from '../../types/ops-types';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('MobileAccess');

function now(): number {
    return Date.now();
}

function pairingCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export interface MobileAccessDeps {
    repo: OpsRepository;
    events: IEventBus;
    audit: IAuditService;
    graphs: IGraphService;
    councils: ICouncilService;
}

export class MobileAccessService implements IMobileAccessService {
    private repo: OpsRepository;
    private events: IEventBus;
    private audit: IAuditService;
    private graphs: IGraphService;
    private councils: ICouncilService;

    constructor(deps: MobileAccessDeps) {
        this.repo = deps.repo;
        this.events = deps.events;
        this.audit = deps.audit;
        this.graphs = deps.graphs;
        this.councils = deps.councils;
    }

    async init(): Promise<void> {
        LOGGER.info('init', {});
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    async createPairing(deviceName: string): Promise<MobileSession> {
        const t = now();
        const session: MobileSession = {
            id: genId('mob'),
            deviceName: deviceName.slice(0, 120),
            pairingCode: pairingCode(),
            status: 'pending',
            createdAt: t,
            updatedAt: t,
        };
        await this.repo.putSession(session);
        return session;
    }

    async pair(id: string, code: string): Promise<MobileSession> {
        const s = await this.require(id);
        if (s.status !== 'pending') throw new Error(`Session ${id} is ${s.status}`);
        if (s.pairingCode !== code.trim()) {
            await this.audit.append('mobile', 'pairing.failed', id, '');
            throw new Error('Invalid pairing code');
        }
        s.status = 'paired';
        s.updatedAt = now();
        await this.repo.putSession(s);
        await this.audit.append('mobile', 'device.paired', id, s.deviceName);
        this.events.emit(EVENTS.OPS_MOBILE, { sessionId: id, status: 'paired' });
        return s;
    }

    async revoke(id: string): Promise<void> {
        const s = await this.require(id);
        s.status = 'revoked';
        s.updatedAt = now();
        await this.repo.putSession(s);
        await this.audit.append('mobile', 'device.revoked', id, s.deviceName);
    }

    async listSessions(): Promise<MobileSession[]> {
        return this.repo.listSessions();
    }

    async notify(input: { title: string; body: string; actionRef?: string }): Promise<PushNotification> {
        const n: PushNotification = {
            id: genId('notif'),
            title: input.title.slice(0, 160),
            body: input.body.slice(0, 1000),
            actionRef: input.actionRef,
            read: false,
            createdAt: now(),
        };
        await this.repo.putNotification(n);
        this.events.emit(EVENTS.OPS_NOTIFY, { notificationId: n.id, actionRef: n.actionRef ?? '' });
        return n;
    }

    async listNotifications(unreadOnly = false): Promise<PushNotification[]> {
        const all = await this.repo.listNotifications();
        if (!unreadOnly) return all;
        return all.filter((n) => !n.read);
    }

    async markRead(id: string): Promise<void> {
        const n = await this.repo.getNotification(id);
        if (!n) throw new Error(`Notification not found: ${id}`);
        n.read = true;
        await this.repo.putNotification(n);
    }

    async quickApprove(runId: string): Promise<string> {
        const run = await this.graphs.approve(runId);
        await this.audit.append('mobile', 'hitl.approved', runId, `status=${run.status}`);
        return `Run ${runId} approved → ${run.status}`;
    }

    async quickReject(runId: string, reason = 'Rejected from mobile'): Promise<string> {
        const run = await this.graphs.reject(runId, reason);
        await this.audit.append('mobile', 'hitl.rejected', runId, reason.slice(0, 280));
        return `Run ${runId} rejected → ${run.status}`;
    }

    async quickVote(sessionId: string, voterId: string, pickId: string): Promise<string> {
        const vote = await this.councils.castAudienceVote(sessionId, voterId, pickId);
        await this.audit.append('mobile', 'council.voted', sessionId, pickId.slice(0, 200));
        return `Vote recorded: ${vote.pickId}`;
    }

    private async require(id: string): Promise<MobileSession> {
        const s = await this.repo.getSession(id);
        if (!s) throw new Error(`Mobile session not found: ${id}`);
        return s;
    }
}
