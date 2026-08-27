export type RoleCategory = 'creative' | 'technical' | 'analytical' | 'management' | 'custom';

export type RolePermission =
    | 'chat:send'
    | 'chat:read'
    | 'memory:write'
    | 'memory:read'
    | 'memory:delete'
    | 'tools:execute'
    | 'tools:manage'
    | 'agents:spawn'
    | 'agents:manage'
    | 'roles:manage'
    | 'connectors:use'
    | 'connectors:manage'
    | 'skills:use'
    | 'skills:manage'
    | 'settings:read'
    | 'settings:write'
    | 'system:admin'
    | 'system:monitor'
    | 'debate:participate'
    | 'orchestration:design';

export interface RoleMetadata {
    category: RoleCategory;
    created: number;
    updated: number;
    version?: string;
    author?: string;
    tags?: string[];
    avatar?: string;
    avatarShape?: string;
    avatarColor?: string;
}

export interface Role {
    id: string;
    name: string;
    description?: string;
    systemPrompt?: string;
    baseTemperature?: number;
    icon?: string;
    capabilities: string[];
    permissions: string[];
    deniedPermissions?: string[];
    metadata: RoleMetadata;
    isBuiltin?: boolean;
    priority?: number;
    parentRoleId?: string;
}

export type RoleCreateInput = Omit<Role, 'id' | 'metadata'> & {
    metadata?: Partial<RoleMetadata>;
};

export type RoleUpdateInput = Partial<Omit<Role, 'id'>>;

export const DEFAULT_ROLE_PERMISSIONS: Record<RoleCategory, RolePermission[]> = {
    creative: ['chat:send', 'memory:read', 'memory:write', 'tools:execute'],
    technical: [
        'chat:send',
        'memory:read',
        'memory:write',
        'tools:execute',
        'tools:manage',
        'skills:use',
    ],
    analytical: ['chat:send', 'memory:read', 'memory:write', 'tools:execute', 'system:monitor'],
    management: [
        'chat:send',
        'memory:read',
        'agents:spawn',
        'agents:manage',
        'roles:manage',
        'system:monitor',
        'settings:read',
    ],
    custom: ['chat:send', 'memory:read'],
};

export interface RoleWithStats extends Role {
    usageStats: {
        totalCalls: number;
        totalTokens: number;
        avgLatency: number;
        lastUsed: number | null;
        assignedNodes: string[];
    };
}
