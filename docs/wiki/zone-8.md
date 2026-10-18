<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Зона 8: роутер и маршрутизация

> Раздел: **История разработки** · Статус: documented · Теги: аудит, зона 8

## Что проверено и исправлено

- Fallback/downgrade-редакторы — честный draft-then-save (локальные правки + явный Save в сервис), не плацебо: проверено по проводам до routerService.
- routing-utils закалены против legacy-решений: providerColor терпит undefined, scoreBreakdown — отсутствующие components (нули вместо краша всех таблиц), getExplanation — без weights/promptLength.
- HistoryTab: scores/timestamp/score — guards («—» вместо краша/Invalid Date).
- DecisionTreeTab: weights/scores/promptLength — guards («Unknown», нули вместо краша дерева).
- RouterTraceView: своя копия providerColor закалена так же.
- PressureMap: MiniBar/TrendChart терпят не-финитные значения (пустой бар вместо NaN%-ширины).
- Тесты: RoutingIntelligence 7/7 (мок добит rootLogger + 2 legacy-кейса), routing-utils 3/3 (новый юнит).

## Отложено, требует проверки

- Персистентность setFallbackChain/setDowngradeChain за пределами сессии (resolver in-memory?) — UI честно жмёт Save, но переживёт ли reload — не проверено.
- ABTestPanel start/stop — только по проводам, живой A/B-прогон не гонялся.
- PressureMapPanel acknowledgeAlert/stats — только чтение кода, рендер-тестов нет.
- Веса/профили (WeightTunerInner, WeightProfilesSection) — правки пишут в сервис, визуальной верификации нет.

---

## Связанные материалы

- [Диагностика и известные проблемы](./diagnostics.md)

[← Все материалы](./README.md)
