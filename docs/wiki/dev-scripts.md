<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Скрипты и CLI

> Раздел: **Разработчикам** · Статус: verified · Теги: dev, скрипты, cli, команды

Источники: `scripts/gen-wiki-scripts.mjs`, `package.json`

## Скрипты и CLI

Как запускать и чинить ОС: команды из package.json и назначение служебных файлов (по первой строке-комментарию в каждом). Полный гейт качества — см. [Разработчикам: ворота качества и CI](./dev-ci.md); генераторы вики — см. [Разработчикам: генераторы и сгенерированные файлы](./dev-generators.md).

### npm-скрипты

| Команда | Выполняет |
|---|---|
| npm run build | node --max-old-space-size=4096 ./node_modules/typescript/bin/tsc -b && node --max-old-space-size=4096 ./node_modules/vite/bin/vite.js build |
| npm run build:skip-typecheck | node -e "console.error('WARNING: skipping typecheck — broken types will NOT fail this build. Prefer `npm run build` for CI/ship.')" && node --max-o… |
| npm run check:circular-kernel | madge --circular --extensions ts --ts-config tsconfig.app.json src/kernel/ 2>&1 \| node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.… |
| npm run check:deps | depcruise --config .dependency-cruiser.cjs src |
| npm run check:deps:graph | depcruise --config .dependency-cruiser.cjs --output-type dot src \| dot -T svg > dependency-graph.svg |
| npm run dev | node --max-old-space-size=4096 ./node_modules/vite/bin/vite.js |
| npm run dev:shared | node server/run-dev.mjs |
| npm run fix:unused | tsx scripts/fix-unused.ts |
| npm run lint | eslint . |
| npm run lint:staged | lint-staged |
| npm run prepare | husky |
| npm run preview | vite preview |
| npm run proxy | node scripts/cors-proxy.mjs |
| npm run sourcemaps:upload | node scripts/upload-sourcemaps.mjs |
| npm run superagents | node cli/superagents.mjs |
| npm run sync-server | node server/sync-server.mjs |
| npm run test | vitest run |
| npm run test:coverage | vitest run src/stores src/hooks src/kernel/events src/kernel/workers src/kernel/container.test.ts src/kernel/security.test.ts src/kernel/services/r… |
| npm run test:e2e | playwright test --config=e2e/playwright.config.ts |
| npm run test:server | node --test server/tests/write-queue.test.mjs server/tests/decide-approval.test.mjs server/tests/run-integrity.test.mjs server/tests/wakeup-issue.t… |
| npm run test:stable | vitest run src/stores src/hooks src/kernel/events src/kernel/workers src/kernel/container.test.ts src/kernel/security.test.ts src/kernel/services/r… |
| npm run test:ui | vitest --ui |
| npm run test:watch | vitest |
| npm run typecheck | node --max-old-space-size=4096 ./node_modules/typescript/bin/tsc -b --noEmit |
| npm run typecheck:fast | node --max-old-space-size=4096 ./node_modules/typescript/bin/tsc --noEmit --project tsconfig.app.json |
| npm run typecheck:watch | tsc -b --noEmit --watch |

### Генераторы и утилиты (scripts/)

генераторы данных вики, readme-карт, токенизация цветов, smoke, прокси, sidecar-ctl.

| Файл | Назначение |
|---|---|
| scripts/cors-proxy.mjs | — |
| scripts/fix-unused.ts | — |
| scripts/gen-readme-maps.mjs | Generator: embeds code-truth maps (debate strategies, quality techniques, |
| scripts/gen-technique-panels.mjs | Generator: creates one real panel component per debate-quality technique |
| scripts/gen-wiki-catalog.mjs | Generator: component catalog for the wiki — every panel component with the |
| scripts/gen-wiki-contracts.mjs | Generator: kernel contracts catalog for the wiki — exported interfaces/types in |
| scripts/gen-wiki-data.mjs | Generator: wiki dynamic data — recent commits feed + panel→component map. |
| scripts/gen-wiki-depmap.mjs | Generator: embed the kernel DI dependency map (DEPENDENCY_MAP.md) into the wiki. |
| scripts/gen-wiki-events.mjs | Generator: event catalog for the wiki — every bus event from the single source |
| scripts/gen-wiki-i18n.mjs | Generator: i18n catalog for the wiki — keys per namespace (en vs ru) and the |
| scripts/gen-wiki-scripts.mjs | Generator: tooling catalog for the wiki — npm scripts and the purpose (header |
| scripts/gen-wiki-stores.mjs | Generator: stores catalog for the wiki — every exported hook/creator/type in |
| scripts/net-guard.mjs | — |
| scripts/rebuild-ru.mjs | — |
| scripts/sidecar-ctl.py | — |
| scripts/smoke-stack.mjs |  |
| scripts/sync-ru.mjs | — |
| scripts/tokenize-colors.mjs |  |
| scripts/upload-sourcemaps.mjs | P1.27: Upload `dist/**/*.map` sourcemaps to an error-tracking backend |

### CLI (cli/)

единая точка входа superagents.

| Файл | Назначение |
|---|---|
| cli/superagents.mjs | M9.2: CLI superagents — onboard/doctor/db-backup/run/configure поверх headless API. |

### Сервер (server/)

sync-server, dev-хост, адаптеры browser/computer, write-queue, ws-auth.

| Файл | Назначение |
|---|---|
| server/adapters.mjs | — |
| server/autocycle-guard.mjs | — |
| server/company-store.mjs | — |
| server/heartbeat-loop.mjs | — |
| server/run-dev.mjs | — |
| server/sync-server.mjs | — |
| server/write-queue.mjs |  |
| server/ws-auth.mjs | — |


---

## Связанные материалы

- [Разработчикам: ворота качества и CI](./dev-ci.md)
- [Разработчикам: генераторы и сгенерированные файлы](./dev-generators.md)
- [Разработчикам: тесты](./dev-testing.md)
- [Разработчикам: обзор и слои](./dev-overview.md)

[← Все материалы](./README.md)
