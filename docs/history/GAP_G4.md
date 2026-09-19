# GAP G4 — Deployment (bundle zip + env + logs) — evidence

> Phase 57. Статический GAP Closure. Дата: 2026-09-07. Статус: `STATICALLY VERIFIED / BLOCKED-RUNTIME`.

---

## GAP
Deployment `G MISSING`: был только `DeployService` MOCK (localStorage `deploy_data`, `simulateDeploy` 2500ms stages `building→deploying→verifying→live`, `STORAGE_KEY='deploy_data'`, `src/kernel/services/deploy-service.ts:1`). Нет `deploy push` (bundle zip + env manifest + start script + logs).

## WHY IT MATTERS
10-system: Mastra `deploy`, CrewAI `crew deploy push` — reference. Без bundle пользователь не может export/package локально, нужен сильный ПК для proof на чистой машине.

## REFERENCE SYSTEM
Mastra `mastra deploy` (zip+env+logs), CrewAI `crew deploy` (zip + env + start script).

## CURRENT STATE (до G4)
- `src/kernel/services/deploy-service.ts:1` — `@deprecated MOCK`, `SSORAGE_KEY deploy_data`, `apiEndpoint` SSRF-guarded (https only, no private IP), `deploy()` → `simulateDeploy()` or `fetch(apiEndpoint/deploy)`, `rollback/cancelDeploy`, `getEnvironments/getDomains`.
- `src/kernel/contracts/deploy.ts:1` — `DeployConfig/Deployment/IDeployService` (pending/building/deploying/verifying/live/failed/rolled_back).
- Нет bundle, нет env manifest redaction, нет start script per target, нет `deploy:bundle:created`.

## TARGET (G4)
- Additive `DeployBundleService` — `buildBundle(configId)` → `{ envManifest (REDACTED), startScript (docker/vercel/custom), files[manifest.json + Dockerfile/vercel.json/start.sh + config.json], manifestHash, logs[BLOCKED-RUNTIME note] }`
- Persist via `DatabaseService.keyValue` (`deploy:bundle:<id>` + `deploy:bundle:index`), no Dexie migration.
- `IDeployBundleService` ILifecycle, `DEPLOY_BUNDLE_CREATED` event.

## IMPLEMENT

| Что | Файл |
|-----|------|
| Contracts | `src/kernel/contracts/deploy-bundle.ts:1` — `DeployBundle`, `IDeployBundleService` |
| Service | `src/kernel/services/deploy/deploy-bundle-service.ts:1` — `buildBundle()` (redact `/key|secret|token|password/ → [REDACTED]`, `startScriptFor()` per target, hashStub, `BUNDLE_PREFIX`, `BUNDLE_INDEX`, logs + BLOCKED note), `getBundle/listBundles/removeBundle/getLogs` |
| DI | `src/kernel/service-registration/phase57-deploy-bundle.ts:1` — registers `deployBundleService` |
| Wiring | `src/kernel/service-registration/index.ts:57` — `registerPhase57` |
| Event | `src/kernel/events/event-registry.ts:2244` — `DEPLOY_BUNDLE_CREATED` |
| Static test | `src/kernel/services/deploy/deploy-bundle-service.test.ts:1` — 3 cases (build docker redacted + logs + event, vercel/custom scripts, unknown throws) |

**Additive check:** `DeployService` untouched (`deploy-service.ts:1` still MOCK); bundle is separate layer, uses `IDeployService.getConfigs()` read-only.

## STATIC TEST

```text
src/kernel/services/deploy/deploy-bundle-service.test.ts
  ✓ buildBundle per target, env redacted, logs BLOCKED note
  ✓ vercel & custom startScript
  ✓ unknown config throws
```

> На слабом ПК не гонялся → `BLOCKED-RUNTIME` до `vitest` на сильном ПК.

## EVIDENCE

- **Contracts-first:** `src/kernel/contracts/deploy-bundle.ts:1` — ILifecycle, `getLogs()` stub (real tail BLOCKED).
- **EventBus:** `EVENTS.DEPLOY_BUNDLE_CREATED` (`event-registry.ts:2244`) — Zod schema.
- **DI:** `phase57-deploy-bundle.ts:1` — lazy, depends on `deployService+database`.
- **No migration:** uses `database.getKv/setKv` (`deploy:bundle:*`), `DatabaseService.keyValue` already  `SuperAgentsDB v34`.
- **Existing intact:** `deploy-service.ts:1` still simulates, `deploy.ts:1` unchanged.

## MARK

- **CLOSED (static):** Bundle build (env manifest REDACTED, startScript per target, file manifest, hash, logs), persist via keyValue, DI+event, static tests.
- **PARTIAL (runtime-pending):** `vitest` + `typecheck:fast` — до сильного ПК.
- **BLOCKED-RUNTIME:** Real zip (JSZip), real filesystem write, real `docker build` / `vercel deploy`, cloud push, log tail streaming — помечено `BLOCKED-RUNTIME` (note in logs). Run on clean machine pending.
- **NOT CLOSED:** `DeployPanel` UI for bundle download — intentionally after runtime (needs bundle blob).

## CAPABILITY_MATRIX delta

- `Deployment` — `Existence 2→7`, `Integration 1→5`, `Maturity 1→5 (static)` (local bundle done; real zip/cloud BLOCKED), still `⏳ Runtime 0→1` (static only) — will be `7` after Заход 2.
- Next: `G5 Code execution depth`.

---

## Дальше

G4 `STOP` — ждать подтверждения перед G5. Следующий: `G5 CodeExec sandbox depth` phase58.
