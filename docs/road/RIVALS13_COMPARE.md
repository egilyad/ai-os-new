# Сравнение 1-к-1, бизнес-агенты: Paperclip/AGEMS + 8 похожих

Дата: 2026-09-06. Фаза S. Без проверок. Всё на kv (v34 max).

## 1. Paperclip — zero-human company OS
- **У них:** org chart (CEO→VP→IC), budgets per agent/team, governance (hire/approve), goal → tasks auto-split, tickets с трассировкой, Cliphub templates, plugin hub, multi-company изоляция.
- **Было у нас:** hierarchyService (CEO→subordinates) + budgets + audit, but org chart flat, tickets only via supportService.
- **Дописываем (S.1):** `OrgChartService` (дерево должностей с roleId, hiring flow approve, budget per node), `BizTicketService` (goal→ticket split, trace).

## 2. AGEMS — Agent OS for business
- **У них:** org chart side-by-side humans+agents, real-time channels, agent meetings (agendas/voting), human-in-loop per tool, N8N workflows, dashboard widgets (SQL/REST), Survival show ($1000 runway).
- **Было у нас:** channels via gateway, but no meeting agendas, no per-tool HITL levels.
- **Дописываем (S.1):** `MeetingService` (agenda, voting, minutes), `HITLLevelsService` (autopilot/supervised/manual per tool).

## 3. Lindy
- **У них:** trigger marketplace (email/slack/cal), 200+ integrations, playbooks.
- **Было:** trigger via integrationsService (20 apps) but no playbook library.
- **Дописываем (S.1):** `PlaybookService` (shareable playbooks: trigger + steps + expected output).

## 4. SmythOS
- **У них:** skill store с версионированием, agent compose (skills → agent), runtime sandbox, skill marketplace.
- **Было:** SkillMarket basic, no compose.
- **Дописываем (S.1):** `ComposeService` (compose skills into agent card, version pin).

## 5. Dust
- **У них:** data sources (Notion/Slack/GDrive) с sync, assistants with data source scoping, conversation with citations.
- **Было:** knowledgeSources flat, no source sync status.
- **Дописываем (S.2):** `DataSourceService` (sources with sync state, assistant→source binding, citation surfacing).

## 6. Relevance AI
- **У них:** Bulk runs (CSV → agent batch), transformations, sub-agents.
- **Было:** forEach in GumService but no CSV bulk.
- **Дописываем (S.2):** `BulkService` (CSV upload → queued runs, mapping columns → inputs, results CSV export).

## 7. Bardeen
- **У них:** scraper + automation playbooks, autobooks (trigger → scrape → write).
- **Было:** scraper via http.fetch only.
- **Дописываем (S.2):** `ScraperService` (CSS selector extract, pagination, autobook schedule).

## 8. Relay.app
- **У них:** human-in-loop steps inside automations (approve/edit), paths.
- **Было:** HITL only in graphs, not in automations.
- **Дописываем (S.2):** `RelayService` (automation with human gates, paths, resume).

## 9. Taskade / CrewAI business packs
- **У них:** SEO: keyword cluster → brief → draft → interlink → schema; Outreach: lead → enrich → score → email → follow-up.
- **Было:** content-forge template basic, no SEO cluster/interlink, no outreach scoring.
- **Дописываем (S.3):** Business packs (see below) — `SeoPack`, `OutreachPack`.

## 10. Voiceflow/Support extended (business site specific)
- **У них:** site audit (Core Web Vitals, schema, noindex drift), content calendar, finance model.
- **Было:** writerService + deckService but no site audit drift monitor, no calendar.
- **Дописываем (S.3):** `SiteAuditService` (baseline SEO contract, diff Critical/Warning/Info), `CalendarService`, `FinanceModelService`.

## Бизнес-паки (S.3) — что умеют агенты необычного (помимо SEO)

- **SeoPack (30x-seo style):** keyword research (cluster), content brief with SERP, draft with schema, interlink map, backlink outreach, drift monitor (noindex/schema/canonical), weekly report.
- **OutreachPack:** lead discovery (Apollo/Serp), enrich (website intel), score (ICP), cold email writer with style clone, follow-up cadence, reply classifier.
- **FinancePack:** P&L per agent, runway tracker (à la Survival $1000), invoice generation, budget alerts per goal.
- **SupportPack (already есть но усиливаем):** macros + bot-draft + handoff + CSAT.

## Карта реализации (Фаза S, phase45)
- События: `org:*`, `bizticket:*`, `meeting:*`, `hitl:*`, `playbook:*`, `compose:*`, `datasource:*`, `bulk:*`, `scraper:*`, `relay:*`, `seo:*`, `siteaudit:*` (~12).
- Сервисы: orgChart/bizTicket, meeting/hitl, playbook/compose, dataSource/bulk, scraper/relay, seo/outreach/siteAudit/calendar/finance → phase45.
- Склады: 4 новых skill (BizAnalyst, SDR, SEO Auditor, Finance Ops) + 3 crew-шаблона (seo-engine, outreach-factory, finance-desk) + 2 роли (Head of SEO, SDR Manager).
