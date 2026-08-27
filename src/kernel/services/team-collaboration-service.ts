import type {
    ITeamCollaborationService,
    Team,
    TeamMember,
    InviteLink,
    SharedSession,
    CollaborationPermission,
} from '../contracts/team-collaboration';
import { ssrSafeStorage } from '../utils/ssr-storage';
import { rootLogger } from './logger-service';
const TC_LOGGER = rootLogger.child('TeamCollaboration');

const STORAGE_KEY = 'team_collaboration';
const SYNC_CHANNEL = 'team-collab-sync';
const INVITE_PREFIX = 'tc_';

function generateCode(): string {
    return INVITE_PREFIX + Array.from({ length: 8 }, () => Math.random().toString(36)[2]).join('');
}

function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

interface PersistedData {
    teams: Team[];
    invites: InviteLink[];
    sharedSessions: SharedSession[];
}

export class TeamCollaborationService implements ITeamCollaborationService {
    private teams: Team[] = [];
    private invites: InviteLink[] = [];
    private sharedSessions: SharedSession[] = [];
    private bc: BroadcastChannel | null = null;
    private reloadListeners: Array<() => void> = [];
    private _initialized = false;

    async init(): Promise<void> {
        if (this._initialized) return;
        this._initialized = true;
        try {
            const raw = ssrSafeStorage.getItem(STORAGE_KEY);
            if (raw) {
                const data = JSON.parse(raw) as PersistedData;
                this.teams = data.teams ?? [];
                this.invites = data.invites ?? [];
                this.sharedSessions = data.sharedSessions ?? [];
            }
        } catch (err) {
            TC_LOGGER.warn('TeamCollaboration', 'init load failed', { error: err });
            this.teams = [];
            this.invites = [];
            this.sharedSessions = [];
        }
        try {
            this.bc = new BroadcastChannel(SYNC_CHANNEL);
            const handler = () => this.reload();
            this.bc.onmessage = handler;
            this.reloadListeners.push(() => {
                if (this.bc) this.bc.close();
            });
        } catch (err) {
            TC_LOGGER.warn('TeamCollaboration', 'BroadcastChannel unavailable', { error: err });
        }
    }

    start(): Promise<void> {
        return Promise.resolve();
    }

    destroy(): void {
        this.teams = [];
        this.invites = [];
        this.sharedSessions = [];
        for (const c of this.reloadListeners) c();
        this.reloadListeners = [];
        if (this.bc) {
            this.bc.close();
            this.bc = null;
        }
    }

    private reload(): void {
        try {
            const raw = ssrSafeStorage.getItem(STORAGE_KEY);
            if (raw) {
                const data = JSON.parse(raw) as PersistedData;
                this.teams = data.teams ?? [];
                this.invites = data.invites ?? [];
                this.sharedSessions = data.sharedSessions ?? [];
            }
        } catch (err) {
            TC_LOGGER.warn('TeamCollaboration', 'reload failed', { error: err });
        }
    }

    private persist(): void {
        try {
            const data = JSON.stringify({
                teams: this.teams,
                invites: this.invites,
                sharedSessions: this.sharedSessions,
            } as PersistedData);
            ssrSafeStorage.setItem(STORAGE_KEY, data);
            if (this.bc) this.bc.postMessage('reload');
        } catch (err) {
            TC_LOGGER.warn('TeamCollaboration', 'persist failed', { error: err });
        }
    }

    private isAdmin(teamId: string, callerId: string): boolean {
        const team = this.getTeam(teamId);
        if (!team) return false;
        return team.members.some((m) => m.id === callerId && m.role === 'admin');
    }

    private isMember(teamId: string, callerId: string): boolean {
        const team = this.getTeam(teamId);
        if (!team) return false;
        return team.members.some((m) => m.id === callerId);
    }

    getTeams(): Team[] {
        return this.teams.map((t) => structuredClone(t));
    }

    getTeam(id: string): Team | undefined {
        const found = this.teams.find((t) => t.id === id);
        return found ? structuredClone(found) : undefined;
    }

