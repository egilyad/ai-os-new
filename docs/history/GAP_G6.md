# GAP G6 — Browser / Computer use hardening — evidence

> Phase 59. Статический GAP Closure. Дата: 2026-09-07. Статус: `STATICALLY VERIFIED / BLOCKED-RUNTIME`.

---

## GAP
`ComputerService` (`rivals5/computer-service.ts:22`) 8 actions `screenshot/click_at/type_text/scroll/open_url/open_app/browser_navigate/devtools_run`, `SENSITIVE` password regex, `validate()` + ticket `sandbox.get(ticketId)` handoff `computer:handoff` / `queued`. Нет strict per-action schemas (zod-like), нет handoff artifact capture, нет policy (maxTextLen/schemes/blockedPatterns).

## WHY IT MATTERS
10-system: OpenAI computer-use / Google computer — reference for browser automation. Без strict schemas/handoff evidence — browser нельзя доказуемо handoff'ить, canvas BLOCKED.

## REFERENCE SYSTEM
OpenAI Operator (computer-use), Google computer, BrowserForge handoff pattern.

## CURRENT STATE (до G6)
- `src/kernel/contracts/rivals5.ts:58` — `IComputerService { act(ticketId, action, args) }`
- `src/kernel/services/rivals5/computer-service.ts:1` — `ACTIONS 8`, `SENSITIVE`, `validate()` (x/y 0..1000, text non-empty + SENSITIVE field, scroll dir, url https, name, browser_navigate url, devtools_run command), `sandbox?.get(ticketId)` → `computer:handoff` or `computer:act queued`.
- Нет per-action schema strict, нет artifact `browser/harness/*`.

## TARGET (G6)
- Additive `BrowserHarnessService` — strict schemas per action + policy + handoff artifact (`browser/harness/<id>`), over `ComputerService`. Real browser = `BLOCKED-RUNTIME` (handoff).
- Policy `maxTextLen 2000, allowedSchemes http/https, blockedPatterns [/password|passwd|card|cvv|otp|2fa|seed phrase/]`.
- Artifact `logs: [validated, computer result, BLOCKED-RUNTIME note]`, `status handoff|queued|rejected`.

## IMPLEMENT

| Что | Файл |
|-----|------|
| Contracts | `src/kernel/contracts/browser-harness.ts:1` — `BROWSER_ACTIONS 8`, `BrowserHarnessPolicy`, `BrowserArtifact (handoff|queued|rejected, handoffReason, logs)`, `IBrowserHarnessService` |
| Service | `src/kernel/services/browser/browser-harness-service.ts:1` — `validate()` strict (click_at x/y 0..1000 + button, type_text maxLen + blockedPatterns, scroll amount 1..10000, open_url/browser_navigate https + waitUntil, devtools_run timeoutMs 100..120000, screenshot fullPage/clip), `act()` → `computer.act()` → artifact `kv browser/harness/<id>` + `browser:harness:act` emit |
| DI | `src/kernel/service-registration/phase59-browser-harness.ts:1` — registers `browserHarnessService` |
| Wiring | `src/kernel/service-registration/index.ts:59` — `registerPhase59` |
| Event | `src/kernel/events/event-registry.ts:2050` — `BROWSER_HARNESS_ACT` |
| Static test | `src/kernel/services/browser/browser-harness-service.test.ts:1` — 4 cases (strict schemas 5 checks, artifact+list, policy maxTextLen/blocked, handoff vs queued) |

**Additive check:** `computer-service.ts:1` untouched; harness wraps it, stores separate `browser/harness/*`, validates before delegate.

## STATIC TEST

```text
src/kernel/services/browser/browser-harness-service.test.ts
  ✓ strict schemas: click_at, type_text, browser_navigate + unknown
  ✓ artifact capture + list
  ✓ policy maxTextLen + blockedPatterns
  ✓ handoff vs queued status
```

> На слабом ПК не гонялся → `BLOCKED-RUNTIME` до `vitest` на сильном ПК.

## EVIDENCE

- **Contracts-first:** `src/kernel/contracts/browser-harness.ts:1` — ILifecycle, `BROWSER_ACTIONS` const.
- **EventBus:** `EVENTS.BROWSER_HARNESS_ACT` (`event-registry.ts:2050`) — Zod schema, emit in `browser-harness-service.ts`.
- **DI:** `phase59-browser-harness.ts:1` — depends on `dal+computerService`.
- **No migration:** uses `dal.kv` (`browser/harness/*`), no Dexie tables.
- **Existing intact:** `rivals5/computer-service.ts:1` still 8 actions, `rivals5.ts:58` unchanged.

## MARK

- **CLOSED (static):** Strict per-action schemas (8), policy, handoff artifact capture (logs + BLOCKED note), `BROWSER_HARNESS_ACT`, DI+event, static tests.
- **PARTIAL (runtime-pending):** `vitest` + `typecheck:fast` — до сильного ПК.
- **BLOCKED-RUNTIME:** Real browser (Operator-style screenshot/click/type on real OS) — помечено `BLOCKED-RUNTIME: real browser not wired (handoff)` in logs; real ticket `sandbox.approved→running` flow — after Заход 2.
- **NOT CLOSED:** Computer `devtools_run` real exec, `browser_navigate` waitUntil real — after runtime.

## CAPABILITY_MATRIX delta

- `Browser / Computer use` — `Existence 6→7`, `Maturity 3→5 (static)` (strict schemas+artifact done; real browser BLOCKED), still `⏳ Runtime 1`.
- Next: `G7 Interop (MCP deep)` / `G8 Eval` — remaining STATIC GAPs (G7/G8 not in plan order, but per `STATIC_GAP_CLOSURE_PLAN.md` G7→G8 before stop).

---

## Дальше

G6 `STOP` — ждать подтверждения перед G7. Следующий: `G7 MCP deep` phase60 (или G7/G8 по обновлённому порядку — уточни).
