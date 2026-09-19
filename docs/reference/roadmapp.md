# SuperAgents OS — PROJECTS / AGENT WORKSPACE ROADMAP MAP

> Цель: дать агентам возможность **самостоятельно создавать реальные проекты внутри SuperAgents OS**, начиная с HTML/CSS/JS сайтов и Python-программ.
>
> Внутренняя валюта / credits / экономическая модель **на этом этапе НЕ реализуются**.
>
> Главный принцип: **не OpenCode строит проект за агентов, а сами агенты получают инструменты и работают внутри контролируемой песочницы SuperAgents OS.**

---

# 0. Главная идея

SuperAgents OS получает новый системный контур:

```text
                         SUPERAGENTS OS
                                │
                    ┌───────────┴───────────┐
                    │       PROJECTS        │
                    └───────────┬───────────┘
                                │
                    ┌───────────┴───────────┐
                    │       PROJECT         │
                    │                       │
                    │  Workspace            │
                    │  Files                │
                    │  Agents               │
                    │  Tasks                │
                    │  Runs                 │
                    │  Artifacts            │
                    │  Preview              │
                    └───────────┬───────────┘
                                │
                         AGENT RUNTIME
                                │
             ┌──────────────────┼──────────────────┐
             │                  │                  │
          Files              Browser            Commands
             │                  │                  │
             └──────────────────┼──────────────────┘
                                │
                         PROJECT SANDBOX
                                │
                  ┌─────────────┴─────────────┐
                  │                           │
               Website                    Python App
             HTML/CSS/JS                 Python files
```

---

# 1. PROJECTS — новая системная сущность

Добавить отдельный компонент/панель:

```text
Projects
```

Projects становится точкой входа в создаваемые агентами проекты.

Пример:

```text
Projects

┌─────────────────────────────────────┐
│ 🌐 Water Guide                      │
│ Website · HTML/CSS/JS               │
│ Last activity: 2 min ago            │
│ Agents: 4                           │
│ Status: Building                    │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 🐍 Data Analyzer                    │
│ Python                              │
│ Last activity: 1 hour ago           │
│ Agents: 2                           │
│ Status: Ready                       │
└─────────────────────────────────────┘

[ + New Project ]
```

## Project entity

Минимальная модель:

```text
Project
├── id
├── name
├── description
├── type
├── status
├── workspace
├── createdAt
├── updatedAt
├── agents
├── tasks
├── runs
└── metadata
```

Типы на первом этапе:

```text
website
python
```

Архитектуру сделать расширяемой:

```text
ProjectType
├── website
├── python
├── node
├── react
├── data
├── automation
└── future...
```

Но реализовать сейчас только необходимые типы.

---

# 2. PROJECT WORKSPACE

Каждый проект получает собственную изолированную рабочую область.

Пример:

```text
projects/
    project-123/
        project.json

        src/
        public/
        assets/

        index.html
        styles.css
        script.js
```

Для Python:

```text
projects/
    project-456/
        project.json

        main.py
        requirements.txt
        src/
        data/
```

Главный принцип:

> Агент работает с файлами проекта, а не со всей файловой системой ОС.

---

# 3. AGENT RUNTIME

Это главный новый слой.

Не OpenCode.

Не внешний coding agent.

А собственный контролируемый runtime SuperAgents OS.

```text
Agent
  ↓
Task
  ↓
Agent Runtime
  ↓
Tools
  ↓
Project Workspace
```

Runtime отвечает за:

* запуск агента;
* получение задачи;
* предоставление контекста;
* выдачу инструментов;
* выполнение tool calls;
* запись событий;
* сохранение результата;
* остановку/возобновление;
* ограничения доступа.

---

# 4. AGENT PROJECT TOOLS

На первом этапе нужны базовые инструменты.

## Files

```text
list_files
read_file
write_file
create_file
delete_file
move_file
create_directory
```

## Editing

```text
replace_text
patch_file
```

## Project inspection

```text
inspect_project
inspect_structure
inspect_dependencies
```

## Execution

Для website:

```text
run_dev_server
stop_dev_server
```

Для Python:

```text
run_python
```

Позже:

```text
run_command
```

Но `run_command` должен быть отдельно защищён и ограничен sandbox.

---

# 5. WEBSITE SANDBOX

Первый реальный showcase.

