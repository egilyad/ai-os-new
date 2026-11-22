# 2026-11-22 — key-vault-integration-and-p0-status

Статус: done

## Цель сессии

Выполнить первые два PR единого роадмапа SuperAgents OS: интеграционный тест пути ключей и актуализацию P0/релизных гейтов в документации.

## Что сделано (файлы + коммиты)

- `src/kernel/services/key-management/key-vault-migration.integration.test.ts` — новый интеграционный тест (5 сценариев) с реальным `KeyVault`: legacy plaintext → encrypted at rest, fail-closed при locked, экспорт без утечек, перезапуск с верной/неверной фразой.
- `package.json` — тест добавлен в `test:stable` и `test:coverage`, чтобы сценарий блокировал деплой.
- `README.md:144` — предупреждение о ключах приведено к реальному поведению vault (plaintext до создания vault, at-rest шифрование после).
- `src/components/WikiPanel/wiki-dev-status.ts` — источник автогенерации `dev-status-*`: critical/blocked/debt обновлены под закрытые P0-1/P0-2, добавлен раздел «Релизный гейт».
- Перегенерированы вики-артефакты (`gen:wiki-*`), `docs/inventory.json`, `src/generated/*`.

## Принятые решения (+ почему; кандидат в ADR?)

- Локальный браузерный режим — основной продукт; командный серверный остаётся экспериментальным до authz и аудита изоляции. Источник: `New folder (8)/UNITED_ROADMAP_SuperAgents_OS.md`.
- Один владелец переходов состояния запуска: оркестратор решает статус, постоянная запись хранит историю, replay только читает. Кандидат в ADR — зафиксировать перед реализацией сквозного сценария.
- Интеграционный тест включён в `test:stable`, а не только в полную матрицу: критичные проверки должны блокировать деплой.

## Обнаруженные проблемы / гипотезы

- Гипотеза подтверждена тестом: `KeyVault.encryptAllKeys()` при locked возвращает исходный открытый текст, но путь записи в `KeyRegistry.doSaveKeysWithSnapshot()` блокирует запись (fail-closed). Отдельного фикса KeyVault не потребовалось.
- Факт: при загрузке зашифрованного ключа `loadKeys()` перешифровывает его новым salt/IV (encrypt-on-load convergence) — запись меняется, но остаётся зашифрованной.
- Расхождение README/Wiki с кодом устранено в критических и заблокированных статусах; архивные карты аудитов сохранены как исторические.
- PBKDF2 (600k итераций) делает тест ~46 с — добавлен явный таймаут 45 с на сценарий перезапуска.

## Результаты проверок (typecheck/lint/test — что запускалось)

- `node ./node_modules/vitest/vitest.mjs run src/kernel/services/key-management/key-vault-migration.integration.test.ts --no-coverage` — 5/5 passed.
- `node ./node_modules/eslint/bin/eslint.js` на двух изменённых TS-файлах — без замечаний.
- `node scripts/check-docs-health.mjs` — OK, broken source refs 0, manifest problems 0.
- Полный typecheck и сборка не запускались локально (правило слабого ПК) — оставить CI.

## Следующий логический шаг

Сквозной PR: задача → два агента → артефакт с тестовым провайдером и сохранённой историей по `runId` (P1 единого роадмапа).

---

## Факты (авто, из checkpoint.mjs)

- Ветка: main @ 787f2f0
- Изменённых файлов: 13
  - M .superagents/memory/context.md
  - M README.md
  - M docs/inventory.json
  - M docs/wiki/dev-reality-map.md
  - M docs/wiki/dev-status-blocked.md
  - M docs/wiki/dev-status-critical.md
  - M docs/wiki/dev-status-debt.md
  - M docs/wiki/dev-status-testing.md
  - M package.json
  - M src/components/WikiPanel/wiki-dev-status.ts
- Diff stat:
  - .superagents/memory/context.md | 25 ++++++++++---------------
  - README.md | 2 +-
  - docs/inventory.json | 28 ++++++++++++++--------------
  - docs/wiki/dev-reality-map.md | 4 ++--
  - docs/wiki/dev-status-blocked.md | 8 ++++++--
  - docs/wiki/dev-status-critical.md | 10 ++++++----
  - docs/wiki/dev-status-debt.md | 2 +-
  - docs/wiki/dev-status-testing.md | 4 ++++
  - package.json | 4 ++--
  - src/components/WikiPanel/wiki-dev-status.ts | 24 +++++++++++++++++-------
  - src/generated/wiki-checks.ts | 2 +-
  - src/generated/wiki-docs-health.ts | 2 +-
  - 12 files changed, 65 insertions(+), 50 deletions(-)
- Последние коммиты:
  - 787f2f0 feat(chat): ttl cache for model auto-refresh
  - 4fb3ab4 feat(chat): pending switch indicator while sending
  - a9abd99 feat(chat): unified llm error advice in diagnostics
  - 0cb8737 fix(forum): monotonic post timestamps for stable ordering
  - f9dd183 fix(tools): openapi fallback tool name normalization
