<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Зона 15: исследования

> Раздел: **История разработки** · Статус: verified · Теги: аудит, зона 15

## Что проверено и исправлено

- ResearchEnginePanel: create/run/delete/refresh были голыми (create глотал ошибку целиком пустым catch) — теперь всё с баннером; сессии/адаптеры/конфиг терпят не-массивы и throw на старте.
- GeminiResearchPanel: загрузка сессий в mount и в poll — guards; селект терпит сессии без loops; мёртвый error-слот наконец-то используется.
- Ключи research_engine.error_* en+ru.
- Тесты: ResearchEnginePanel 3/3, GeminiResearchPanel 2/2 (новые файлы).
- ВАЖНО: локальная верификация невозможна — vitest-пул мёртв системно с ~05:18 (воркеры не стартуют даже на тривиальных файлах, затем лёг и eslint). Код вычитан вручную, гейт — только CI.

## Отложено, требует проверки

- ResearchEngine AdvancedTab и все табы ResearchPanel (Citations/FactCheck/PeerReview/...) — не covered.
- DebateResearch (50+ файлов аудитов) — вообще не тронут, отдельная зона.
- Gemini-табы (Search/FactCheck/Summary/Anomalies/PeerReview) — только рендер через панель, прямых тестов нет.
- useVisibilityInterval на 2с + usePolling на 15с одновременно — двойной опрос, возможный лишний ререндер.

---

## Связанные материалы

- [Диагностика и известные проблемы](./diagnostics.md)

[← Все материалы](./README.md)