Создание:

```text
New Project
    ↓
Website
    ↓
Create
```

Автоматическая структура:

```text
index.html
styles.css
script.js
assets/
```

Агент получает задачу:

> Build a landing page for X.

И самостоятельно:

```text
read
→ plan
→ create files
→ edit files
→ run preview
→ inspect
→ fix
→ repeat
```

---

# 6. LIVE WEBSITE PREVIEW

Внутри проекта появляется:

```text
Preview
```

Например:

```text
┌─────────────────────────────────────────┐
│ Project: Water Guide                    │
├─────────────────────────────────────────┤
│                                         │
│            WEBSITE PREVIEW              │
│                                         │
│       [ rendered website ]              │
│                                         │
└─────────────────────────────────────────┘
```

Агент должен иметь возможность увидеть результат своей работы.

Это важно.

Нельзя делать:

```text
Agent writes HTML
       ↓
Done
```

Нужно:

```text
Agent writes HTML
       ↓
Server
       ↓
Browser
       ↓
Rendered result
       ↓
Agent inspection
       ↓
Fix
```

---

# 7. BROWSER TOOL

Добавить controlled browser capability.

Минимально:

```text
open_project_preview
get_page
inspect_page
get_text
get_title
get_links
take_screenshot
```

Позже:

```text
click
type
scroll
inspect_element
```

Это позволит агенту тестировать созданный сайт.

---

# 8. WEBSITE AGENT LOOP

Первый полноценный автономный сценарий:

```text
USER

"Build a website about water purification."

        ↓

DIRECTOR

Creates Project

        ↓

RESEARCH AGENT

Researches topic

        ↓

DESIGN / CONTENT AGENT

Creates structure

        ↓

DEVELOPER AGENT

Creates HTML/CSS/JS

        ↓

PREVIEW

Website starts

        ↓

QA AGENT

Inspects website

        ↓

BUGS

        ↓

DEVELOPER AGENT

Fixes files

        ↓

QA

Checks again

        ↓

READY
```

---

# 9. MULTI-AGENT PROJECT TEAM

Проект должен иметь собственных назначенных агентов.

```text
Project
│
├── Director
├── Research Agent
├── Developer Agent
├── Designer Agent
├── Content Agent
└── QA Agent
```

Но не создавать жёсткую архитектуру только под эти роли.

Использовать существующую Agent Registry / Role / Persona / Skills / Tools систему.

То есть:

```text
Project
    ↓
Agent IDs
    ↓
Agent Registry
    ↓
Agent configuration
```

---

# 10. PROJECT TASKS

Каждая работа агента должна быть отдельной Task.

```text
Task
├── id
├── projectId
├── agentId
├── title
├── description
├── status
├── priority
├── createdAt
├── startedAt
├── completedAt
└── result
```

Статусы:

```text
queued
running
blocked
completed
failed
cancelled
```

---

# 11. PROJECT RUNS

Task и Run разделить.

Task:

> Build homepage.

Run:

> конкретное выполнение этой задачи.

Это позволит видеть историю:

```text
Build homepage

Run #1
Failed

Run #2
Completed

Run #3
Improved
```

---

# 12. FULL OBSERVABILITY

Это особенно важно для SuperAgents OS.

Каждое действие агента должно быть видно.

```text
Developer Agent

10:31:04
Task started

10:31:07
read_file("index.html")

10:31:09
write_file("index.html")

10:31:15
write_file("styles.css")

10:31:22
run_dev_server()

10:31:30
open_project_preview()

10:31:34
inspect_page()

10:31:40
Found issue:
mobile navigation broken

10:31:44
patch_file("styles.css")

10:31:51
QA passed
```

Никакого:

```text
Agent is working...
```

без объяснения происходящего.

---

# 13. PROJECT EVENT MODEL

Использовать существующий EventBus.

Новые события:

```text
project.created
project.updated
project.deleted

project.task.created
project.task.started
project.task.completed
project.task.failed

project.run.started
project.run.completed
project.run.failed

project.file.created
project.file.updated
project.file.deleted

project.agent.started
project.agent.stopped

project.preview.started
project.preview.stopped

project.artifact.created
```

Не создавать второй глобальный bus.

---

# 14. PROJECT FILE HISTORY

Не обязательно полноценный Git на первом этапе.

