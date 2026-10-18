<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Зона 19: прогнозы и симуляции

> Раздел: **История разработки** · Статус: documented · Теги: аудит, зона 19

## Что проверено и исправлено

- OutcomeForecasterPanel: handleForecast в try/catch с баннером; expectedScoreGain — «—» вместо NaN%.
- WhatIfPanel: runSim глотал ошибки в finally-молчании — теперь баннер; null-результаты терпятся.
- Тесты: OutcomeForecaster +1 (мусорный ввод), WhatIfPanel 3/3 (новый: honest render + error-banner через UI).
- ВАЖНО: локальная верификация невозможна (vitest-пул мёртв), гейт — только CI. Синтаксис проверен транспиляцией.

## Отложено, требует проверки

- OutcomeForecaster: формула эвристики зашита в UI-тексте (+0.15 novelty, −0.1 risk) — рассинхрон с движком никто не ловит.
- WhatIf-симуляции против живых engine-сервисов — только моки, живого прогона нет.
- ResearchEngine AdvancedTab и остальные табы ResearchPanel — по-прежнему не covered.

---

## Связанные материалы

- [Диагностика и известные проблемы](./diagnostics.md)

[← Все материалы](./README.md)
