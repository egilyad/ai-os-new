# MOBILE WEB — Phase 1: Full Responsive Audit (STATICALLY VERIFIED)

> Дата: 2026-09-07. Scope: весь `src/route-registry*` ~226 nav ids, AppLayout/Sidebar, все панели. Метод: `width:*px/min-width/grid/flex` grep (~280 hits) + route/component walk. Статус: `STATICALLY VERIFIED`.

## TL;DR — Kernel уже mobile-friendly

`Kernel/DI/EventBus/Zustand/Dexie` от экрана не зависят — аудит только UI shell/panels.

---

## A–E карта (A=already mobile-friendly → E=broken)

| Категория | Смысл | Кол-во | Примеры (file:line) |
|-----------|-------|--------|---------------------|
| **A — Fully responsive** | `flex-wrap`, `auto-fit minmax≤240`, без fixed px | ~40 панелей | `TechniquePanels/*.tsx:186` `repeat(auto-fit,minmax(240px,1fr))` (50 файлов) · `FleetPanel.tsx:175` `flexWrap:wrap` tabs `overflowX:auto` · `ChatPanel/ChatSidebar.tsx:21` `showSidebar` toggle |
| **B — Minor tweaks** | 280–320px sidebar, один `overflow:hidden`, `2rem` padding | ~60 панелей | `AppLayout.tsx:46` `isDesktop>=768` + hamburger `Menu` + `Sidebar.tsx:61` overlay `fixed inset:0 z99 + aside z100 display:mobileMenuOpen?flex:none` — **pattern ok** · `styles/layout.css:10` `--sidebar-width:280px` + `@media(max-width:768px){display:none}` override inline · `DebatePanel.tsx:56` `useMediaQuery('(max-width:767px)')` + `DebateTabContent.tsx:26` `showSidebar=false` · `Persona*`, `Knowledge`, `Health` |
| **C — Needs rework** | 300–500px min/inspector, таблицы без `overflow-x:auto`, модалка 850px | ~30 панелей | `ToolsPanel.tsx:275` `gridTemplateColumns:'1fr 500px'` — 500px inspector breaks <900px · `MemoryPanel.tsx:269` `1fr 360px` · `WorkflowPanel.tsx:96` `320px 1fr` · `RouterTraceView.tsx:114` `380px 1fr` · `TracesPanel.tsx:371` `150px 1fr 140px 120px 180px 100px` 6-col · `panels.css:575` `minmax(400px,1fr)` (375px fail, надо 280) · `RoleEditorModal.tsx:53` `width:850` |
| **D — Desktop-only** | React Flow canvas / 3-pane / 380px trace, touch target tiny | 5 панелей | `DslCanvas.tsx:3,264` ReactFlow · `DependencyMapPanel.tsx:2,152` ReactFlow · `CognitiveBuilder.tsx:314` `280px 1fr 340px minHeight:500` · `ArgumentGraphPanel.tsx:525` ReactFlow `minWidth:220 maxWidth:280` · `CognitiveMicroscope.tsx:26` `320px 1fr` |
| **E — Broken** | 1000×1000 fixed SVG / dynamic width explode | 2 панели | `SimulationPanel.tsx:171` `SVG viewBox 0 0 1000 1000 height:380` rooms absolute `x:50 y:50 w:900` circles `r:16` 8px text unreadable <375px · `PermissionMatrix.tsx:450` `200px repeat(${roles.length},60px)` explodes + no `overflow-x:auto` |

---

## Детали по областям (из route-registry ~226 ids: 9 секций CORE/SYSTEM/CONTENT)

### Shell / Navigation — B

- `AppLayout.tsx:108,189,208,319,343` — `isDesktop = innerWidth>=768` + RAF resize, hamburger ok, `main-content flex:1 minHeight:0 overflow-y:auto` ok, gradients `display:isDesktop?'block':'none'`.
- `Sidebar.tsx:61-83` — overlay+aside fixed correct, collapse only desktop, `layout.css:10,20,24` collapsed 80px, `@media 768` display:none overridden inline.
- `layout.css:30` `.content-header padding:0 2rem` — no mobile query → overflow. `panels.css:1307 width:280px` drawer.

**No `ResponsiveShell` — `Glob **/ResponsiveShell*` NO FILE.** Responsiveness ad-hoc (`isDesktop` / `useMediaQuery`).

### Fleet — B (Frontier/Rivals C)

