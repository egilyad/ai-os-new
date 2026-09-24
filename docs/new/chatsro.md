нужно починить и улучщить следущий наш компонент это мульти чаты

http://localhost:5173/chat
http://localhost:5173/chat-sessions
http://localhost:5173/session-hub

для это сначала проведи описанные ниже иследования и дай отчет md.

Да. Здесь я бы дал OpenCode именно **исследовательско-реализационный промт**: сначала пусть изучит существующие Chat-системы, контракты, persistence и то, как устроен UX у Poe, а потом уже чинит. Важный момент — не копировать Poe буквально, а воспроизвести **поведение**: сессия принадлежит беседе, а key/model — сменные параметры продолжения.

# Задача: восстановить полноценную Chat-систему SuperAgents OS

## Главная цель

В репозитории уже существует большая часть инфраструктуры, необходимая для нормальной работы Chat: providers, API keys, models, LLM runtime, persistence, agents, sessions, stores, services и UI.

**Не создавать новую Chat-систему с нуля.**

Нужно сначала изучить существующую архитектуру и восстановить/дозамкнуть уже имеющуюся систему так, чтобы Chat работал как полноценная долгоживущая сессия, в которой можно независимо менять provider/key/model и продолжать тот же разговор без потери истории.

По поведению ориентироваться на UX **Poe.com**: изучить, как там организовано продолжение одной беседы при переключении используемой модели, но **не копировать их код или внутреннюю архитектуру**. Нам нужно реализовать аналогичное поведение средствами уже существующей архитектуры SuperAgents OS.

---

# Ключевая модель

Разделить понятия:

```text
Conversation / Session
        │
        ├── messages
        ├── history
        ├── metadata
        └── continuation state
                 │
                 ├── Provider
                 ├── API Key
                 ├── Model
                 └── Agent (optional)
```

**Conversation НЕ должна быть привязана навсегда к одному key/model.**

Key и model — это параметры конкретного запроса/продолжения разговора.

Пример:

```text
Chat #123

1. Google key A + Gemini model
   → сообщение
   → ответ

2. Google key A + Gemini model
   → сообщение
   → ответ

3. OpenRouter key B + другая модель
   → сообщение
   → ответ



5. снова Google key A + другая модель
   → сообщение
   → ответ
```

Все пять этапов должны оставаться **одной беседой**, с одной историей сообщений.

Переключение key/model не должно создавать новую conversation, если пользователь явно не попросил создать новую беседу.

---

# Обязательное поведение

## 1. Выбор API key

В Chat пользователь должен иметь возможность выбрать доступный API key из реально существующих в системе.

Использовать существующее хранилище ключей и существующую систему provider/key management.

Не создавать параллельный vault.

---

## 2. После выбора key получить доступные модели

После выбора конкретного API key система должна определить, какие модели доступны через соответствующий provider/key.

Пример:

```text
Provider: Google
Key: Google Key #3

Available models:
- model A
- model B
- model C
...
```

Важно:

**не показывать пользователю модели, которые реально недоступны выбранному provider/key, если система уже имеет возможность определить доступность.**

Исследовать существующие:

* provider registry
* model registry
* key registry
* capability discovery
* model catalog
* health checks
* provider adapters
* existing API validation

и использовать существующий механизм вместо создания дубликата.

---

# 3. Выбор model

После выбора модели пользователь может отправлять сообщения.

Каждый запрос должен использовать:

```text
selected provider
selected key
selected model
current conversation
```

Но conversation/session остаётся той же.

---

# 4. Переключение key/model БЕЗ потери сессии

Это центральное требование.

Например:

```text
Conversation:
User → "Привет"
Model A → "Привет!"

User → "Расскажи..."
Model A → ответ

[переключили key]

Key B + Model B

User → "Продолжи"
Model B → продолжает ту же беседу
```

История предыдущих сообщений должна оставаться доступной новой модели в соответствии с существующей системой context/message serialization.

