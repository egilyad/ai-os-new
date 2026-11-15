---
title: Демо — промпт для работы с Obsidian
category: obsidian
usage: Поиск/сохранение заметок и интеграция с vault
price: low
---

# Промпт: Работа с Obsidian vault

## Назначение

Шаблон для работы с заметками: поиск по vault, создание черновика,
сохранение сессии в vault.

## Промпт

```
Работа с Obsidian vault (C:\ObsidianData\ObsidianOpenCode\opencode):

1. Поиск: найди заметки по запросу [ЗАПРОС] (grep по vault).
2. Черновик: создай черновик в inbox/ с YAML frontmatter.
3. Сохранение: сохрани итоги сессии в vault (при необходимости).
4. Дай ссылки на найденные/созданные файлы.
```

## Заметки

- Команды: `/vault`, `/vault-draft`, `/vault-saving` (вкладка «Команды»).
- Детали интеграции — `docs/wiki/dev-obsidian-vault.md`.
