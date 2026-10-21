// Wiki section: the project assistant panel.
//
// The assistant is the only surface that talks to the whole system at once:
// it reads the four knowledge layers, calls declarative actions and asks the
// human before anything changes. Freshness here is "verified" because the
// claims were checked against the code in the same session that wrote it.

import type { WikiArticle } from './wiki-types';

export const ASSISTANT_ARTICLES: WikiArticle[] = [
    {
        slug: 'panel-assistant',
        title: 'Панель: Помощник проекта',
        section: 'panels',
        tags: ['панель', 'ассистент', 'голос', 'инструменты', 'память'],
        freshness: 'verified',
        sources: [
            'src/components/Assistant/AssistantPanel.tsx',
            'src/components/Assistant/assistant-wiring.ts',
            'src/components/Assistant/use-speech.ts',
            'src/kernel/services/assistant/assistant-service.ts',
            'src/kernel/services/assistant/assistant-actions.ts',
            'src/kernel/services/assistant/project-knowledge-service.ts',
            'src/kernel/services/assistant/assistant-navigation-service.ts',
        ],
        related: ['panel-chat', 'panel-observability', 'memory'],
        body: `## Что это

Панель «Помощник» — это текстовый (и голосовой) доступ к самой системе. Ассистент
не рассказывает о проекте по памяти: он спрашивает у кода, что панель из себя
представляет, где она живёт, какие тесты её закрывают, и только потом отвечает.

\`\`\`mermaid
sequenceDiagram
    participant U as Оператор
    participant P as AssistantPanel
    participant S as AssistantService
    participant K as ProjectKnowledgeService
    participant A as AssistantActionRegistry
    participant H as ToolApprovalService
    U->>P: вопрос
    P->>S: ask(text)
    S->>K: context(question) — слои A/B
    S->>A: действие (например, ui.openPanel)
    A->>H: запись/исполнение → спросить человека
    H-->>U: подтверждение
    A-->>S: проверенный результат (ok + evidence)
    S-->>P: текст ответа + события потока
\`\`\`

## Четыре слоя знания

Ответ собирается из четырёх слоёв, и каждый слой отвечает за своё:

1. **A — документация.** Статьи вики (\`ProjectKnowledgeService\` + BM25). Это
   намерение системы: «что задумано».
2. **B — структура.** Панель → роут → компонент → тесты. Берётся из
   сгенерированных \`wiki-panel-map\` и \`wiki-connections\`. Это факт: «что
   реализовано».
3. **C — эпизодическая память.** Что было решено раньше (\`memoryOrchestrator.recall\`).
4. **D — оперативное состояние.** Живое состояние: id ассистента, сессия,
   список доступных действий.

Если документация и код расходятся, ассистент обязан доверять коду и сказать об
этом вслух.

## Действия

Действия объявлены декларативно (\`assistant-actions.ts\`), сгруппированы и
имеют класс разрешения:

- **research** — \`system.find\`, \`system.describe\`, \`memory.search\`;
- **navigation** — \`ui.openPanel\` (роут открывает интерфейс и подтверждает переход);
- **work** — \`agents.list\`, \`agents.spawn\`, \`agents.setState\`, \`tools.list\`,
  \`memory.remember\`, а также UI-действия \`keys.*\`, \`mcp.list\`, \`skills.list\`;
- **coordination** — \`debate.start\`, \`scheduler.list\`, \`tasks.list\`.

Каждое действие возвращает проверяемый результат: \`ok\`, краткое описание и
**evidence** — что именно было зафиксировано. Ассистент не имеет права сказать
«открыл», если интерфейс не подтвердил переход.

## Права

Ассистент работает в режиме **guarded**: чтение (\`tool:read\`) идёт свободно,
запись (\`tool:write\`) и исполнение (\`tool:exec\`, \`tool:net\`, \`tool:mcp\`)
требуют подтверждения через \`ToolApprovalService\` — тот же канал, что и у
обычных агентов. Если интерфейс не подключён, запрос отклоняется сразу
(fail closed), а не висит.

## Голос

Голос — браузерный, не зависит от провайдера модели: \`SpeechRecognition\` для
ввода и \`speechSynthesis\` для озвучки (\`use-speech.ts\`). Если Web Speech
недоступен, панель остаётся текстовой.

## Границы слоёв

Ядро не импортирует \`src/components\`. Корпус статей передаётся в ядро через
\`setCorpusProvider\`, UI-действия — через \`attachUiActions\`, а канал
навигации — через \`AssistantNavigationService\`: ядро просит, интерфейс
подтверждает.`,
    },
];
