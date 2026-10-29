<!-- Ответ ассистента opencode: 2026-10-29-140-нашёл-причину-syncfrombuiltinwiki-пишет-только-стр.md (scripts/export-opencode-turns.mjs). -->

# Ответ 140 · 2026-10-29

> Сессия: ses_e77960396ffeIfcCtCDoHVhKns · Раздел: **Сессии (opencode)** · Статус: verified

Нашёл причину: `syncFromBuiltinWiki` пишет **только страницы**, связи (`links`) не создаёт — поэтому граф без рёбер. Смотрю, как ingest-сервис строит связи, чтобы переиспользовать.