Но система должна знать:

```text
who changed what
when
why
```

Например:

```text
styles.css

Changed by:
Developer Agent

Task:
Fix mobile layout

Time:
20:42

Previous version:
available
```

Это позволит безопасно откатывать агентские изменения.

---

# 15. ARTIFACTS

Проект должен иметь понятие результата.

```text
Artifact
├── website
├── python_script
├── report
├── image
├── dataset
└── future...
```

Для website:

```text
Artifact:
Website

Files:
index.html
styles.css
script.js
assets/
```

Для Python:

```text
Artifact:
Python Program

Files:
main.py
src/
requirements.txt
```

---

# 16. PYTHON SANDBOX

После website добавить второй тип:

```text
New Project
    ↓
Python
```

Минимально:

```text
main.py
src/
data/
requirements.txt
```

Агент может:

```text
write_file()
read_file()
run_python()
inspect_output()
fix()
run_again()
```

Например:

> Create a Python program that analyzes a CSV file.

Agent:

```text
create main.py
        ↓
run_python
        ↓
error
        ↓
read traceback
        ↓
fix
        ↓
run_python
        ↓
success
```

---

# 17. PYTHON EXECUTION SECURITY

Python нельзя запускать непосредственно с неограниченным доступом к системе.

Нужен sandbox boundary.

Минимальные ограничения:

```text
Project directory only
No arbitrary filesystem access
No unrestricted process control
No secrets by default
No access to OS credentials
Controlled network access
Execution timeout
Memory limit
Process termination
```

Без этого `run_python` не считать production-ready.

---

# 18. WEBSITE EXECUTION SECURITY

Аналогично для сайтов.

Preview должен быть изолирован.

Особенно:

```text
JavaScript
network requests
filesystem
cookies
local storage
server processes
```

не должны автоматически получать доступ к хост-системе.

---

# 19. PROJECT UI

Основной экран:

```text
Projects
│
├── All Projects
├── Running
├── Completed
├── Failed
└── Templates
```

Открытие проекта:

```text
Project
├── Overview
├── Files
├── Agents
├── Tasks
├── Runs
├── Activity
├── Preview
└── Settings
```

Не делать огромную монолитную панель.

Каждый раздел — отдельная понятная поверхность.

---

# 20. PROJECT OVERVIEW

```text
Water Guide

Type:
Website

Status:
Building

Agents:
4

Tasks:
12

Completed:
9

Failed:
1

Preview:
Running
```

И главное:

```text
CURRENT ACTIVITY

Developer Agent
Fixing mobile navigation

QA Agent
Waiting for new build
```

---

# 21. AGENT CONTROL

Пользователь/Director должен иметь возможность:

```text
Start Agent
Pause Agent
Stop Agent
Restart Agent
Assign Task
Change Role
Inspect Context
Inspect Tools
```

Позже:

```text
Replace Agent
Change Model
Change Provider
Change Permissions
```

---

# 22. PERMISSIONS

Каждому агенту проект выдаёт capabilities.

Например:

```text
Developer

✓ read files
✓ write files
✓ execute project
✓ preview
✓ browser

✗ system filesystem
✗ secrets
✗ deployment
```

QA:

```text
✓ read files
✓ preview
✓ browser

✗ write files
✗ execute arbitrary commands
```

Director:

```text
✓ project management
✓ agent management
✓ task management
✓ approval
```

---

# 23. APPROVAL GATES

Не всё должно происходить автоматически.

Например:

```text
Build
   ↓
Test
   ↓
Ready
   ↓
[ APPROVE DEPLOY ]
```

Первый этап:

```text
No automatic external deployment.
```

Проект сначала живёт внутри SuperAgents OS.

---

# 24. INTERNAL HOSTING

Для website нужен внутренний preview host.

Концептуально:

```text
Project Workspace
       ↓
Preview Server
       ↓
Internal URL
       ↓
Project Preview
```

Например:

```text
/projects/{projectId}/preview
```

Пользователь открывает сайт прямо внутри OS.

---

# 25. PROJECT TEMPLATES

После базового runtime:

```text
Blank Website
Landing Page
Documentation Site
Portfolio
Dashboard
Python Script
Python Data Tool
```

Шаблоны должны создавать стартовую структуру, но не ограничивать агентов.

---

