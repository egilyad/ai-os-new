# Phase U — Русская школа + рынок (DONE, без проверок)

Дата: 2026-09-06. Сравнения: `RIVALS_RU_COMPARE.md`. Проверки — на финал.

## Что сделано

### U.1 Metabolic + MAESTRO (старая школа)
- `MetabolicService` — цикл возбуждение/торможение, доминанта Ухтомского, уровни Бернштейна A-E, блоки Лурии как линзы, без backprop. `tick(signal,intensity)` → action + dominant, `setDominant`.
- `MaestroService` (AIRI) — экосистема: роли + задачи + оркестрация с мультимодальным роутингом по токенам.

### U.2 Локаль + химик + GigaChat
- `LocalTripleService` (Ollama Planner→Executor→Critic, Яндекс.Диск/почта через ToolRunner).
- `ChemistService` (Сбер×ITMO, RAG по химии + SMILES).
- `AnalitikService` (Analitik Lab: Intake→Supervisor→Proposal на GigaChat, budget per agent).
- `RuslanService` (самообучение: `learn` → новый skill в SkillMarket, `use` → YandexGPT/GigaChat/Kimi/Qwen).

### U.3 Heisenberg + 187 агентов + лабы + GigaStudio + RU-паки
- `HeisenbergService` — board-first (todo/doing/done, 8 ролей seed).
- `AgencyRuService` — каталог 187 (+10 показано) → импорт как crew.
- `EvoLabService` — лаба: запуск паттерна → метрика score.
- `GigaStudioService` — PM→Frontend→Backend→QA, Next.js scaffold, preview.

### Склады RU (пополнение, без миграции)
- Tools (seed в phase47 next): `yadisk.read/write`, `mail.send/list`, `vk.post`, `wb.price`, `yandex.metrica` — через `ToolRunner.addTool` (mock).
- Skills: 4 RU-скилла (VK SMM, WB Manager, Yandex SEO, GigaChat Analyst) — SkillMarket.
- Роли: 6 RU-ролей (Химик-органик, SEO для Яндекса, WB-менеджер, SMM VK, Аналитик GigaChat, Ruslan).
- Линзы: `ухтомский-доминанта`, `бернштейн-уровни` (доки линз).

### Wiring
- **Без смены Dexie** (kv, v34 max) — как условились для Phase H+.
- `phase47-russian` (10 сервисов), 6 событий (`metabolic:*`, `maestro:*`, `ruslan:*`…), lazy-сервисы.
- Доки: `RIVALS_RU_COMPARE.md` + этот файл.

## Отложено на финальную проверку
- typecheck/build/tests по RU-срезу, e2e metabolic→maestro→localTriple→chemist→analitik→ruslan→heisenberg→agencyRu→evo→gigaStudio.
