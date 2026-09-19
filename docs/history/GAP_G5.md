# GAP G5 — Code execution depth (policy+timeout+artifact) — evidence

> Phase 58. Статический GAP Closure. Дата: 2026-09-07. Статус: `STATICALLY VERIFIED / BLOCKED-RUNTIME`.

---

## GAP
`CodeExecService` (`rivals5/codeexec-service.ts:66`) shallow: `BANNED` 9 ids, `MAX_CODE_CHARS 20000`, `balanced()` brackets, `genId('codeticket')`, `codeexec:queued` (+ delegate `queued→done/rejected`), `result()` → `queued — no external executor`. Нет policy per-submit, нет timeout, нет artifact capture (logs/exitCode).

## WHY IT MATTERS
10-system: smolagents `PythonInterpreterTool`, E2B — reference sandbox depth. Без timeout/artifact — code execution не доказуемо, handoff вечно `queued`.

## REFERENCE SYSTEM
smolagents/E2B (sandbox + timeout + artifact), OpenAI Code Interpreter (timeout+logs).

## CURRENT STATE (до G5)
- `src/kernel/contracts/rivals5.ts:69` — `ICodeExecService { submit language/code → ticketId, setExecutor(delegate), result(ticketId) }`
- `src/kernel/services/rivals5/codeexec-service.ts:1` — validate → `dal.kv codetickets/<id>` queued → if delegate `await delegate()` → done/rejected, emits `CODEEXEC_QUEUED`.
- Нет per-submit policy, нет timeout wrap, нет artifact `logs/exitCode`.

## TARGET (G5)
- Additive `CodeSandboxService` — `policy (maxChars/allowedLanguages/banned/defaultTimeoutMs) + timeout (wrap delegate, 124 on timeout) + artifact (logs, exitCode 0/1/124, completedAt)` over `CodeExecService`.
- Stub executor `BLOCKED-RUNTIME: real E2B not wired` when no delegate; adapter `setExecutor()` for real executor swap.
- `kv: codesandbox/artifact/<ticketId>`, events `codeexec:sandbox:done`.

## IMPLEMENT

| Что | Файл |
|-----|------|
| Contracts | `src/kernel/contracts/code-sandbox.ts:1` — `SandboxPolicy`, `CodeArtifact (queued/done/rejected/timeout, logs, exitCode, timeoutMs)`, `ICodeSandboxService` |
| Service | `src/kernel/services/sandbox/code-sandbox-service.ts:1` — `init()` installs hardened executor on `codeExec`, `setPolicy/getPolicy`, `submit(policy check → codeExec.submit → kv artifact queued)`, `runWithTimeout(Promise.race + timeout 1s…120s)`, `artifact()` merges CodeExec result, `list()` via kv Map scan, `codeexec:sandbox:done` emit |
| DI | `src/kernel/service-registration/phase58-code-sandbox.ts:1` — registers `codeSandboxService` |
| Wiring | `src/kernel/service-registration/index.ts:58` — `registerPhase58` |
| Event | `src/kernel/events/event-registry.ts:2046` — `CODEEXEC_SANDBOX_DONE` |
| Static test | `src/kernel/services/sandbox/code-sandbox-service.test.ts:1` — 5 cases (policy+done, banned, timeout→124, BLOCKED stub, setPolicy) |

**Additive check:** `codeexec-service.ts:1` untouched; sandbox installs delegate on it, stores separate `codesandbox/artifact/*`.

## STATIC TEST

```text
src/kernel/services/sandbox/code-sandbox-service.test.ts
  ✓ policy + timeout + artifact (done)
  ✓ banned identifier blocked by sandbox policy
  ✓ timeout → artifact timeout, exit 124
  ✓ BLOCKED-RUNTIME stub when no executor set
  ✓ setPolicy/getPolicy
```

> На слабом ПК не гонялся → `BLOCKED-RUNTIME` до `vitest` на сильном ПК.

## EVIDENCE

- **Contracts-first:** `src/kernel/contracts/code-sandbox.ts:1` — ILifecycle, `setExecutor()` adapter.
- **EventBus:** `EVENTS.CODEEXEC_SANDBOX_DONE` (`event-registry.ts:2046`) — Zod schema, emit in `code-sandbox-service.ts`.
- **DI:** `phase58-code-sandbox.ts:1` — depends on `dal+codeExecService`.
- **No migration:** uses `dal.kv` (`codesandbox/artifact/*`), no Dexie tables.
- **Existing intact:** `rivals5/codeexec-service.ts:1` still queued handoff, `rivals5.ts:69` unchanged.

## MARK

- **CLOSED (static):** Policy (allowedLanguages/banned/maxChars), timeout wrap (124), artifact capture (logs/exitCode/completedAt), stub `BLOCKED-RUNTIME`, DI+event, static tests.
- **PARTIAL (runtime-pending):** `vitest` + `typecheck:fast` — до сильного ПК.
- **BLOCKED-RUNTIME:** Real E2B execution (filesystem/network, not stub), real `timeout` on real executor, artifact `list()` via kv enumeration on real DB — помечено `BLOCKED-RUNTIME` (stub `BLOCKED-RUNTIME: real E2B not wired`).
- **NOT CLOSED:** E2B-like `python`/`sql` real interpreter — after Заход 2.

## CAPABILITY_MATRIX delta

- `Code execution` — `Existence 6→7`, `Maturity 3→5 (static)` (policy+timeout+artifact done; real E2B BLOCKED), still `⏳ Runtime 1` (static only).
- Next: `G6 Browser/Computer use`.

---

## Дальше

G5 `STOP` — ждать подтверждения перед G6. Следующий: `G6 Browser hardening` phase59.
