import type { ILifecycle } from './lifecycle';

export type CollaborationPermission = 'view' | 'comment' | 'edit' | 'admin';

export interface TeamMember {
    id: string;
    name: string;
    role: CollaborationPermission;
    joinedAt: number;
    avatar?: string;
}

export interface Team {
    id: string;
    name: string;
    description: string;
    members: TeamMember[];
    createdAt: number;
    createdBy: string;
}

export interface InviteLink {
    code: string;
    teamId: string;
    maxUses: number;
    useCount: number;
    expiresAt: number;
    permission: CollaborationPermission;
    createdBy: string;
    createdAt: number;
}

export interface SharedSession {
    id: string;
    teamId: string;
    type: 'debate' | 'topology' | 'prompt' | 'workflow';
    title: string;
    sharedBy: string;
    sharedAt: number;
    resourceId: string;
    permission: CollaborationPermission;
}

export interface ITeamCollaborationService extends ILifecycle {
    getTeams(): Team[];
    getTeam(id: string): Team | undefined;
    createTeam(name: string, description: string, createdBy: string): Team;
    deleteTeam(id: string): void;
    addMember(teamId: string, member: Omit<TeamMember, 'joinedAt'>): boolean;
    removeMember(teamId: string, memberId: string): void;
    updateMemberRole(teamId: string, memberId: string, role: CollaborationPermission): void;

    getInvites(teamId: string): InviteLink[];
    createInvite(
        teamId: string,
        permission: CollaborationPermission,
        maxUses: number,
        createdBy: string,
    ): InviteLink;
    useInvite(code: string, userName: string): Team | null;
    revokeInvite(teamId: string, code: string): void;

    getSharedSessions(teamId: string): SharedSession[];
    shareSession(
        teamId: string,
        type: SharedSession['type'],
        title: string,
        resourceId: string,
        sharedBy: string,
        permission: CollaborationPermission,
    ): SharedSession;
    unshareSession(teamId: string, sessionId: string): void;
}
