# 2026-11-23 — modal-a11y-audit

Статус: done

## Цель сессии

A11y-аудит модалок (Э2.5): проверить `role="dialog"`, `aria-modal`, Escape и focus-ловушку.

## Что сделано (файлы + коммиты)

- Аудит: `ModalShell` уже даёт FocusScope/Escape/role/aria-modal; AddKeyModal, KeyboardShortcutsModal и др. используют готовые механизмы. Найдены три модалки без dialog-семантики.
- `VaultSettingsModal` — добавлены Escape, `role="dialog"`, `aria-modal="true"`, `aria-label`.
- `CrystalProposeModal` — то же самое.
- `TaskDetailModal` — то же самое.

## Принятые решения (+ почему; кандидат в ADR?)

- Не переписывать модалки на `ModalShell`: правка точечная и не меняет визуальное поведение/анимации.
- `aria-label` добавлен на панель диалога, где нет видимого заголовка с id для `aria-labelledby`.
- Escape слушается на `window` и снимается при размонтировании — не оставляет слушателей.

## Обнаруженные проблемы / гипотезы

- Факт: часть модалок всё ещё без `role="dialog"` (PreviewModal, NodeDetailSidebar и др.) — сплошной аудит всех 20+ оверлеев не проводился.
- Гипотеза: unify на `ModalShell` дал бы единую семантику, но потребует переделки анимаций — отдельный PR.
- ESLint: 0 ошибок; предупреждения в затронутых файлах предсуществующие (raw colors, restricted imports, Date.now в render).

## Результаты проверок (typecheck/lint/test — что запускалось)

- ESLint на трёх модалках — 0 ошибок.
- Полный typecheck/E2E не запускались локально — оставить CI.

## Следующий логический шаг

5 overview-хабов (Э2.1 единого роадмапа): agents / memory / debates / providers / background.

---

## Факты (авто, из checkpoint.mjs)

- Ветка: main @ fd05571
- Изменённых файлов: 3
  - M src/components/CrystalVaultPanel/CrystalProposeModal.tsx
  - M src/components/ProviderManager/VaultSettingsModal.tsx
  - M src/components/TasksPanel/TaskDetailModal.tsx
- Diff stat:
  - src/components/CrystalVaultPanel/CrystalProposeModal.tsx | 13 ++++++++++++-
  - src/components/ProviderManager/VaultSettingsModal.tsx | 11 +++++++++++
  - src/components/TasksPanel/TaskDetailModal.tsx | 11 +++++++++++
  - 3 files changed, 34 insertions(+), 1 deletion(-)
- Последние коммиты:
  - fd05571 docs: require push at end of each session
  - 3218efd fix(a11y): make focus trap handle Escape and dynamic content
  - 4db589f feat(notifications): bridge domain events to notifications
  - c5f8fab feat(notifications): mount toast layer in app shell
  - 14867b7 feat(notifications): add EventBus-backed inbox service
