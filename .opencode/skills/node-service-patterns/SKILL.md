---
name: node-service-patterns
description: 'Паттерны Node.js-сервисов: серверы, MCP, скрипты, асинхронность, ошибки. Использовать при написании Node-кода.'
---

# Паттерны Node.js

- **Модульность**: ESM (`"type": "module"`), `import`/`export`.
- **Ошибки**: всегда обрабатывать промисы (`await` + try/catch); не оставлять неперехваченных rejections.
- **HTTP-серверы**: нативные `node:http` для лёгких сервисов; express/fastify только при необходимости.
- **MCP-сервер**: `@modelcontextprotocol/sdk` — `McpServer` + `StdioServerTransport`.
- **Конфигурация**: JSON-файлы с безопасной загрузкой (try/catch, дефолты).
- **Пути**: `node:path` + `import.meta.url` для `__dirname`-эквивалента.
- **Дочерние процессы**: `node:child_process` с `promisify(execFile)`.
- **Производительность**: не блокировать event loop; большие вычисления — в отдельный процесс/задачу.
- **Память**: лимиты, стриминг вместо загрузки файлов целиком, где возможно.

## Purpose

Use for: написания Node.js-сервисов, MCP-серверов и CLI-скриптов — чтобы не было неперехваченных промисов, блокировок event loop и проблем с путями на Windows.

## Examples

- `напиши MCP-сервер на @modelcontextprotocol/sdk`
- `rewrite this script to use execFile instead of exec`
- Ожидаемый вывод: ESM, `await` + try/catch, `node:path`, SQLite/KV вместо JSON-файла как БД.

## Error handling

Все промисы должны быть обработаны: `await` в try/catch или `.catch()`. Ошибку логируй с контекстом, но без секретов. При сбое дочернего процесса возвращай Result, а не молчаливое undefined.

## Limitations

Не описывает транзакции СУБД и развёртывание в Docker; для тяжёлых вычислений нужны отдельные воркеры.

## Troubleshooting

Unhandled rejection — найди пропущенный `await`. Проблема с путями — проверь `import.meta.url` и кавычки вокруг путей с пробелами.
