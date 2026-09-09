**Финальный роадмап для SuperAgents OS**  
(для передачи coding-агенту)

Роадмап составлен с учётом текущего состояния проекта (Kernel + EventBus + Event Sourcing + Cognitive Builder + Debate Arena + Memory Mesh + local-first) и всех изученных проектов.

---

### Общие принципы (обязательно соблюдать)

- Всё остаётся **local-first** (IndexedDB, Web Workers, данные не уходят без явного согласия).
- Все новые модули общаются **только через EventBus**.
- Сохраняем текущую архитектуру: Kernel → Services → Panels.
- Новые возможности добавляем как сервисы + события, а не ломаем ядро.
- Mobile-friendly интерфейс и возможность удалённого доступа — важное требование.

---

### Волна 1 — Фундамент команд и удобства (делать в первую очередь)

**Цель:** сделать создание и запуск команд агентов таким же удобным, как в CrewAI, но в нашей архитектуре.

1. **Crew + Task + Process слой**
   - Сущности: `AgentRole` (Role + Goal + Backstory), `Task` (description + expected_output + schema), `Crew`, `Process` (Sequential / Hierarchical).
   - Хранение в IndexedDB.
   - События: `crew:created`, `crew:started`, `task:completed` и т.д.
   - Источники идей: CrewAI, kiro-agents, agems.

2. **Agent Card / Identity**
   - Стандарт описания личности агента (имя, роль, стиль, голос, навыки, ограничения).
   - Экспорт / импорт в JSON.
   - Источник: openagent.

3. **Agent Forge**
   - По текстовому описанию цели LLM предлагает состав команды (роли, задачи, process).
   - Пользователь может отредактировать и запустить.
   - Источник: Captain Claw.

4. Удобный high-level API + набор готовых шаблонов команд.

---

### Волна 2 — Продвинутая Debate / Council система

**Цель:** превратить текущую Debate Arena в одну из самых сильных систем дебатов.

5. Библиотека аналитических линз + полярности (Сократ, Фейнман, Сань-Цзы и т.д.).
6. Каналы коммуникации: **Forum** (общее) + **Whisper** (приватные сообщения между агентами).
7. Double-blind режим + отдельный Fact-gathering этап + слепой судья.
8. Multi-Judge (несколько независимых судей) + Audience Voting (голос пользователя mid-debate).
9. Отдельные роли: Researcher / Fact Checker.
10. Стандартные фазы: Proposal → Debate → Consensus.
11. Возможность запускать дебаты как часть State Graph.

Источники: Council of High Intelligence, ai-council, cross-review, MAD-engine, Deb8flow, debate-agents.

---

### Волна 3 — Надёжная оркестрация и состояние

**Цель:** длинные и сложные процессы должны быть надёжными и управляемыми.

12. **State Graph runtime** (nodes + edges + conditional routing) поверх текущего Cognitive Builder.
13. **Durable Checkpointing + Time-travel** (использовать и развить текущий Event Sourcing).
14. Мощный Human-in-the-loop: interrupt, просмотр/редактирование состояния, approve/reject.
15. Несколько режимов оркестрации (минимум 4–6): Sequential, Hierarchical, Council, Swarm, Graph, Forge и т.д.
16. Checkpoint-driven циклы + периодическая Reflection.
17. **Agent Notes / Decision Log** — фиксация «почему приняли решение» и «от чего отказались».

Источники: LangGraph, Google ADK, Captain Claw, botference, deepseek-harness, Letta.

---

### Волна 4 — Память, личность и общий контекст

**Цель:** агенты должны помнить, иметь характер и работать как команда с общим контекстом.

18. Усиление Memory Mesh:
   - Простой Long-term Memory API
   - Иерархия памяти (core / recall / archival) по мотивам Letta
   - Графовая память

19. **Person / Voice Profile** — дистилляция стиля и суждений пользователя/эксперта.
20. Более глубокая модель персоны (черты, убеждения, стиль общения) — идеи из TinyTroupe.
21. **Shared Workspace / Shared Context** для команды агентов (общая память, файлы, credentials, история).
22. Сущность **Goals** (цели команды и отдельных агентов).

Источники: Letta, MemMachine, memorykeep, Distilly, TinyTroupe, humble, GUMMY-OS.

---

### Волна 5 — Управление, инструменты, наблюдаемость и мобильность

**Цель:** система должна быть управляемой, безопасной, наблюдаемой и удобной с телефона.

23. Иерархия агентов (CEO → subordinates) + бюджеты + жёсткий Audit Log.
24. Полноценная поддержка **MCP** как стандарта инструментов.
25. Browser Use + Computer Use через безопасные песочницы (паттерны E2B + browser-use + os-ai-computer-use).
26. Усиление Cognitive Builder: визуальный граф → сразу исполняемый runtime (идеи draw-your-agents).
27. Live Timeline + Graph мониторинга флота и миссий.
28. Максимальная аудируемость и прозрачность действий (философия HexorOS).
29. Skills marketplace + манифесты навыков.
30. **Mobile & Remote Access**:
   - Нормальная работа основных сценариев с телефона
   - Возможность подключения к своей локальной ОС с мобильного
   - Уведомления + быстрые HITL-действия (Approve / Reject / короткий ответ)
   - Источник вдохновения: Mistral Vibe (удобство с телефона)

Источники: Paperclip, E2B, browser-use, Langfuse, agent-swarm-dashboard, HexorOS, Mistral Vibe.

---

### Порядок реализации для coding-агента

**Сейчас (Волна 1 + начало Волны 2):**
1. Crew + Task + Process + Agent Card
2. Agent Forge
3. Большое усиление Debate Arena (линзы, полярности, Forum/Whisper, Multi-Judge, Fact-Checker, Double-blind)

**Следом (Волна 3):**
4. State Graph + Checkpointing + мощный HITL
5. Несколько режимов оркестрации

**Потом:**
6. Память (Letta-style + graph) + Person Profile + Shared Context
7. Иерархия, бюджеты, MCP, песочницы, мобильный доступ и мониторинг

---

### Критерии готовности каждой волны

- Есть работающие примеры использования
- Всё идёт через EventBus
- Данные персистятся локально
- Есть базовые тесты и понятная документация в `/docs` или `AGENTS.md`
- Основные действия доступны с мобильной ширины экрана

---

Этот документ можно целиком отдавать coding-агенту как основной план развития.