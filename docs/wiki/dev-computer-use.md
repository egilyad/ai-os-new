<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Computer Use: управление рабочим столом Windows (desk-mcp)

> Раздел: **Разработчикам** · Статус: documented · Теги: dev, computer-use, desktop, mcp, windows

Источники: `C:/Users/evgeny/AppData/Local/Programs/desk-mcp/README.ru.md`, `opencode.jsonc`

## Что это

**desk-mcp** — MCP-сервер, дающий OpenCode «глаза и руки» на Windows: скриншоты, OCR, мышь, клавиатура, окна, UI Automation (UIA/MSAA) и браузер (CDP). 46 инструментов, Node.js + PowerShell, без Python и нативных модулей.

## Установка

- Клон: `C:\Users\evgeny\AppData\Local\Programs\desk-mcp` (`git clone https://github.com/DigitalDog1/desk-mcp.git`, затем `npm ci`).
- **Антивирус:** Defender может заблокировать `worker.ps1` (AMSI) — требуется исключение папки в Windows Security (ExclusionPath).
- Подключение: запись `desk-mcp` в `mcp` раздела `opencode.jsonc` (проектного и глобального), permission `computer_*: allow`.

## Инструменты (46, основные группы)

| Группа | Инструменты |
| --- | --- |
| Экран | `computer_screenshot`, `computer_ocr`, `computer_screeninfo` |
| Доступность | `computer_read_screen`, `computer_find`, `computer_element_at`, `computer_read_table` |
| Управление | `computer_invoke`, `computer_set_value`, `computer_select` |
| Мышь | `computer_click`, `computer_move`, `computer_drag`, `computer_scroll` |
| Клавиатура | `computer_type`, `computer_key`, `computer_key_down/up` |
| Окна | `computer_windows`, `computer_focus`, `computer_launch`, `computer_close_window` |
| Браузер (CDP) | `computer_browser_start/list/tree/click/eval` |
| Служебные | `computer_batch`, `computer_wait`, `computer_permissions`, `computer_selftest` |

## Безопасность

- `computer_launch` и `computer_close_window` требуют `confirm: true`.
- `DESK_DRY_RUN=1` — только планы, без реальных действий.
- `DESK_DISABLE_TOOLS` — выключение ненужных инструментов.
- `DESK_ALLOW_TITLES` — фильтр окон.
- `DESK_AUDIT` — журнал действий воркера.
- Работать в активной сессии (не залоченный экран).

## Сценарий

«Открой SuperAgents OS, перейди в панель агентов, сделай скриншот, найди проблему, подготовь исправление» — `computer_launch` → `computer_windows` → `computer_screenshot` → `computer_click` → `computer_type`.

---

## Связанные материалы

- [Разработчикам: обзор и слои](./dev-overview.md)
- [Память OpenCode: команды и скрипты непрерывности сессий](./dev-opencode-memory.md)
- [DeepWiki: облачная техническая документация на английском](./dev-deepwiki.md)

[← Все материалы](./README.md)