После переключения:

* НЕ создавать новую conversation;
* НЕ очищать сообщения;
* НЕ терять session ID;
* НЕ терять persistent history;
* НЕ создавать искусственный новый чат;
* НЕ ломать streaming;
* НЕ ломать возможность вернуться к предыдущей модели.

---

# 5. Неограниченное количество переключений

Пользователь должен иметь возможность:

```text
Model A
↓
Model B
↓
Model C
↓
Agent
↓
Model A
↓
другой key
↓
другая модель
↓
Agent
↓
...
```

сколько угодно раз в пределах реально доступных provider/key/model.

Conversation остаётся одной.

---

# 6. Возможность подключить Agent

Помимо режима:

```text
Provider + Key + Model
```

должен существовать режим:

```text
Provider + Key + Model + Agent
```

То есть Agent должен быть **опциональным участником беседы**, а не заменой Chat.

Пример:

```text
Chat
 ├── Key: Google #2
 ├── Model: Gemini ...
 └── Agent: Researcher
```

Пользователь должен иметь возможность подключить агента к существующей беседе и продолжить разговор.

Также исследовать существующую Agent architecture:

* AgentService
* AgentFactory
* Agent profiles
* Role
* Persona
* Skills
* Tools
* Memory
* Goals
* Policy
* Protocol
* Model binding

Не создавать упрощённый второй Agent-механизм.

---

# 7. Agent и смена модели

Особенно проверить ситуацию:

```text
Chat
  ↓
Agent A
  ↓
Model X
  ↓
несколько сообщений
  ↓
смена Model Y
  ↓
продолжение
```

и:

```text
Chat
  ↓
Model X
  ↓
подключение Agent A
  ↓
продолжение
```

Сессия не должна теряться.

Если архитектура имеет ограничения на смену модели внутри конкретного Agent — не обходить их скрытым костылём. Найти правильную точку архитектурного контракта и документировать ограничение.

---

# 8. Persistence

Проверить полный жизненный цикл:

```text
create conversation
      ↓
send message
      ↓
stream response
      ↓
persist user message
      ↓
persist assistant response
      ↓
switch key/model
      ↓
send message
      ↓
persist
      ↓
reload application
      ↓
open conversation
      ↓
history intact
```

Особенно важно проверить, что persistence не зависит от конкретного UI-компонента.

Как уже было сделано с Debate History:

**UI может сломаться, но данные беседы должны остаться доступны через persistence/history.**

---

# 9. UX

Изучить Poe.com как reference behavior.

Исследовать именно следующие сценарии:

1. создание беседы;
2. выбор модели;
3. отправка нескольких сообщений;
4. смена модели внутри существующей беседы;
5. продолжение разговора после смены модели;
6. отображение истории;
7. повторная загрузка беседы;
8. переключение между ботами/моделями;
9. сохранение контекста;
10. визуальное отображение того, какая модель отвечала на каком этапе.

Затем сопоставить это с существующими UI-компонентами SuperAgents OS.

**Не копировать UI Poe.**

Нужно понять поведенческую модель и реализовать её в существующем UI/архитектуре OS.

---

# 10. Очень важно: изучить текущий Chat до изменений

До изменения кода провести археологию.

Найти и исследовать:

* все Chat panels;
* Chat services;
* Chat stores;
* Chat runtime;
* session/conversation contracts;
* message contracts;
* provider contracts;
* model contracts;
* API key contracts;
* persistence;
* IndexedDB/Dexie tables;
* LLM adapters;
* streaming;
* event bus events;
* DI registrations;
* routing;
* Agent integration;
* существующие тесты.

Особенно определить:

```text
UI
 ↓
store
 ↓
service
 ↓
runtime
 ↓
provider
 ↓
adapter
 ↓
API
 ↓
response
 ↓
persistence
 ↓
UI
```

Для каждого звена показать реальный файл/contract/service.

---

