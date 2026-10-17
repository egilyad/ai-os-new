<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Зона 11: workspace и проекты

> Раздел: **История разработки** · Статус: verified · Теги: аудит, зона 11

## Что проверено и исправлено

- ProjectsPanel: все мутации и загрузки табов идут через runGuarded с баннером + Retry (были голые await'ы и console.error — build/snapshot/apply/pipeline/memory/goals падали молча).
- ProjectsPanel: превью-изолят — iframe без sandbox выполнял скрипты с origin приложения (XSS от контента проекта): теперь sandbox="allow-scripts" (опaque origin).
- ProjectsPanel: advance больше не фабрикует 'done' при пустом refresh (держится последний известный стейдж); agentIds/createdAt — guards; QA-хинт — ключ.
- WorkspacePanel: ошибки дерева/аттача/поиска — видимые (отмена пикера молча, как и должно); stale-preview race закрыт генерацией запросов; listTree/search — Array-гарды.
- ScratchpadPanel: analyze в try/catch с баннером; content — guard.
- Тесты: ProjectsPanel 5/5 (+2, стабильный t через vi.hoisted), WorkspacePanel 3/3 (новый), ScratchpadPanel 3/3 (без изменений, реальные сервисы).

## Отложено, требует проверки

- WebsitePreview generatePreview — что за HTML и откуда (доверенный генератор vs пользовательский контент) — влияет на строгость sandbox.
- projectTemplateService.applyTemplate поверх существующих файлов (перезапись/мёрдж?) — поведение не проверено.
- keyService.clearAllData за Purge — живьём не гонялся (только код с confirm).
- ActivitiesPanel проектный — не покрыт.

---

## Связанные материалы

- [Диагностика и известные проблемы](./diagnostics.md)

[← Все материалы](./README.md)