- Tabs `FleetPanel.tsx:175` `overflowX:auto` good; cards generic `card` style; Rivals 30+ buttons `flexWrap:wrap` dense → C.

### Simulation Lab — E (но 1000×1000 intentionally — pinch-zoom needed)

- `SimulationPanel.tsx:169` `flex:'1 1 420px' minWidth:320` + `flex:'1 1 260px'` `flexWrap:wrap` helps, but SVG height fixed 380, text 8px <375px fail.

### Graph / Cognitive Builder — D

- `CognitiveBuilder.tsx:314` + `DslCanvas` + `DependencyMap` + `ArgumentGraph` — React Flow needs full-screen on mobile, `touch-target` tiny, `Controls` not bottom-sheet.

### Councils/Debates — B

- `DebatePanel` mobile query handled, `TournamentPanel.tsx:50 minWidth:200` ok.

### Timeline — B/C

- `EventsTimeline.tsx:537 height:200` fixed, `TracesPanel 6-col` C.

### Memory — C

- `MemoryPanel.tsx:269` 360px split → stacked on mobile.

### Persona/Agent — B

- `PersonaMarketplace/Picker/Mixer` `minmax(240px)` responsive.

### Dialogs/Modals — C

- `ModalShell.tsx`, `ProviderDetailModal.tsx:111 role=dialog`, `panels.css:603 max-width:620/480/700/900` good, but `RoleEditorModal 850` fixed → `90vw`.

### Tables — C/D

- `PermissionMatrix` dynamic, `TracesPanel` 6-col → `overflow-x:auto` + sticky first col.

### SVG — E only SimulationPanel

---

## Top 10 fix priority (line-no, same as audit)

1. `ToolsPanel.tsx:275` `1fr 500px` → `minmax(0,1fr)` + drawer `@media(max-width:900px){1fr}` 
2. `SimulationPanel.tsx:171` SVG → `height:auto aspect-ratio:1` + `overflow-x:auto` + zoom/pan
3. `CognitiveBuilder.tsx:314` `280px 1fr 340px` → `@media(max-width:768px){1fr}` stacked
4. `TracesPanel.tsx:371` 6-col → wrapper `overflow-x:auto` + mobile `150px 1fr 100px`
5. `PermissionMatrix.tsx:450` → parent `overflow-x:auto` + sticky first col
6. `RouterTraceView.tsx:114` `380px 1fr` → `@media(max-width:768px){1fr}` + collapsible
7. `MemoryPanel.tsx:269` `1fr 360px` → stacked
8. `panels.css:575` `minmax(400px,1fr)` → `minmax(280px,1fr)` for 375px
9. `RoleEditorModal.tsx:53 width:850` → `max-width:90vw`
10. **Add `ResponsiveShell`** `src/components/Layout/ResponsiveShell.tsx` `useBreakpoint()` consolidate `isDesktop` prop-drilling

---

## Responsive Shell (предложение, без второго приложения)

```
SuperAgents OS
  ├─ Desktop: [Sidebar 280px] [Main Panel] [Inspector 360px]  (--sidebar-width)
  └─ Mobile:  [Header + hamburger] [Main Panel stacked] [Inspector→drawer] [Bottom Nav]
              dialogs → bottom sheets, 44px touch target, 280px min card
```

```tsx
<ResponsiveShell> // useBreakpoint 768
  <Fleet /> <Councils /> <Memory /> <Graphs /> <Simulation />
</ResponsiveShell>
```

**Цель Phase 2–7:** основные действия с телефона (создать/запустить агента, Crew/Council, Timeline, Memory, Simulation, настройки) — `Graph Builder → Desktop recommended` честно, проверка на телефоне после сильного ПК.

---

## Phase 2–7 (как в плане)

```
Phase 1 Audit ✅ (этот файл)
  ↓
Phase 2 Responsive Foundation (ResponsiveShell + useBreakpoint + --sidebar-width → mobile)
Phase 3 Navigation & Shell (sidebar 240→bottom nav + drawer, header, 44px)
Phase 4 Core Panels (Fleet/Councils/Memory/Timeline/Simulation → stacked, 280px min, overflow-x)
Phase 5 Complex Panels (React Flow → full-screen + bottom sheet controls)
Phase 6 Touch/Viewport Hardening (hover→tap, portrait/landscape, 320/375/768)
Phase 7 Mobile Readiness Audit → real phone Chrome test (сильный ПК)
```

С богом — audit static, без ядра. Дальше Phase 2 Foundation?