# 26. DIRECTOR INTEGRATION

Главное — Projects не должны стать отдельным миром.

Director должен уметь:

```text
create project
assign agents
create tasks
start runs
observe results
request revisions
stop execution
```

Пример:

```text
Director:

Create project "Water Guide".

Assign:
Research → Research Agent
Development → Developer Agent
QA → QA Agent

Start.
```

---

# 27. DEBATE INTEGRATION

Существующий Debate Engine можно использовать внутри проектов.

Например:

```text
Developer:
"Should we use pure CSS or Tailwind?"

        ↓

Mini Debate

        ↓

Verdict

        ↓

Developer proceeds
```

Или:

```text
Director:
"Is this website ready?"

        ↓

QA Agent
SEO Agent
Designer Agent
Developer Agent

        ↓

Debate

        ↓

Verdict
```

То есть существующий Debate Engine становится **интеллектуальным механизмом принятия решений внутри Project Runtime**.

---

# 28. MEMORY

Проект должен иметь собственную память.

```text
Project Memory

Goals
Decisions
Constraints
Architecture
Known Bugs
User Requirements
Agent Decisions
```

Например:

```text
Project requirement:

"Do not use external CSS frameworks."

Decision:

"Pure HTML/CSS/JS."

Known issue:

"Mobile menu still needs testing."
```

---

# 29. PROJECT CONTEXT

Каждому агенту не нужно каждый раз передавать весь проект.

Runtime формирует context:

```text
Project
+
Task
+
Relevant files
+
Project memory
+
Previous run
+
Relevant agent history
```

Это уменьшает контекст и снижает хаос.

---

# 30. FAILURE RECOVERY

Если агент упал:

```text
Agent failed
    ↓
Capture error
    ↓
Save state
    ↓
Mark Run = failed
    ↓
Director decides:
    ├── retry
    ├── another agent
    ├── modify task
    └── stop
```

Не терять состояние.

---

# 31. NON-DESTRUCTIVE PRINCIPLE

Очень важное правило для проекта.

Никакого:

```text
Agent can delete everything.
```

По умолчанию:

```text
create
read
modify
```

разрешены.

Удаление:

```text
delete
```

должно быть контролируемым и журналироваться.

Критические операции требуют approval.

---

# 32. STORAGE

Не создавать отдельную хаотичную систему хранения.

Исследовать существующую инфраструктуру:

```text
IndexedDB
Dexie
existing persistence
existing services
existing EventBus
existing DI
```

и встроить Projects в существующие контракты.

Перед реализацией:

```text
AUDIT
→ existing storage
→ existing file abstractions
→ existing execution abstractions
→ existing agent tools
→ existing panels
→ existing permissions
```

---

# 33. IMPLEMENTATION PHASES

## P0 — AUDIT

Ничего не менять.

Исследовать:

```text
AgentService
AgentFactory
Tools
Skills
Plugins
EventBus
DI
Storage
Panels
Routing
Existing filesystem abstractions
Existing execution abstractions
Existing browser integrations
```

Результат:

```text
PROJECTS_RUNTIME_AUDIT.md
```

---

## P1 — PROJECT CORE

Создать:

```text
Project contract
Project repository
Project service
Project state
Project events
Project DI registration
```

Создать минимальный Projects panel.

---

## P2 — WORKSPACE

Создать:

```text
ProjectWorkspace
FileService
FileToolset
```

Поддержать:

```text
create
read
write
edit
list
```

---

## P3 — AGENT RUNTIME

Создать:

```text
AgentProjectRuntime
AgentTaskRunner
AgentToolExecutor
ProjectExecutionContext
```

Связать с существующим AgentService.

---

## P4 — WEBSITE

Добавить:

```text
WebsiteProject
HTML
CSS
JS
Preview
```

Первый end-to-end сценарий:

```text
Agent → files → preview → inspect → fix
```

---

## P5 — BROWSER / QA

Добавить controlled browser tools.

Создать:

```text
QA Agent
```

Проверка:

```text
visual
links
text
basic functionality
```

---

## P6 — MULTI-AGENT PROJECT

Подключить:

```text
Director
Research
Developer
Designer
QA
```

Первый настоящий multi-agent project.

---

## P7 — PYTHON

Добавить:

```text
PythonProject
PythonWorkspace
PythonRunner
ExecutionSandbox
```

