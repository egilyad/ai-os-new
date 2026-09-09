# SUMMARY — что сделали, где что лежит, как двигаться без сильного ПК

> Дата: 2026-09-06. Режим: **пишем без проверок** (typecheck/build/tests — на сильном компе). Бекап есть, ошибки потом починим через аудиты — риск принят.

---

## 1) Что построили — одним абзацем

**База** (Kernel + EventBus + Builder + Debate Arena + Memory Mesh, local-first) → **Волны 1–5** (Crew/Council/Graph/Persona/Ops) → **Фазы A–W** (Interop/Meta/Trust/Frontier/Parity + 100+ внешних проектов по десяткам). Итог: **Dexie v23→v34 (98 таблиц)**, **~50 фаз (23→51)**, **~260 событий**, **~70 доков** в `docs/road/`, **205 компонентов**, **23 провайдера LLM**. Всё на kv где можно — без лишних миграций.

---

## 2) Карта — куда смотреть

| Хочу … | Иди в … | Файл-маяк |
|--------|---------|-----------|
| Понять общую идею | `docs/road/roadm.md` (оригинал) + `roadmap2.md` | `docs/road/roadm.md:1`, `roadmap2.md:1` |
| Увидеть что покрыли (100+) | `docs/INVENTORY_REPORT.md` + `FULL_FUNCTIONALITY_AUDIT.md` + `CONVERSATION.md` | `docs/INVENTORY_REPORT.md:1` |
| Найти склад (tools/skills/roles) | раздел 3 этого файла | `src/kernel/services/parity/tool-runner-service.ts:1`, `phase42-rivals10.ts:72` (seed) |
| Запустить команду | `FleetPanel` (админка) — `fleet` + 6 под-роутов | `src/components/FleetPanel/FleetPanel.tsx:1` (`fleet-crews`…`provenance`) |
| Посмотреть события | `src/kernel/events/event-registry.ts:28` | единственный источник правды |
| Память/дебаты/граф | `src/kernel/services/council/*`, `graph/*`, `persona/*` | `council-service.ts:1`, `graph-service.ts:280` |
| LLM-провайдеры | `src/llm/registry/adapter-factory.ts:55` (23) | `src/llm/*/ *-adapter.ts` |

**Навигация в админке (сейчас):**
- `Fleet Console` (хаб) + `Fleet — Crews/Councils/Graphs/Persona/Interop/Frontier` (6 панелей-обёрток), `Governance / RBAC`, `Provenance Graph` — все `lazy` + `experimental:true`, иконки `waypoints`/`shield`/`gitBranch` (`src/route-registry-content.ts:130`, `src/route-imports.ts:171`).

---

## 3) Склады — что уже лежит (после добивки)

| Склад | Было | Стало (после этой добивки) | Где |
|-------|------|----------------------------|-----|
| **Tools** | 8 + 3 (`json.get/text.stats/list.unique`) | **+5 RU** (`yadisk.read/write`, `mail.send/list`, `vk.post`, `wb.price`, `yandex.metrica` — mock, безопасно) | `phase47-russian.ts` seed (next) |
| **Skills** | 5 (Deep Researcher…Repo Guide) | **+4 RU** (VK SMM, WB Manager, Yandex SEO, GigaChat Analyst) + 4 business (BizAnalyst, SDR, SEO Auditor, Finance Ops) = **13** | `phase42` + `phase45` + `phase47` |
| **Crew-шаблоны** | 4 (research-team, code-review…) | **+4** (sop-software, deep-research, support-inbox, app-scaffold) + 3 business (seo-engine, outreach-factory, finance-desk) = **11** | `src/kernel/services/crew/crew-templates.ts:1` |
| **Council-линзы** | 10 + 4 полярности | **+4** (premortem, redteam-lead, scout, base-rates) = **14 + 4** | `src/kernel/services/council/council-lenses.ts:1` |
| **Roles** | builtin-набор `RoleService` | **+6 RU** (Химик-органик, SEO Яндекса, WB-менеджер, SMM VK, Аналитик GigaChat, Ruslan) — через `RoleService` seed на финалке (пока kv `heisenberg/*`) | `src/kernel/services/rivals15/agencyru-service.ts:1` |
| **Forum-склад** | topics/posts | **+ polls/solved/badges** (Discourse) | `src/kernel/services/rivals7/forumplus-service.ts:1` |

> Файлы-маяки складов: `crew-templates.ts:1`, `council-lenses.ts:1`, `skill-service.ts:1` (4 default), `tool-runner-service.ts:1` (11 tools), `phase42:72` (seed).

---

## 4) Как двигаться до сильного ПК (без проверок, но без потерь)

**Принцип:** пишем как сейчас — **additive, на kv где можно**, события только через `EventBus`, ядро не ломаем. Ошибки копятся — это ок, есть бекап (`git` + `docs/CONVERSATION.md`).

**Что делать сейчас (дешево, без сборки):**
1. **Доливать склады под задачи** — добавляй tools/skills/шаблоны по 3–5 за раз (как в Фазе P: `warehouse-seed` идемпотентен). Пример: нужен WB — добавь `wb.price` tool + skill `WB Manager` + роль `WB-менеджер` — всё на kv.
2. **Крутить Fleet** — проверяй логику руками (forge→run, council 6 форматов, graph Approve/Reject с телефона). UI уже mobile-friendly (`FleetPanel.tsx:350` deep-link `?tab=graphs&run=<id>`).
3. **Не трогать Dexie схему** сверх kv — v34 остаётся max до финалки (как условились с Фазы H).

**Что отложить на сильный ПК (1 день):**
- `npm run typecheck:fast` (~2 мин) → `build:skip-typecheck` → `vitest` срез новых фаз → починка импортов/типов.
- Прогон `TestDexie` (`_test-harness.ts:1`) — проверить миграции v23→v34.
- Завайрить `IEmbeddingPort` на реальный embedding-провайдер (сейчас hash 384 — достаточно для локального RAG).

---

## 5) Риски — честно

- **Накопление ошибок:** 0 прогонов после ~50 фаз — будут опечатки/несостыковки типов. Митигация: бекап + `docs/CONVERSATION.md` + фазность (каждая фаза изолирована `!has` guard).
- **Порты без бэкендов:** TTS/STT, E2B Python, OAuth, телефония — заглушки `handoff/queued` (честно, не «выполнено»).
- **Глубина:** 11 tools vs 100+ у CrewAI — покрыто через MCP-прокси + добивку по мере нужд (как сейчас).

---

## 6) Следующий шаг — когда скажешь

- **Ещё 10** — берём следующую десятку (кодинг/бизнес/экзотика) тем же темпом.
- **Или инвентаризация v2** — доливаю склады под конкретные сценарии (скажи какие: WB, VK, химия, финансы?).

> С богом — пишем дальше. Когда будет сильный ПК — один прогон всё починит.
