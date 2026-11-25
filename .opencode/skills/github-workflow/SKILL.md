---
name: github-workflow
description: Use when working with git/GitHub in this repo — commits, pushes, PRs, CI status, and safety rules. Triggers on words like commit, push, PR, pull request, CI, GitHub Actions, sync.
---

# GitHub workflow (SuperAgents OS)

## Правила

- Коммиты: только по явной просьбе пользователя, либо в конце сессии, если пользователь разрешил авто-пуш.
- commitlint: заголовок ≤100 символов, subject в нижнем регистре (без sentence-case/UPPER).
- Запрещено: принудительная перезапись истории, принудительный пуш, очистка рабочего дерева и рекурсивное удаление без явного разрешения (заблокировано в правах).
- Перед пушем: `git status -sb`, `git log --oneline -5`.

## Порядок

1. `git status -sb` — увидеть изменения.
2. `git add -A` + `git commit` с корректным заголовком.
3. `git push origin main` (или `/sync` перед этим).
4. CI проверяется через `/ci` или GitHub MCP; при красном — фиксить.

## PR

- `/pr` создаёт PR (base=main) и возвращает ссылку.
- Ревью — через агента `pr-reviewer` (субагент).

## Инструменты

- GitHub MCP (`github` сервер в `opencode.jsonc`), токен `GITHUB_TOKEN`.
