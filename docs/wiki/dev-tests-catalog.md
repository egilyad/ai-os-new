<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Каталог тестов

> Раздел: **Разработчикам** · Статус: verified · Теги: dev, тесты, каталог, CI

Источники: `scripts/gen-wiki-tests.mjs`, `package.json`

## Тесты

Тестовая поверхность: 661 unit/компонентных тестов в src, 10 server-тестов (node --test), 3 тестов скриптов, 20 e2e (Playwright) — всего 694. CI гоняет стабильный набор ([Разработчикам: ворота качества и CI](./dev-ci.md)), а не все сразу: полный vitest на общих раннерах не тянет.

```mermaid
flowchart LR
    U["src/**/*.test.ts(x) — Vitest"] --> G["test:stable — гейт CI"]
    S["server/tests — node --test"] --> C["CI"]
    E["e2e/*.spec.ts — Playwright"] --> C
    G --> C
```

### Unit/компонентные тесты по областям (src)

| Область | Тестов |
|---|---|
| src/kernel | 445 |
| src/components | 168 |
| src/llm | 27 |
| src/stores | 14 |
| src/hooks | 3 |
| src (корень) | 1 |
| src/i18n | 1 |
| src/shared | 1 |
| src/tests | 1 |

### Стабильный гейт CI — test:stable (91 путей)

| Путь из package.json |
|---|
| src/stores |
| src/hooks |
| src/kernel/events |
| src/kernel/workers |
| src/kernel/container.test.ts |
| src/kernel/security.test.ts |
| src/kernel/services/rivals/guardrail-service.test.ts |
| src/llm/http/llm-http-client.test.ts |
| src/llm/decorators/circuit-breaker.test.ts |
| src/llm/decorators/retry-decorator.test.ts |
| src/llm/decorators/rate-limit-decorator.test.ts |
| src/llm/decorators/fallback-decorator.test.ts |
| src/llm/decorators/priority-queue.test.ts |
| src/llm/decorators/semantic-router.test.ts |
| src/llm/decorators/canary-router.test.ts |
| src/llm/decorators/compress-route.test.ts |
| src/llm/decorators/logging-decorator.test.ts |
| src/llm/decorators/cost-manager.test.ts |
| src/llm/registry/adapter-factory.test.ts |
| src/kernel/services/provider-adapter-registry.test.ts |
| src/kernel/services/parity/tool-runner-service.test.ts |
| src/kernel/services/key-management/key-vault.test.ts |
| src/kernel/utils/network.test.ts |
| src/kernel/services/n8n-service.test.ts |
| src/kernel/services/telegram-service.test.ts |
| src/components/Common/gatewayApi.test.ts |
| src/kernel/services/tool-executor.test.ts |
| src/kernel/services/cross-tab-lock-service.test.ts |
| src/kernel/services/storage/dexie-storage.session.test.ts |
| src/components/ChatPanel/code-escape.test.ts |
| src/kernel/services/local-secret-store.test.ts |
| src/kernel/services/external-secrets-service.test.ts |
| src/kernel/services/debate-runtime/debate-preflight.test.ts |
| src/llm/http/sse-parser.test.ts |
| src/components/WikiPanel/wiki-integrity.test.ts |
| src/components/WikiPanel/wiki-components.test.ts |
| src/kernel/services/memory-engine.test.ts |
| src/kernel/workers/memory-vector-space.test.ts |
| src/kernel/services/memory/provider-embedding-service.test.ts |
| src/llm/embeddings |
| src/components/MemoryPanel |
| src/components/ProviderManager/ModelCatalogView.test.tsx |
| src/components/ProviderManager/ProviderManager.test.tsx |
| src/components/ChatPanel/ChatPanel.test.tsx |
| src/kernel/utils/pii-redact.test.ts |
| src/kernel/utils/percentile.test.ts |
| src/kernel/services/prompt-security-eval.test.ts |
| src/components/RivalsCatalogPanel.test.tsx |
| src/components/wrapper-panels-smoke.test.tsx |
| src/kernel/utils/regex-safe.test.ts |
| src/kernel/utils/session-write-guard.test.ts |
| src/kernel/utils/feature-flags.test.ts |
| src/kernel/services/browser/browser-use-service.test.ts |
| src/kernel/services/key-management/key-state-store.test.ts |
| src/kernel/services/causal-timeline-service.test.ts |
| src/kernel/services/monitoring-service.test.ts |
| src/kernel/services/timeline-service.test.ts |
| src/kernel/services/rotation-service.test.ts |
| src/kernel/services/group-manager.test.ts |
| src/kernel/services/key-intelligence-pipeline.test.ts |
| src/kernel/services/session-affinity-store.test.ts |
| src/kernel/services/admin-service.test.ts |
| src/kernel/services/trace-service.test.ts |
| src/kernel/service-helper.test.ts |
| src/kernel/services/ops/audit-service.test.ts |
| src/kernel/services/trust/governance-service.test.ts |
| src/kernel/services/ops/fleet-monitor-service.test.ts |
| src/kernel/services/ops/tool-governance-service.test.ts |
| src/kernel/services/llm-bridge/llm-task-executor.test.ts |
| src/kernel/services/sandbox-service.test.ts |
| src/kernel/kernel.test.ts |
| src/kernel/runtime.test.ts |
| src/kernel/services/key-management/key-fingerprints.test.ts |
| src/kernel/bootstrap.test.ts |
| src/kernel/utils/constant-time.test.ts |
| src/kernel/utils/persist-then-emit.test.ts |
| src/kernel/services/key-management/key-quotas.test.ts |
| src/kernel/services/key-management/key-models.test.ts |
| src/kernel/services/key-management/key-alerts.test.ts |
| src/kernel/services/key-management/key-status.test.ts |
| src/kernel/services/key-management/key-pool-selector.test.ts |
| src/kernel/services/key-management/key-service.test.ts |
| src/kernel/utils/provider-fleet-health.test.ts |
| src/kernel/services/debate-runtime/debate-argument-graph-service.test.ts |
| src/kernel/utils/hash.test.ts |
| src/kernel/utils/embedding.test.ts |
| src/kernel/utils/topic-suggestions.test.ts |
| src/kernel/services/ops/builder-bridge.test.ts |
| src/kernel/services/ops/skill-market-service.test.ts |
| src/kernel/services/ops/hierarchy-service.test.ts |
| src/kernel/services/ops/sandbox-broker-service.test.ts |

