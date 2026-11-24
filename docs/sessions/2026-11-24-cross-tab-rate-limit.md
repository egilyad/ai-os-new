# 2026-11-24 — cross-tab-rate-limit

Статус: done

## Цель сессии

Ре-аудит P1-11: per-tab rate-limit бакеты умножали лимит на число вкладок.

## Что сделано (файлы + коммиты)

- `contracts/cross-tab-state.ts` — опциональный `getRateLimit(provider, keyId)`.
- `cross-tab-state.ts` — реализация чтения из `localRateLimits`, который уже заполняется `updateRateLimit`.
- `rate-limit-decorator.ts` — публикация глобального remaining после каждого списания и проверка чужого лимита в `canSend`/`checkRate`.
- Тест «не умножает лимит на число вкладок»; 5/5 в файле.

## Принятые решения (+ почему; кандидат в ADR?)

- Разделяемый только глобальный бакет: per-key бакеты остаются локальными для справедливости между ключами.
- `getRateLimit` опциональный в контракте — старые моки и consumer'ы не ломаются.
- resetAt в будущем блокирует отправку; после его истечения локальный refill снова разрешает запрос.

## Обнаруженные проблемы / гипотезы

- Факт: состояние передаётся через BroadcastChannel и `localRateLimits`, между процессами/браузерами не делится — это граница модели.
- Гипотеза: для жёсткого глобального лимита нужен server-side CAS-счётчик; current решение — смягчение, не гарантия.
- ESLint: 0 ошибок; 5 тестов зелёные.

## Результаты проверок (typecheck/lint/test — что запускалось)

- `vitest run rate-limit-decorator.test.ts` — 5/5; ESLint — 0 замечаний.
- Полный typecheck/E2E не запускались локально — оставить CI.

## Следующий логический шаг

P1-9: hard-stop бюджета — персистентное состояние вместо in-memory; затем P1-12 (Groq через SDK).

---

## Факты (авто, из checkpoint.mjs)

- Ветка: main @ e01ebf8
- Изменённых файлов: 4
  - M src/kernel/contracts/cross-tab-state.ts
  - M src/kernel/services/cross-tab-state.ts
  - M src/llm/decorators/rate-limit-decorator.test.ts
  - M src/llm/decorators/rate-limit-decorator.ts
- Diff stat:
  - src/kernel/contracts/cross-tab-state.ts | 1 +
  - src/kernel/services/cross-tab-state.ts | 4 ++++
  - src/llm/decorators/rate-limit-decorator.test.ts | 21 +++++++++++++++++++++
  - src/llm/decorators/rate-limit-decorator.ts | 19 ++++++++++++++++++-
  - 4 files changed, 44 insertions(+), 1 deletion(-)
- Последние коммиты:
  - e01ebf8 fix(snapshot): restore live state after replay stops
  - 94da4db feat(validation): extend Zod hooks to ops tables
  - cad7454 fix(lock): add fencing tokens and fail-closed chat sends
  - feb984d fix(reaudit): secure secrets, init flags, batch aborts
  - 8687325 refactor(keystate): merge writes with CAS across tabs
