# OpenCode Runtime Profile

> Input profile for cognitive tools: system context, versions, hardware
> constraints and known issues.

## Overview

This project is developed on a single local Windows machine using OpenCode
Desktop as the primary AI coding agent. The machine is low-end: heavy local
checks are NOT run here; CI runs on GitHub Actions instead.

## Versions

- OpenCode Desktop: **1.19.4** (V1)
  - Electron: 42.3.3 (Win64)
- Node.js: **v24.20.0**
- OS: **Microsoft Windows 10 Education 10.0.19045** (build 19045)
- AI provider: Inception / mercury-3

## Hardware

- CPU: **AMD E-350** — 2 cores / 2 threads (very low-end, ~1.6 GHz)
- RAM: 11.6 GB
- Disks:
  - C: ~34.5 GB free
  - D: ~121 GB free

## CPU constraints

- The machine is too weak for full local runs of:
  - `npm run typecheck` (full `tsc -b --noEmit` can hang >180s)
  - `npm run test:full:*`, e2e suites, `npm run build`
- Local usage is limited to lightweight, targeted checks:
  - eslint on single files
  - quick node scripts
  - small vitest runs on selected files
- Everything heavy goes through GitHub Actions (`.github/workflows/ci.yml`).

## Known issue: bun after updates

- `bun` has been observed to break after updates on this machine (incompatible
  or missing scripts, next failures).
- Workaround: never rely on `bun`; use `node ./node_modules/...` directly
  (e.g. `node ./node_modules/eslint/bin/eslint.js`, `node ./node_modules/vitest/vitest.mjs`).
- `npx` / `npm.ps1` may also be blocked by PowerShell policy — prefer
  `npm.cmd` or direct node invocation.

## Shell notes

- PowerShell 5.1 (Windows).
- Use `cmd1; if ($?) { cmd2 }` for dependent commands (no `&&`).
- Prefer double quotes for interpolated strings, single quotes for verbatim.

## Project layout shortcuts

- Repo root: `C:\Users\evgeny\Desktop\ai-os-new-fix-debate-text-truncation`
- Sidekick app: `C:\Users\evgeny\Desktop\New folder\opencode-sidekick`
- Wiki corpus: `src/components/WikiPanel/` → generates `docs/wiki/`
- Roadmaps: `docs/roadmaps/`
- Audits: `docs/audits/`
- Prompts: `docs/prompts/`