### Server-тесты (node --test)

| Файл |
|---|
| server/tests/autocycle.test.mjs |
| server/tests/browser-use-adapter.test.mjs |
| server/tests/company-store-sync-secret.test.mjs |
| server/tests/computer-act-adapter.test.mjs |
| server/tests/decide-approval.test.mjs |
| server/tests/run-integrity.test.mjs |
| server/tests/wakeup-issue.test.mjs |
| server/tests/write-queue.test.mjs |
| server/tests/ws-auth-company.test.mjs |
| server/tests/ws-auth.test.mjs |

### Тесты скриптов

| Файл |
|---|
| scripts/tests/net-guard.test.mjs |
| scripts/tests/sidecar-ctl.test.mjs |
| scripts/tests/smoke-stack.test.mjs |

### E2E (Playwright)

| Спека |
|---|
| e2e/assistant-panel.spec.ts |
| e2e/basic-flow.spec.ts |
| e2e/data-chat.spec.ts |
| e2e/data-debate.spec.ts |
| e2e/data-dialogs.spec.ts |
| e2e/data-fleet.spec.ts |
| e2e/data-forum.spec.ts |
| e2e/data-health.spec.ts |
| e2e/data-keys.spec.ts |
| e2e/data-knowledge.spec.ts |
| e2e/data-organizer.spec.ts |
| e2e/data-projects.spec.ts |
| e2e/data-research.spec.ts |
| e2e/data-room.spec.ts |
| e2e/data-runtime.spec.ts |
| e2e/data-sync.spec.ts |
| e2e/routes-a-flow.spec.ts |
| e2e/routes-b-flow.spec.ts |
| e2e/screenshots.spec.ts |
| e2e/wiki-brain.spec.ts |


---

## Связанные материалы

- [Разработчикам: тесты](./dev-testing.md)
- [Разработчикам: ворота качества и CI](./dev-ci.md)
- [Скрипты и CLI](./dev-scripts.md)
- [Разработчикам: обзор и слои](./dev-overview.md)

[← Все материалы](./README.md)