# 11. Найти причины, почему Chat сейчас работает неправильно

Не ограничиваться симптомами UI.

Определить отдельно:

### A. Что уже работает

### B. Что работает частично

### C. Что существует, но не подключено

### D. Что подключено неправильно

### E. Что является legacy/dead/mock

### F. Где происходит потеря session/conversation identity

### G. Где key/model ошибочно становится частью identity беседы

### H. Где persistence разорван

### I. Где Agent integration существует, но не доходит до runtime

### J. Где UI показывает неправильное состояние относительно runtime

---

# 12. Не создавать новые сущности без необходимости

Правило:

> Сначала использовать существующий контракт/сервис/registry/store.

Новый сервис, store, contract, event или database table создавать только если существующей архитектурой действительно невозможно реализовать требование.

Если предлагается новый слой — сначала показать:

```text
почему существующий слой не подходит
```

---

# 13. Не удалять старое во время этой работы

Не удалять существующие системы просто потому, что они выглядят устаревшими.

Если найдены:

* legacy;
* duplicate;
* mock;
* orphan;
* deprecated;

сначала зафиксировать их в отчёте.

Цель текущей задачи:

**починить и дозамкнуть Chat, а не провести массовую уборку репозитория.**

---

# 14. Сохранить существующие provider/key системы

В системе уже присутствуют provider/key механизмы.

Проверить, какие из реально существующих providers поддерживают нужный сценарий.

Минимальный рабочий диапазон:

```text
существующий Provider
+
существующий API key
+
доступная через него модель
```

Если разные providers имеют разные API capabilities — сделать capability-aware поведение.

Не предполагать, что все providers одинаковы.

---

# 15. Error handling

Корректно обработать:

* invalid key;
* exhausted key;
* unavailable model;
* provider error;
* rate limit;
* timeout;
* network error;
* model doesn't support requested capability;
* context too large;
* streaming interrupted.

Особенно важно:

**ошибка одного запроса не должна уничтожать conversation.**

Например:

```text
Conversation #123

10 сообщений сохранено

Model A
→ error / rate limit

переключаемся на Model B

→ продолжаем Conversation #123
```

---

# 16. Observability

Поскольку архитектура OS должна быть прозрачной, пользователь/диагностика должны иметь возможность понять:

```text
Conversation ID
Message ID
Provider
Key ID / безопасный идентификатор
Model
Agent (если есть)
Request status
Streaming status
Persistence status
```

Не показывать секрет API key.

Но должна существовать возможность понять:

> какой provider/key/model реально использовался для данного ответа.

Это особенно важно после переключения модели.

---

# 17. Не путать Conversation Identity и Execution Configuration

Проверить архитектуру на следующую ошибку:

```text
conversationId = provider + key + model
```

Так делать нельзя.

Правильная концепция:

```text
conversationId = идентификатор самой беседы
```

а:

```text
provider
key
model
agent
```

— параметры исполнения конкретного запроса/сообщения.

История должна выглядеть примерно:

```text
Conversation #123

Message 1
  execution: Google / key-1 / model-A

Message 2
  execution: Google / key-1 / model-A

Message 3
  execution: OpenRouter / key-2 / model-B


Message 5
  execution: Google / key-1 / model-C
```

При этом:

```text
Conversation #123
```

остаётся неизменным.

---

# 18. Контекст при смене модели

Исследовать, как существующий runtime формирует context.

При переключении модели нужно определить правильную стратегию передачи истории:

```text
full conversation history
        ↓
context builder
        ↓
target model
```

Но учитывать реальные ограничения конкретной модели:

* context window;
* system instructions;
* tool capabilities;
* multimodal capabilities;
* provider-specific requirements.

Не делать универсальный хардкод, который предполагает одинаковые возможности всех моделей.

---

# 19. Тестовый сценарий №1

Создать:

```text
Conversation A
```

Отправить:

```text
Message 1
Message 2
Message 3
```

