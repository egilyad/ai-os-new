import type {
    AuthorizationRule,
    AuthzDecision,
    AuthzRequest,
    IAuthorizationService,
} from '../../contracts/authorization';
import { matchPattern } from '../../contracts/authorization';

/**
 * AuthorizationService — единый decision point прав (SPEC_08).
 *
 * Семантика: default deny. Совпавшие правила (subject/action/resource с
 * wildcard-поддержкой) сортируются по priority (выше → раньше); первое
 * совпадение выигрывает. Если совпадений нет → deny.
 */
export class AuthorizationService implements IAuthorizationService {
    private _rules: AuthorizationRule[] = [];
    private _listeners: Array<(req: AuthzRequest, dec: AuthzDecision) => void> = [];

    async assertAllowed(req: AuthzRequest): Promise<void> {
        const dec = await this.evaluate(req);
        if (dec.effect === 'deny') {
            throw new Error(dec.reason ?? 'Access denied');
        }
    }

    async evaluate(req: AuthzRequest): Promise<AuthzDecision> {
        const matching = this._rules
            .filter(
                (r) =>
                    (r.enabled ?? true) &&
                    matchPattern(r.subject, req.actor) &&
                    matchPattern(r.action, req.action) &&
                    matchPattern(r.resource, req.resource),
            )
            .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

        const decision: AuthzDecision =
            matching.length > 0
                ? (() => {
                      const first = matching[0]!;
                      return {
                          effect: first.effect,
                          matchedRule: first.id,
                          reason: `matched rule ${first.id}`,
                      };
                  })()
                : { effect: 'deny', reason: 'no matching rule — default deny' };

        for (const cb of this._listeners) {
            try {
                cb(req, decision);
            } catch {
                // наблюдатели не должны ломать решение
            }
        }
        return decision;
    }

    async applyDefaultRules(rules: AuthorizationRule[]): Promise<void> {
        // Дефолтные правила добавляются с низким приоритетом и не затирают
        // пользовательские.
        const existing = new Set(this._rules.map((r) => r.id));
        const toAdd = rules.filter((r) => !existing.has(r.id));
        this._rules = [...this._rules, ...toAdd];
    }

    async setRules(rules: AuthorizationRule[]): Promise<void> {
        this._rules = [...rules];
    }

    rules(): AuthorizationRule[] {
        return [...this._rules];
    }

    onDecision(cb: (req: AuthzRequest, dec: AuthzDecision) => void): () => void {
        this._listeners.push(cb);
        return () => {
            this._listeners = this._listeners.filter((l) => l !== cb);
        };
    }
}
