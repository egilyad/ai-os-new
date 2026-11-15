---
description: Sync local branch with origin (fetch + fast-forward pull) and show status.
---

Выполни безопасную синхронизацию с origin:

1. `git fetch origin`
2. `git pull --ff-only` (при конфликте — стоп, ничего не мёржить)
3. `git status -sb` и краткая сводка
