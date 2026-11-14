---
description: Создать новую заметку-черновик в Obsidian Vault
---

Создай новую заметку в папке `inbox/` (или `drafts/`) Vault `C:\ObsidianData\ObsidianOpenCode\opencode` (или `$env:VAULT_ROOT`) с YAML frontmatter:

- `id` — slug из заголовка
- `source` — что породило заметку (session/checkpoint/research/...)
- `created` — дата
- `status: draft`

Правила:

- Только создание новых файлов в `inbox/`/`drafts/` — никаких правок существующих заметок.
- Имя файла — kebab-case, без спецсимволов.
- После создания — покажи путь к файлу.
