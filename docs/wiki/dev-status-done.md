<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Завершённые задачи

> Раздел: **Состояние разработки** · Статус: needs-check · Теги: состояние разработки, прогресс

Недавно закрыто (серия security/resilience-фиксов):

- Sidecar: loopback-биндинг, Bearer, SSRF-allowlist (W4-025).
- LLM tool args: отклонение невалидного JSON (W8-009).
- PII-редэкция: трейсы, память, чат, tool-вывод, event log.
- Dangerous-блоклист: CSAM/самоповреждение/оружие/наркотики (W4-026).
- sync-server: XFF trust opt-in, WS maxPayload, SIGTERM drain (W6-024/029/030).
- SSRF-гвард http-адаптера (W6-021); jitter retry-after (W6-016).
- Перцентили с интерполяцией (W6-034); counters persist (W6-033); budget retention (W6-032).

---

## Связанные материалы

- [Активная разработка](./dev-status-active.md)
- [Критические проблемы](./dev-status-critical.md)
- [Технический долг](./dev-status-debt.md)
- [Отложенные баги](./dev-status-bugs.md)
- [Состояние тестирования](./dev-status-testing.md)
- [Документация](./dev-status-docs.md)
- [Заблокированные задачи](./dev-status-blocked.md)
- [Roadmaps](./dev-status-roadmaps.md)
- [MD и другие файлы от разработки](./dev-status-files.md)

[← Все материалы](./README.md)
