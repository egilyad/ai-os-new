<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Зона 6: governance и политики

> Раздел: **История разработки** · Статус: documented · Теги: аудит, зона 6

## Что проверено и исправлено

- GuardrailsPanel и SopPanel говорили сырыми key-id (guardrails.*, sop.* ключей не было ни в одной локали): добавлен полный набор ключей en+ru, захардкоженные строки переведены на ключи.
- GuardrailsPanel: reload терпит не-массив, поиск терпит legacy-правила без имени.
- SopPanel: reload/poll терпят не-массивы; поиск терпит legacy без name/goal; phases/log/goal — guards (краш на legacy-SOP закрыт).
- SopPanel: синхронный throw runSop больше не вешает busy навсегда и не течёт интервалом (try/catch + done()).
- PolicyPanel: загрузка и refresh — единая точка с баннером вместо краша/тишины; clear violations — через useConfirm с i18n (был нативный window.confirm на английском).
- PolicyPanel: поиск терпит legacy без type/id; lastViolation валидируется (был Invalid Date); мок useAutoClearError чинен (возвращал объект вместо функции).
- GovernancePanel: assign/rolesOf с ошибками — баннером (было молча/UNHANDLED); пустой список больше не врёт при ошибке загрузки; свой ключ empty_roles вместо чужого fleet.empty.
- Common status-vocabulary: normalizeLevel/getPolicyDimensionColor терпят undefined (был краш на .toLowerCase).
- ErrorBoundary.test: протухший мок добит (onLocaleLoaded) — 6/6.

## Отложено, требует проверки

- Enforcement-путь политик/гардрэйлов (что реально блокирует рантайм, а что только UI) — не аудировался, только панели.
- GovernancePanel: индексные key={i}, нет confirm на assign, scope ролей не показан.
- SopPanel: интервал поллинга живёт до конца runSop даже при размонтировании (done только по завершению).
- Policy value/types без схемной валидации — движок может отвергнуть то, что UI сохранил.

---

## Связанные материалы

- [Диагностика и известные проблемы](./diagnostics.md)

[← Все материалы](./README.md)
