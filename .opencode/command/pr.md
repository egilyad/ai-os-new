---
description: Create or update a GitHub PR from the current branch (base = main).
---

Создай/обнови PR из текущей ветки:

1. Определи текущую ветку (`git branch --show-current`) и base `main`.
2. Проверь статус (`git status -sb`) и, при необходимости, запушь ветку (без force).
3. Оформи PR через GitHub MCP: заголовок краткий, описание с блоками «Что сделано / Как проверить / Коммиты», base=main.
4. Верни ссылку на PR.
