/**
 * Canonical Agent Identity resolver for the UI.
 *
 * There is exactly ONE source of agent identity in this system: the topology
 * node, surfaced through `IAgentResolver` (implemented by `AgentService`).
 * This module turns a resolved agent into a rich, UI-ready `AgentIdentityView`
 * without introducing a second registry: it reuses the resolver, the existing
 * deterministic `AgentAvatarService` (emoji + color, with an optional URL
 * override), the `lens-engine` for lens names, and the provider display-name
 * map. Every consumer (Director, Debate, Chat, Workflows) should resolve the
 * same agent through this seam so identity stays consistent.
 */

import type { IAgentResolver, ResolvedAgent } from '../contracts/conversation/agent-resolver';
import type { ILensEngineService } from '../contracts/lens-engine';
import { PROVIDER_DISPLAY_NAMES } from '../utils/provider-default-models';
import { AgentAvatarService } from './agent-avatar-service';

export interface AgentAvatarView {
    emoji: string;
    color: string;
    /** Optional persistent image; when present the UI renders an <img>. */
    url?: string;
}

export interface AgentIdentityView {
    id: string;
    displayName: string;
    firstName?: string;
    lastName?: string;
    /** Agent's profession / base role (identity), not the per-conversation role. */
    baseRole: string;
    specializations: string[];
    lensIds: string[];
    lensNames: string[];
    model?: string;
    /** Provider slug (e.g. `groq`). */
    provider?: string;
    /** Human provider name (e.g. `Groq`). */
    providerName?: string;
    avatar: AgentAvatarView;
    systemPrompt?: string;
}

export interface ResolveAgentIdentityDeps {
    resolver?: IAgentResolver;
    lensEngine?: Pick<ILensEngineService, 'getLens'>;
    /** Deterministic avatar generator; falls back to a neutral glyph. */
    avatarGenerate?: (id: string) => { emoji: string; color: string };
}

/**
 * Process-wide default resolver. UI/bootstrap wires the real `AgentService`
 * here once (DI-compliant: this module never imports the locator itself), so
 * every `resolveAgentIdentity(id)` call without explicit deps still resolves
 * through the single canonical source of agent identity.
 */
let _defaultResolver: IAgentResolver | undefined;
export function setAgentIdentityResolver(resolver: IAgentResolver | undefined): void {
    _defaultResolver = resolver;
}

const NEUTRAL_AVATAR = { emoji: '🤖', color: '#64748b' };

/** Safe, human-readable label used when an agent cannot be resolved. Never an internal id. */
export const UNKNOWN_AGENT_LABEL = 'Unknown Agent';

/**
 * Resolve a participant/agent id into a canonical identity view.
 *
 * Never throws: if the resolver or lens engine are unavailable the call
 * degrades gracefully (displayName falls back to the id, lens names fall back
 * to their ids, avatar falls back to the deterministic glyph).
 */
export function resolveAgentIdentity(
    id: string,
    deps: ResolveAgentIdentityDeps = {},
): AgentIdentityView {
    const resolver = deps.resolver ?? _defaultResolver;
    const lens = deps.lensEngine;
    const avatarGenerate =
        deps.avatarGenerate ??
        ((id: string) => {
            try {
                const a = new AgentAvatarService().generate(id);
                return { emoji: a.emoji, color: a.color };
            } catch {
                return NEUTRAL_AVATAR;
            }
        });

    let resolved: ResolvedAgent | null = null;
    if (resolver) {
        try {
            resolved = resolver.resolveAgent(id);
        } catch {
            resolved = null;
        }
    }

    const fallback = avatarGenerate ? avatarGenerate(id) : NEUTRAL_AVATAR;

    if (!resolved) {
        return {
            id,
            displayName: UNKNOWN_AGENT_LABEL,
            baseRole: '',
            specializations: [],
            lensIds: [],
            lensNames: [],
            avatar: { emoji: fallback.emoji, color: fallback.color },
        };
    }

    const cfgAvatar = resolved.avatar;
    let avatar: AgentAvatarView;
    if (cfgAvatar?.url) {
        avatar = {
            emoji: cfgAvatar.emoji ?? NEUTRAL_AVATAR.emoji,
            color: cfgAvatar.color ?? NEUTRAL_AVATAR.color,
            url: cfgAvatar.url,
        };
    } else if (cfgAvatar?.emoji) {
        avatar = { emoji: cfgAvatar.emoji, color: cfgAvatar.color ?? fallback.color };
    } else {
        avatar = { emoji: fallback.emoji, color: fallback.color };
    }

    const lensIds = resolved.lensIds ?? [];
    const lensNames = lensIds.map((lid) => {
        try {
            const l = lens?.getLens(lid);
            return l?.name ?? lid;
        } catch {
            return lid;
        }
    });

    const provider = resolved.provider;
    const providerName = provider ? (PROVIDER_DISPLAY_NAMES[provider] ?? provider) : undefined;

    return {
        id: resolved.id,
        displayName: resolved.displayName ?? resolved.name,
        firstName: resolved.firstName,
        lastName: resolved.lastName,
        baseRole: resolved.baseRole ?? resolved.role,
        specializations: resolved.specializations ?? [],
        lensIds,
        lensNames,
        model: resolved.model,
        provider,
        providerName,
        avatar,
        systemPrompt: resolved.systemPrompt,
    };
}