Затем:

```text
switch key
switch model
```

Отправить:

```text
Message 4
Message 5
```

Затем:

```text
switch provider
switch key
switch model
```

Отправить:

```text
Message 6
```

Проверить:

```text
Conversation A
```

содержит все 6 сообщений в правильном порядке.

---

# 20. Тестовый сценарий №2 — reload

После нескольких сообщений:

```text
reload application
```

Открыть Conversation A.

Проверить:

```text
history intact
session intact
messages intact
metadata intact
execution metadata intact
```

Продолжить разговор.

---

# 21. Тестовый сценарий №3 — Agent

```text
Conversation A
↓
Model A
↓
3 messages
↓
attach Agent A
↓
2 messages
↓
switch model
↓
continue
↓
reload
↓
continue
```

Ничего из истории не должно потеряться.

---

# 22. Тестовый сценарий №4 — отказ модели

```text
Model A
↓
message
↓
provider error
```

После этого:

```text
switch Model B
↓
continue same conversation
```

Проверить, что ошибка Model A не повредила conversation state.



# 24. Работа по этапам

## Этап 1 — AUDIT

Код не менять.

Составить:

```text
CHAT_ARCHAEOLOGY.md
```

с картой:

* UI;
* stores;
* services;
* contracts;
* runtime;
* providers;
* keys;
* models;
* persistence;
* sessions;
* agents;
* events;
* routes.

И отдельно:

```text
CURRENT_CHAT_FAILURES.md
```

с конкретными разрывами.

---

## Этап 2 — DESIGN

Сформулировать минимальный план исправлений.

Для каждого изменения:

```text
Current
↓
Problem
↓
Existing component to reuse
↓
Minimal change
↓
Expected result
```

---

## Этап 3 — IMPLEMENTATION

После аудита реализовать минимальные исправления.

Не переписывать Chat целиком.

Не менять unrelated systems.

Не делать массовый refactor.

---

## Этап 4 — VERIFICATION

Проверить реальные цепочки:

```text
key → model discovery → request → response → persistence
```

и:

```text
conversation → model A → model B → model C
```

и:

```text
conversation → agent → model switch → persistence → reload
```

---

# 25. Главный критерий готовности

Chat считается восстановленным не тогда, когда:

> «сообщение отправляется».

А когда выполняется полный сценарий:

```text
Create Conversation
        ↓
Choose Key
        ↓
Get Available Models
        ↓
Choose Model
        ↓
Chat
        ↓
Several Messages
        ↓
Change Key
        ↓
Change Model
        ↓
Continue Same Conversation
        ↓
Attach Agent
        ↓
Continue
        ↓
Change Model Again
        ↓
Continue
        ↓
Reload
        ↓
Conversation Still Intact
        ↓
Continue Again
```

И всё это работает через **существующую архитектуру SuperAgents OS**, а не через новый параллельный Chat stack.

---

# Важное правило

**Не начинать с кода.**

Сначала полностью исследовать repository и дать отчёт о том, что уже существует и почему текущий Chat не работает как задумано.

Если после исследования обнаружится, что большая часть нужной инфраструктуры уже существует, приоритет — **соединить существующие трубы**, а не создавать новые.

После завершения работы отдельно показать:

1. какие существующие компоненты были переиспользованы;
2. какие конкретные разрывы найдены;
3. что исправлено;
4. какие новые сущности, если такие действительно понадобились, были добавлены;
5. как реализована смена key/model без потери Conversation;
6. как реализовано подключение Agent;
7. результаты каждого тестового сценария;
8. что осталось ограничением конкретных providers/models.

Я бы этот промт **сейчас именно так и запускал**: сначала пусть сделает археологию и ничего не трогает. У тебя после починки History появился очень хороший ориентир — **Conversation должна жить независимо от конкретной панели и конкретной модели**, примерно как Debate теперь не исчезает, если UX-представление сломалось.
