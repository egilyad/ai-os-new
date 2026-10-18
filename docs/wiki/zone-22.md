<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Зона 22: смещения и доверие

> Раздел: **История разработки** · Статус: documented · Теги: аудит, зона 22

## Что проверено и исправлено

- BeliefMining: extractBeliefs пропускает записи без content (падал matchAll на undefined, роняя все панели-потребители).
- AnchoringPanel: useMemo обёрнуты в try/catch ([] и '' при ошибке); рендер терпит записи без полей.
- Entanglement-engine: extractAnchors пропускает записи без content.
- BlindEval: displayAgent терпит отсутствующий agentId.
- AdversarialSourcePanel: verify глотал ошибки в try/finally — теперь баннер; loadDebate не вставляет «undefined» в текст.
- BayesianJudgePanel: agent.name.split без fallback ронял рендер, если у legacy-агента нет name — теперь (name ?? id); posterior/updates — guards от NaN.
- ShadowPanel: сбой diff логировался только в console.error (панель показывала «No data») — теперь баннер с текстом ошибки.
- DyadPanel: legacy-цикл без goal/log ронял .toLowerCase()/.slice()/.log.length — guards + «—»/пустой лог вместо undefined.
- i18n: весь неймспейс dyad.* отсутствовал (панель показывала сырые ключи) — добавлен en+ru (23 ключа), паритет проверен.
- Проверены без правок (сервисы гарантируют корректные поля / уже есть баннер): BiasProfilerPanel, CredibilityPanel, IncentiveDetectorPanel, PersonaMixerPanel, ShadowOpponentPanel.
- Тесты: BeliefMining +1 (legacy без content), AnchoringPanel 2/2 (новый), BlindEval +1, AdversarialSource +1 (fetch-ошибка → баннер), BayesianJudge +1 (агент без name), DyadPanel +1 (цикл без goal/log).
- ВАЖНО: локальная верификация невозможна (vitest-пул мёртв), гейт — только CI. Синтаксис проверен транспиляцией.

## Отложено, требует проверки

- BayesianJudge/BiasProfiler/Credibility/Incentive/PersonaMixer — guards точечные, живой прогон против реальных payload шины не гонялся.
- ShadowPanel живьём зависит от routerProjection/routerService: расхождение live vs projection при реальной нагрузке не проверялось — только баннер сбоя.
- Counterfactual-панель (CausalAttribution/ScoreComparison/TraceSidebar) — вообще не тронута.

---

## Связанные материалы

- [Диагностика и известные проблемы](./diagnostics.md)

[← Все материалы](./README.md)
