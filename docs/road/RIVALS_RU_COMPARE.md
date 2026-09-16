# Сравнение 1-к-1, русская десятка + что дописываем

Дата: 2026-09-06. Фаза U. Без проверок. Всё на kv (v34 max). Старая школа — в почёте Ж)

## 1. Metabolic Russian AI (FSBio Lab)
- **У них:** нейро-рантайм без backprop/RLHF: Сеченов рефлекс → Павлов УР/ТОР → Ухтомский доминанта → Бернштейн уровни (A-E) → Лурия 3 блока → Бехтерева гибкие звенья. Поведение как метаболический цикл возбуждение/торможение.
- **Было у нас:** SOAR/Atom/Reflexion — но не как русская школа.
- **Дописываем (U.1):** `MetabolicService` (циклы excitation/inhibition, доминанта-фокус, уровни Бернштейна, блоки Лурии как линзы, без backprop).

## 2. MAESTRO (AIRI)
- **У них:** Multi-Agent Ecosystem of Task Reasoning and Orchestration — фреймворк мультиагентных экосистем, мультимодальные архитектуры.
- **Было:** EcosystemService базовый, MAESTRO-экосистемы нет.
- **Дописываем (U.1):** `MaestroService` (экосистема: роли + задачи + оркестрация с ресурсами, мультимодальный роутинг).

## 3. ai-multi-agent-system (radif-ru, Ollama local)
- **У них:** локаль (Ollama) Planner/Executor/Critic + рефлексия, память, инструменты Яндекс.Диск/почта.
- **Было:** Planner/Executor есть, локаль Ollama есть (adapter), рефлексия есть, но не как local triple.
- **Дописываем (U.2):** `LocalTripleService` (Planner→Executor→Critic loop на Ollama, Яндекс.Диск/почта tools via ToolRunner, локальная память).

## 4. Hackathon MultiAgent System (Сбер × ITMO, химик-органик)
- **У них:** оркестратор + специализированные химики-агенты + RAG по статьям/реакциям.
- **Было:** SOP + RAG, но химии нет.
- **Дописываем (U.2):** `ChemistService` (агенты: Организатор, Спектроскопист, Синтетик + RAG по химии, реакции SMILES).

## 5. Analitik Lab (GigaChat, VasiliiLbyte)
- **У них:** Supervisor + Intake + Proposal (GigaChat).
- **Было:** иерархия + council, но не как Analitik triple.
- **Дописываем (U.2):** `AnalitikService` (Intake→Supervisor→Proposal с GigaChat adapter, budget per agent).

## 6. Ruslan Agent (YandexGPT/GigaChat, самообучающийся)
- **У них:** память + навыки + самообучение на YandexGPT/GigaChat.
- **Было:** Ruslan-подобного самообучения нет.
- **Дописываем (U.2):** `RuslanService` (skill-learn loop: успех → новый skill в SkillMarket, память LT + GigaChat/Kimi/Qwen).

## 7. Heisenberg Team (8 агентов, board-first)
- **У них:** production template, 8 ролей, board-first координация (доска задач как центр).
- **Было:** FleetPanel как доска, но не как Heisenberg board-first.
- **Дописываем (U.3):** `HeisenbergService` (board: колонки todo/doing/done + автодвижение по событиям, 8 ролей seed).

## 8. agency-agents-ru (187 агентов, VK/WB/Yandex)
- **У них:** 187 RU-агентов + оригиналы под VK, Wildberries, Yandex SEO, маркетплейсы.
- **Было:** agency-agents как концепт нет, SEO базовый.
- **Дописываем (U.3):** `AgencyRuService` (каталог 187 → импортируемые агент-карты, паки VK/WB/Yandex).

## 9. evo-ai-agents-labs (Cloud.ru)
- **У них:** лабы по multi-agent паттернам (исследовательские).
- **Было:** лабы как концепт нет.
- **Дописываем (U.3):** `EvoLabService` (лаборатория: запуск паттерна, метрики, сравнение — реюз Frontier eval).

## 10. GigaStudio (СберТех, веб-приложения React/Next.js)
- **У них:** мультиагентная генерация веб-приложений (React/Next).
- **Было:** AppBuilder scaffold, но не как GigaStudio React/Next.
- **Дописываем (U.3):** `GigaStudioService` (multi-agent: PM→Frontend→Backend→QA, Next.js scaffold, preview, deploy stub).

## Другие направления (учтены)
- AIRI мультимодалки → MaestroService.
- Яндекс — семинары multi-agent → LocalTriple + Ruslan на YandexGPT.
- ИТМО/ВШЭ/МФТИ/Сколтех хакатоны → ChemistService + EvoLab.
- nanoMINER/OSА (МГУ+ИТМО) → Chemist RAG + SiteAudit.

## Склады RU (пополнение, U.3)
- Tools: `yadisk.read/write`, `mail.send/list`, `vk.post`, `wb.price`, `yandex.metrica` (mock via ToolRunner `addTool`).
- Skills: 4 RU-скилла (VK SMM, WB Manager, Yandex SEO, GigaChat Analyst).
- Роли: 6 RU-ролей (Химик-органик, SEO для Яндекса, Менеджер WB, SMM VK, Аналитик GigaChat, Самообучающийся Ruslan).
- Линзы: `ухтомский-доминанта`, `бернштейн-уровни`.
- Шаблоны: `local-ollama-triple`, `chemist-lab`, `ru-market-pack`.

## Карта реализации (Фаза U, phase47)
- События: `metabolic:*`, `maestro:*`, `localtriple:*`, `chemist:*`, `analitik:*`, `ruslan:*`, `heisenberg:*`, `agencyru:*`, `evolab:*`, `gigastudio:*` (~10).
- Сервисы: metabolic/maestro, localTriple/chemist/analitik/ruslan, heisenberg/agencyRu/evoLab/gigaStudio → phase47.
- UI: 2 кнопки в табе `rivals` (metabolic tick, chemist ask) — остальное via Fleet/warehouse.