Первый сценарий:

```text
Agent → write Python → run → inspect output → fix → rerun
```

---

## P8 — OBSERVABILITY

Добавить полноценный:

```text
Activity
Runs
Tool Calls
Agent Actions
Errors
File Changes
```

---

## P9 — MEMORY

Добавить:

```text
Project Memory
Project Context
Decision Log
Known Issues
```

---

## P10 — APPROVAL / SAFETY

Добавить:

```text
permissions
capabilities
approval gates
execution limits
sandbox boundaries
```

---

## P11 — ARTIFACTS

Добавить:

```text
Artifact Registry
Build Output
Export
Import
Snapshots
```

---

## P12 — TEMPLATES

Добавить:

```text
Website templates
Python templates
```

---

## P13 — DEBATE INTEGRATION

Подключить существующий Debate Engine:

```text
Project Decision
       ↓
Debate
       ↓
Verdict
       ↓
Task
```

---

## P14 — ADVANCED AUTONOMY

Только после стабильного runtime:

```text
goal
 ↓
planning
 ↓
task decomposition
 ↓
agent assignment
 ↓
execution
 ↓
testing
 ↓
revision
 ↓
completion
```

---

# 34. ПЕРВЫЙ КОНТРОЛЬНЫЙ ЭКСПЕРИМЕНТ

Не бизнес.

Не AdSense.

Не деньги.

Не deployment.

Простой тест:

> **«Создай внутри SuperAgents OS красивый одностраничный сайт о космосе.»**

Система должна сама:

```text
Create Project
      ↓
Assign Developer
      ↓
Create HTML
      ↓
Create CSS
      ↓
Create JS
      ↓
Start Preview
      ↓
Inspect
      ↓
Fix
      ↓
QA
      ↓
Ready
```

Пользователь открывает:

```text
Projects
  ↓
Space Website
  ↓
Preview
```

И видит **реально созданный агентами сайт**.

---

# 35. ВТОРОЙ ЭКСПЕРИМЕНТ

> **«Создай Python-программу, которая анализирует CSV.»**

Система:

```text
Create Python Project
      ↓
Developer Agent
      ↓
Create main.py
      ↓
Run
      ↓
Inspect output
      ↓
Fix
      ↓
Run
      ↓
Success
```

---

# 36. ЧТО НЕ ДЕЛАЕМ СЕЙЧАС

Сознательно НЕ включать:

```text
credits
internal currency
real money
business simulation
AdSense
automatic monetization
automatic deployment
unrestricted shell
unrestricted filesystem
complex cloud infrastructure
full autonomous company
```

Это будущие уровни.

---

# 37. БУДУЩАЯ ЭВОЛЮЦИЯ

Когда базовый Project Runtime станет стабильным:

```text
Projects
    ↓
Agent Workspaces
    ↓
Multi-Agent Teams
    ↓
Autonomous Projects
    ↓
Resource Management
    ↓
Budget / Credits
    ↓
External Deployment
    ↓
Real-world Operations
```

И только тогда можно добавить:

```text
Agent Budget
Resource Allocation
Credits
Cost-aware Planning
ROI
Revenue
```

---

# 38. КОНЕЧНАЯ АРХИТЕКТУРНАЯ МОДЕЛЬ

В результате SuperAgents OS получает ещё один фундаментальный слой:

```text
                 SUPERAGENTS OS
                       │
       ┌───────────────┼────────────────┐
       │               │                │
    CHAT/DEBATE      AGENTS          PROJECTS
       │               │                │
       │               │          ┌─────┴─────┐
       │               │          │           │
       │               │       WEBSITE      PYTHON
       │               │          │           │
       └───────────────┼──────────┴───────────┘
                       │
                 AGENT RUNTIME
                       │
                ┌──────┼──────┐
                │      │      │
              Files  Browser Execute
                │      │      │
                └──────┼──────┘
                       │
                   SANDBOX
                       │
                    PROJECT
```

**Главный переход:**

```text
Было:

Agent → говорит

Становится:

Agent → планирует → действует → создаёт → проверяет → исправляет → выдаёт результат
```

И это можно сделать **без OpenCode**.

OpenCode может остаться внешним coding-инструментом, но Project Runtime станет собственным исполнительным слоем SuperAgents OS.
