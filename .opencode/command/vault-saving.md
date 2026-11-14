---
description: Сохранить результат сессии/решения в Vault как черновик
---

Создай заметку-черновик в `inbox/` Vault `C:\ObsidianData\ObsidianOpenCode\opencode` (или `$env:VAULT_ROOT`) с результатом текущей работы/решения. Шаблон:

- frontmatter: `id`, `type` (decision/research/checkpoint), `source` (session id), `created`, `status: draft`
- тело: краткая суть решения, ссылка на коммит/session, следующий шаг

Правила:

- Не перезаписывай существующие заметки.
- После создания — покажи путь и предложи открыть в Obsidian (`obsidian://open?vault=...&file=...`).
