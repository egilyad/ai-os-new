/**
 * Единый слой авторизации (SPEC_08 / ROADMAP_07).
 *
 * Проблема, которую закрывает: в проекте три независимых механизма прав с
 * разной семантикой — AgentPermissionService (last-match, BASE=allow-all),
 * GovernanceService (evaluate → allow при отсутствии совпадения),
 * PolicyService (политики). Всё это — fail-open.
 *
 * Цель: единый decision point с семантикой **default deny**:
 *  - совпавшие правила сортируются по priority (выше → раньше);
 *  - первое совпадение выигрывает;
 *  - если совпадений нет → `deny`.
 */
export type AuthzEffect = 'allow' | 'deny' | 'ask';

export interface AuthzDecision {
    effect: AuthzEffect;
    reason?: string;
    matchedRule?: string;
}

export interface AuthzRequest {
    actor: string;
    actorType: 'agent' | 'user' | 'plugin' | 'service';
    action: string;
    resource: string;
    resourceType?: string;
    context?: Record<string, unknown>;
}

export interface AuthorizationRule {
    id: string;
    /** Wildcard-паттерны: `*`, `prefix:*`, точное равенство. */
    subject?: string;
    action?: string;
    resource?: string;
    effect: AuthzEffect;
    priority?: number;
    enabled?: boolean;
}

export interface IAuthorizationService {
    evaluate(req: AuthzRequest): Promise<AuthzDecision>;
    /** Бросает Error, если решение — deny (удобно для точек вызова). */
    assertAllowed(req: AuthzRequest): Promise<void>;
    applyDefaultRules(rules: AuthorizationRule[]): Promise<void>;
    setRules(rules: AuthorizationRule[]): Promise<void>;
    rules(): AuthorizationRule[];
    onDecision(cb: (req: AuthzRequest, dec: AuthzDecision) => void): () => void;
}

export function matchPattern(pattern: string | undefined, value: string): boolean {
    if (!pattern) return true; // пустой паттерн = любой
    if (pattern === '*') return true;
    if (pattern.endsWith(':*')) {
        return value.startsWith(pattern.slice(0, -1));
    }
    return pattern === value;
}
