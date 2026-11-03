# Статус реализации — Фаза 0 + каркасы SPEC

> Фиксация внедрённого кода (без запуска проверок; прогон — на GitHub в самом конце).
> Дата: 2026-10-31. Корень: `ai-os-new-fix-debate-text-truncation\`.

---

## 1. Реализованные модули

### SPEC_01 — Крипто-vault (passphrase-шифрование секретов)

| Файл                                                             | Что                                                                                                                                  |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `src/kernel/services/key-management/crypto/vault-crypto.ts`      | Чистый крипто-слой (`deriveKey` PBKDF2 600k + AES-GCM-256 non-extractable; `seal`/`open` VaultPackage v1; `verify`/`createVerifier`) |
| `src/kernel/services/key-management/crypto/vault-crypto.test.ts` | Тесты                                                                                                                                |
| `src/kernel/contracts/key-vault.ts`                              | Расширен: createVault/hasVault/verifyPassphrase/unlockWithPassphrase                                                                 |
| `src/kernel/services/key-management/key-vault.ts`                | Переписан поверх VaultCrypto; **fail-closed** (decryptKey при locked → null)                                                         |
| `src/kernel/services/key-management/key-vault.test.ts`           | Тесты                                                                                                                                |
| `src/kernel/services/key-management/key-service.ts`              | Убрана deviceKey-уязвимость; публичные vault-методы; миграция ключей при createVault                                                 |
| `src/kernel/events/event-registry.ts`                            | События key:vault:created/unlocked/locked                                                                                            |
| `src/kernel/services/telegram-service.ts`                        | botToken → vault (VaultPackage) при активном vault; getBot fail-closed                                                               |
| `src/components/ProviderManager/VaultSettingsModal.tsx`          | Passphrase-UI                                                                                                                        |
| `src/components/SettingsPanel/SettingsPanel.tsx`                 | Кнопка «Vault…» во вкладке LLM Keys + рендер модалки                                                                                 |

### SPEC_08 — Единый слой авторизации (default deny)

| Файл                                                                    | Что                                                                 |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `src/kernel/contracts/authorization.ts`                                 | IAuthorizationService/AuthzRequest/AuthorizationRule/matchPattern   |
| `src/kernel/services/permissions/authorization-service.ts`              | AuthorizationService: priority, первое совпадение, **default deny** |
| `src/kernel/services/permissions/authorization-service.test.ts`         | Тесты                                                               |
| `src/kernel/services/trust/governance-service.ts`                       | evaluate(): отсутствие правила → deny                               |
| `src/kernel/services/tool-pipeline/permission-middleware.ts`            | опциональный authorizationService; defaultResolver экспортирован    |
| `src/kernel/services/tool-pipeline/permission-middleware-authz.test.ts` | Тесты                                                               |
| `src/kernel/services/permissions/permission-service.ts`                 | evaluate() использует authz                                         |
| `src/kernel/services/permissions/permission-service-authz.test.ts`      | Тесты                                                               |
| `src/kernel/services/ops/tool-governance-service.ts`                    | check() использует authz                                            |
| `src/kernel/services/ops/tool-governance-service-authz.test.ts`         | Тесты                                                               |
| `src/kernel/service-registration/phase27-ops.ts`                        | toolGovernanceService ← authorizationService                        |
| `src/kernel/service-registration/phase76-agent-permissions.ts`          | toolPipeline ← authorizationService                                 |

### SPEC_03 — Единый MetricsService

| Файл                                                    | Что                                                           |
| ------------------------------------------------------- | ------------------------------------------------------------- |
| `src/kernel/contracts/metrics.ts`                       | IMetricsService/IMetricsStorage/MetricSeries                  |
| `src/kernel/services/ops/metrics-service.ts`            | counters/histograms/gauges, теги, wildcard, flush, процентили |
| `src/kernel/services/ops/metrics-service.test.ts`       | Тесты (+ wildcard)                                            |
| `src/kernel/services/ops/metrics-dexie-storage.ts`      | DexieMetricsStorage                                           |
| `src/kernel/services/ops/metrics-dexie-storage.test.ts` | Тесты                                                         |
| `src/kernel/services/ops/metrics-collector.ts`          | Мост «события → metrics» (llm/tool/memory/router/debate)      |
| `src/kernel/services/ops/metrics-collector.test.ts`     | Тесты                                                         |
| `src/hooks/useMetrics.ts`                               | Реактивный хук                                                |
| `src/components/DashboardPanel/RuntimeMetricsView.tsx`  | Виджет                                                        |
| `src/components/DashboardPanel/DashboardPanel.tsx`      | Встроен RuntimeMetricsView                                    |
| `src/components/AnalyticsPanel/AnalyticsPanel.tsx`      | Секции RuntimeMetricsView (LLM/Tools/Memory)                  |

### Прочие SPEC-каркасы

| SPEC | Файл                                                                                                             | Что                                 |
| ---- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| 02   | `src/kernel/contracts/embedding.ts`, `src/kernel/services/embedding-service.ts` (+test)                          | Единый IEmbeddingService с fallback |
| 05   | `src/kernel/contracts/agent-runtime.ts`, `src/kernel/services/agent-runtime/agent-runtime.ts` (+test)            | IAgentRuntime поверх tool-loop      |
| 04   | `src/kernel/contracts/eval-hub.ts`, `src/kernel/services/eval/eval-hub.ts` (+test)                               | EvalHub (метрики/пороги/repeat)     |
| 06   | `src/kernel/contracts/plugin.ts`, `src/kernel/services/plugins/plugin-manifest.ts`, `plugin-registry.ts` (+test) | Плагинный реестр + валидатор        |
| 07   | `src/kernel/contracts/strategy-program.ts`, `src/kernel/services/debate-runtime/strategy-interpreter.ts` (+test) | Интерпретатор DSL-стратегий         |
| 12   | `src/kernel/contracts/agent-security.ts`, `src/kernel/services/security/agent-security-guard.ts` (+test)         | Guardrail-хелперы                   |
| 09   | `src/kernel/contracts/a2a.ts`, `src/kernel/services/interop/a2a-client.ts` (+test)                               | A2A клиент                          |
| 10   | `src/kernel/contracts/team-auth.ts`, `src/kernel/services/auth/token-codec.ts` (+test)                           | Подписанный токен (HMAC)            |

### Починки отложенных багов

- `LocalSecretStore` — атомарность set/delete через batchSetKv (+test).
- Подтверждено: `CheckpointStore`/`EventRecorder` уже исправлены (WAL, debounce, checksum, generation).

### Регистрация DI + lazyService

- `phase82` → authorizationService, metricsService, metricsCollector (eager), embeddingServiceHub (+DefaultEmbeddingService), pluginRegistry, agentSecurityGuard, agentRuntime, evalHub.
- `services-core.ts` → lazyService: authorizationService, metricsService, embeddingServiceHub, pluginRegistry, agentSecurityGuard, agentRuntime, evalHub.

### Интеграции / починки (доп.)

- `src/shared/utils/file-transfer.ts` (+test) — единые downloadText/readFileAsText.
- Применён в: MemoryPanel (export), LogsPanel (export), ProviderManagerContainer (export/import), commands.ts (download).
- `KeyUsageAnalyticsPanel` — секция RuntimeMetricsView (useMetrics).
- LocalSecretStore — атомарность set/delete через batchSetKv.
- Cognitive provenance: `provenance-linker.ts` (+test), `provenance-collector.ts` (+test), зарегистрированы в DI (linker + eager collector).

---

## 2. Что осталось (следующие шаги)

- [ ] Зарегистрировать `AgentRuntime`/`EvalHub` в DI (требуют deps: callLlm / runPrompt).
- [ ] Интеграция `EmbeddingService` с реальными бэкендами (ProviderEmbeddingService/DefaultEmbeddingService).
- [ ] Перевести `KeyUsageAnalyticsPanel` на `useMetrics`.
- [ ] Метрики памяти (search_latency/hit_rate) — событие/правка MemoryService.
- [ ] Полный прогон `typecheck` / `vitest` / `lint` на GitHub.

---

## 3. Примечание

- Все новые тесты написаны, НО не запускались (по договорённости проверки — на GitHub).
- Изменения не прошли typecheck — возможны мелкие правки типов при первом прогоне.
