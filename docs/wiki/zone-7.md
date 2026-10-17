<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Зона 7: инструменты и MCP

> Раздел: **История разработки** · Статус: verified · Теги: аудит, зона 7

## Что проверено и исправлено

- ToolsPanel Register был плацебо (тост «Capability Registry Wizard opening...», визарда нет в коде): теперь открывает модалку и реально регистрирует через toolService.addTool (валидация имени, success/error).
- SkillsPanel «Fine-tune Pipeline» был плацебо (тост, ничего не открывает, бэкенда нет): кнопка удалена, счётчик Executions остался.
- SkillsPanel: таб «Installed» молча терял счётчик (ключ без {count}, .replace никуда): теперь Installed ({count}) через params.
- ToolsPanel: tools:updated терпит не-массив; поиск терпит legacy без name/description; execute терпит malformed result.
- MCPPanel: mount и все хендлеры через refreshServers с баннером (были голые getServers); поиск терпит legacy; confirm удаления и тост reconnect — через i18n.
- SkillsPanel: SKILLS_UPDATED терпит не-массив; поиск терпит legacy; toolsUsed терпит undefined (пустой бокс скрыт); executionCount — «0 Executions» вместо undefined.
- Common getStatusColor терпит undefined (краш найден тестом MCP-панели на legacy-сервере).
- Тосты экспорта/импорта/тоггла/установки — все через i18n-ключи en+ru; hub-empty и perf-notice — ключи вместо хардкода.
- Тесты: ToolsPanel 14/14 (+3, мок добит rootLogger), SkillsPanel 12/12 (+3), MCPPanel 5/5 (новый файл).
- Найдена и убита петля рендера: эффект в зависимости от нестабильного t (мок) + setState. Фикс: mount-эффекты с [] (MCPPanel), стабильный t в моках (DashboardPanel.test — вис Зоны 5 закрыт, 11/11).

## Отложено, требует проверки

- ToolInspector sandbox/security/schema табы — глубокий аудит не делался (только панель списка и register).
- MCPEditorModal add/edit-пути — только поверхностно (карточки + expand покрыты тестами).
- Marketplace-скиллы: что реально ставит installSkill (зависимости?) — не проверялось, только UI-путь.
- Резолв Zone5-hang применён и к DashboardPanel.test, но полный прогон всего репо в этом окружении по-прежнему не влезает в таймауты — CI остаётся гейтом.

---

## Связанные материалы

- [Диагностика и известные проблемы](./diagnostics.md)

[← Все материалы](./README.md)
