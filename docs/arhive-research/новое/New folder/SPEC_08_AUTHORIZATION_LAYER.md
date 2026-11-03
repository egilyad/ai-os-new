# Спецификация: Единый слой авторизации (authz) для сервисов

> Статус: готово к реализации. Приоритет: P0 (связано с безопасностью). Связано: `ROADMAP_07`, `PREP_01 (R-A4)`.

---

## 1. Проблема (факты из кода)

- Три независимых механизма с разной семантикой:
  1. `AgentPermissionService` (`permissions/permission-service.ts`) — per-agent, **last-match wins**, база `BASE_PERMISSION_RULES=[{action:'*',resource:'*',effect:'allow'}]` → **fail-open** по умолчанию;
  2. `PolicyService` (`policy-service.ts`) — политики latency/privacy/cost/rate/content; хранится в keyValue plaintext; мутации неаутентифицированы;
  3. `GovernanceService` (`trust/governance-service.ts`) — `evaluate` возвращает `{decision:'allow'}` при отсутствии совпадения → **fail-open**; deny выигрывает при равном приоритете.
- Нет общего интерфейса решения (decision point).

## 2. Цель

- Единый `IAuthorizationService` (decision point): принимает `(actor, action, resource, context)` → `decision: allow | deny | ask`.
- Семантика: по умолчанию **deny**; любое явное правило может разрешить.
- Обратная совместимость: существующие подсистемы могут делегировать в него.

## 3. Контракт (в `src/kernel/contracts/authorization.ts`)

```ts
type AuthzDecision = {
  effect: 'allow' | 'deny' | 'ask';
  reason?: string;
  matchedRule?: string;
};
interface AuthzRequest {
  actor: string;
  actorType: 'agent' | 'user' | 'plugin' | 'service';
  action: string;
  resource: string;
  resourceType?: string;
  context?: Record<string, unknown>;
}
interface AuthorizationRule {
  id: string;
  subject?: string;
  action?: string;
  resource?: string;
  effect: 'allow' | 'deny' | 'ask';
  priority?: number;
  enabled?: boolean;
}
interface IAuthorizationService {
  evaluate(req: AuthzRequest): Promise<AuthzDecision>;
  applyDefaultRules(rules: AuthorizationRule[]): Promise<void>;
  setRules(rules: AuthorizationRule[]): Promise<void>;
  rules(): AuthorizationRule[];
  onDecision(cb: (req, dec) => void): () => void;
}
```

## 4. Семантика решения

- Порядок: выбрать все правила, у которых совпали `subject/action/resource` (с `*`-wildcards); отсортировать по `priority` (выше → раньше); **первое совпадение выигрывает** (как last-match, но явно конфигурируемо). Если совпадений нет → `deny`.
- `ask` — используется для human-in-the-loop (ToolApprovalLayer).

## 5. Реализация

- Сервис: `src/kernel/services/permissions/authorization-service.ts` (DI, Tier2).
- Реализация `evaluatePermission` (из `contracts/agent-permissions.ts`) переводится на `IAuthorizationService`.
- `GovernanceService.evaluate` — заменить fail-open на делегирование в `IAuthorizationService` (default deny).
- `AgentPermissionService` — выставить default-deny; `BASE_PERMISSION_RULES` больше не «всё allow».
- Политики `PolicyService` — сохранить как надстройку «правил» над authz (политики → правила).

## 6. Интеграция с точками вызова

- Инструменты: `tool-pipeline` permission-gate → `IAuthorizationService`.
- Агенты: `AgentPermissionService.evaluate` → authz.
- МCP: `MCPService` (default-deny уже есть) — унифицировать.
- Плагины (SPEC_06): permissions плагина → authz.

## 7. События

- `authz:decision` (allow/deny/ask), `authz:rule:changed` — для аудита и наблюдаемости.

## 8. Безопасность: чек-лист

- Ни один путь не должен «падать в allow» при отсутствии совпадения (default deny).
- Дефолтные правила должны быть «безопасными» (минимальные привилегии).
- Мутации правил — только через авторизованный вызов (см. `PolicyService`).

## 9. Тесты

- Эvaluate: wildcards, priority, default deny, `ask`.
- Интеграция: инструменты/агенты/MCP используют единый слой; отказ по умолчанию.
- Регрессии: «золотые» разрешённые сценарии не сломаны.

## 10. Definition of Done

- `IAuthorizationService` в DI; default deny; все точки вызова переведены; события добавлены; тесты зелёные.