    createTeam(name: string, description: string, createdBy: string): Team {
        const team: Team = {
            id: generateId(),
            name,
            description,
            members: [{ id: createdBy, name: createdBy, role: 'admin', joinedAt: Date.now() }],
            createdAt: Date.now(),
            createdBy,
        };
        this.teams.push(team);
        this.persist();
        return team;
    }

    deleteTeam(id: string, callerId?: string): void {
        if (callerId && !this.isAdmin(id, callerId)) return;
        this.teams = this.teams.filter((t) => t.id !== id);
        this.invites = this.invites.filter((i) => i.teamId !== id);
        this.sharedSessions = this.sharedSessions.filter((s) => s.teamId !== id);
        this.persist();
    }

    addMember(teamId: string, member: Omit<TeamMember, 'joinedAt'>, callerId?: string): boolean {
        if (callerId && !this.isAdmin(teamId, callerId)) return false;
        const team = this.getTeam(teamId);
        if (!team) return false;
        if (team.members.some((m) => m.id === member.id)) return false;
        team.members.push({ ...member, joinedAt: Date.now() });
        this.persist();
        return true;
    }

    removeMember(teamId: string, memberId: string, callerId?: string): void {
        if (callerId && !this.isAdmin(teamId, callerId)) return;
        const team = this.getTeam(teamId);
        if (!team) return;
        team.members = team.members.filter((m) => m.id !== memberId);
        this.persist();
    }

    updateMemberRole(
        teamId: string,
        memberId: string,
        role: CollaborationPermission,
        callerId?: string,
    ): void {
        if (callerId && !this.isAdmin(teamId, callerId)) return;
        const team = this.getTeam(teamId);
        if (!team) return;
        const member = team.members.find((m) => m.id === memberId);
        if (member) member.role = role;
        this.persist();
    }

    getInvites(teamId: string): InviteLink[] {
        return this.invites.filter((i) => i.teamId === teamId);
    }

    createInvite(
        teamId: string,
        permission: CollaborationPermission,
        maxUses: number,
        createdBy: string,
    ): InviteLink {
        const invite: InviteLink = {
            code: generateCode(),
            teamId,
            maxUses,
            useCount: 0,
            expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
            permission,
            createdBy,
            createdAt: Date.now(),
        };
        this.invites.push(invite);
        this.persist();
        return invite;
    }

    useInvite(code: string, userName: string): Team | null {
        const invite = this.invites.find((i) => i.code === code);
        if (!invite) return null;
        if (invite.useCount >= invite.maxUses) return null;
        if (Date.now() > invite.expiresAt) return null;
        const team = this.getTeam(invite.teamId);
        if (!team) return null;
        if (team.members.some((m) => m.id === userName)) return team;
        this.addMember(invite.teamId, { id: userName, name: userName, role: invite.permission });
        invite.useCount++;
        this.persist();
        return team;
    }

    revokeInvite(teamId: string, code: string, callerId?: string): void {
        if (callerId && !this.isAdmin(teamId, callerId)) return;
        this.invites = this.invites.filter((i) => !(i.teamId === teamId && i.code === code));
        this.persist();
    }

    getSharedSessions(teamId: string): SharedSession[] {
        return this.sharedSessions.filter((s) => s.teamId === teamId);
    }

    shareSession(
        teamId: string,
        type: SharedSession['type'],
        title: string,
        resourceId: string,
        sharedBy: string,
        permission: CollaborationPermission,
        callerId?: string,
    ): SharedSession {
        if (callerId && !this.isMember(teamId, callerId)) throw new Error('Not a team member');
        const session: SharedSession = {
            id: generateId(),
            teamId,
            type,
            title,
            sharedBy,
            sharedAt: Date.now(),
            resourceId,
            permission,
        };
        this.sharedSessions.push(session);
        this.persist();
        return session;
    }

    unshareSession(teamId: string, sessionId: string, callerId?: string): void {
        if (callerId && !this.isMember(teamId, callerId)) return;
        this.sharedSessions = this.sharedSessions.filter(
            (s) => !(s.teamId === teamId && s.id === sessionId),
        );
        this.persist();
    }
}
