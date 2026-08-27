import { DEFAULT_LANGUAGE, sanitizeForPrompt } from './debate-prompt-constants';

export function buildTemperaturePrompt(t: number): string {
    if (t <= 0.2)
        return '\n\n### Tone: Pure Logic\nUse ONLY logical reasoning, data, and evidence. No emotional language, no appeals to values, no rhetorical devices. Be cold, precise, and dispassionate. Every claim must be supported by verifiable facts.';
    if (t <= 0.4)
        return '\n\n### Tone: Analytical\nPrioritize logical reasoning and evidence. Emotional appeals should be minimal and only used sparingly. Stay measured and objective.';
    if (t <= 0.6)
        return "\n\n### Tone: Balanced\nBalance logical reasoning with appropriate emotional weight. Use data and evidence where relevant, but don't sound robotic. Acknowledge the human dimension.";
    if (t <= 0.8)
        return '\n\n### Tone: Passionate\nLean into emotional resonance and conviction. Use rhetorical devices, vivid language, and appeals to values. Data should support the emotional narrative, not lead it.';
    return '\n\n### Tone: Pure Emotion\nAppeal to emotions, values, and human impact above all else. Use passionate, rhetorical language. Minimize data and cold logic. Your goal is to move, persuade, and inspire.';
}

export function buildPrePublishCriticPrompt(language: string): string {
    const langIntro =
        language === 'Russian'
            ? `### 📝 Самопроверка перед отправкой
Прежде чем завершить аргумент, мысленно проверь его как безжалотный редактор:

1. ❓ Есть ли голословные утверждения? (без подтверждения)
2. ❓ Есть ли логические ошибки? (ложная дилемма, circular reasoning)
3. ❓ Есть ли слабые аналогии?
4. ❓ Есть ли фактические неточности?
5. 💡 Как сделать аргумент сильнее — добавить конкретику, данные?

Исправь найденные проблемы ДО того, как отправишь аргумент.`
            : `### 📝 Pre-publish Self-Review
Before finalizing your argument, review it as a ruthless editor:

1. ❓ Any unsupported claims? (assertions without evidence)
2. ❓ Any logical fallacies? (false dilemma, circular reasoning)
3. ❓ Any weak analogies?
4. ❓ Any factual inaccuracies?
5. 💡 How to strengthen — add specifics, data, examples?

Fix any issues BEFORE submitting your argument.`;

    return `\n\n${langIntro}`;
}

export function buildSocraticPivotPrompt(language: string): string {
    const langIntro =
        language === 'Russian'
            ? `### 🔄 Смена вектора (Pivot)
Дебаты зашли вглубь — сейчас НЕЛЬЗЯ приводить новые факты или аргументы.
Вместо этого задай ОДИН глубокий вопрос, который бьёт в корень позиции оппонента.

Вопрос должен:
- Вскрыть скрытое допущение в рассуждениях оппонента
- Показать внутреннее противоречие в его позиции
- Заставить оппонента пересмотреть свою аксиоматику

Формат: начни с "❓ Вопрос: " и задай только вопрос — без предисловий.`
            : `### 🔄 Pivot — Change the Vector
The debate has reached depth — do NOT introduce new facts or arguments.
Instead, ask ONE deep question that strikes at the root of your opponent's position.

Your question should:
- Expose a hidden assumption in their reasoning
- Reveal an internal contradiction in their stance
- Force them to reconsider their axiomatic framework

Format: start with "❓ Question: " and ask only the question — no preamble.`;

    return `\n\n${langIntro}`;
}

export function buildConcessionPrompt(language: string): string {
    const langIntro =
        language === 'Russian'
            ? `### 🤝 Стратегическая уступка
Ты можешь признать правоту оппонента по отдельным пунктам — это нормально и даже усиливает твою позицию.

Правила:
- Если уступка не разрушает твой главный аргумент — признай её открыто: "Вы правы в том, что..."
- Затем сделай pivot к своему тезису: "...однако это не отменяет того факта, что..."
- Не спорь ради спора — уступка показывает intellectual honesty

НЕЛЬЗЯ уступать по центральному тезису дебатов.`
            : `### 🤝 Strategic Concession
You may concede specific points to your opponent — this is normal and actually strengthens your position.

Rules:
- If conceding a point doesn't undermine your main argument — concede gracefully: "You are correct that..."
- Then pivot back to your thesis: "...however, this doesn't change the fact that..."
- Don't argue for the sake of arguing — concessions show intellectual honesty

DO NOT concede the central thesis of the debate.`;

    return `\n\n${langIntro}`;
}

export function buildCounterfactualPrompt(language: string): string {
    const langIntro =
        language === 'Russian'
            ? `### 🔮 Контрфактический сценарий
Представь, что одно из ключевых допущений в этой дискуссии ИЗМЕНИЛОСЬ.
Как изменилась бы твоя позиция?

Пример: "А что если [ключевой факт/допущение] было бы неверно?"
Или: "Как изменился бы вывод, если бы [условие X] было иным?"

Дай хотя бы один контрфактический сценарий и объясни, почему твой основной аргумент остаётся сильным даже в этом альтернативном мире.`
            : `### 🔮 Counterfactual Scenario
Suppose one of the key assumptions in this discussion CHANGED.
How would your position differ?

Example: "What if [key fact/assumption] were false?"
Or: "How would the conclusion change if [condition X] were different?"

Provide at least one counterfactual scenario and explain why your main argument remains strong even in this alternate world.`;

    return `\n\n${langIntro}`;
}

export function buildHegelianSynthesisPrompt(language: string): string {
    const langIntro =
        language === 'Russian'
            ? `### 🏛️ Диалектический синтез
Дебаты достигли стадии глубокого противоречия. Сейчас твоя задача — предложить СИНТЕЗ.

Не компромисс («каждому по половине»), а новая позиция, которая:
- Сохраняет сильные стороны твоей позиции (тезис)
- Учитывает обоснованные аргументы оппонента (антитезис)
- Поднимается на уровень выше, снимая противоречие

Формат начни с "🔄 Синтез: " и предложи новую рамку, в которой оба тезиса находят своё место.`
            : `### 🏛️ Dialectical Synthesis
The debate has reached a stage of deep contradiction. Your task is to propose a SYNTHESIS.

Not a compromise ("split the difference"), but a new position that:
- Preserves the strengths of your stance (thesis)
- Acknowledges the valid arguments of your opponent (antithesis)
- Rises to a higher level, resolving the contradiction

Format: start with "🔄 Synthesis: " and propose a new framework where both positions find their place.`;

    return `\n\n${langIntro}`;
}

export function buildShadowOpponentPrompt(language: string): string {
    const langIntro =
        language === 'Russian'
            ? `### 👤 Теневая симуляция оппонента
Прежде чем написать аргумент, представь, что твой самый сильный оппонент читает его.
Задай себе вопрос: "Как бы я сам разнёс этот аргумент, если бы был оппонентом?"
Найди самое уязвимое место в своей позиции и закрой его ПРЕВЕНТИВНО — до того, как оппонент успеет ударить.

Включи в свой ответ минимум одну превентивную контраргументацию:
"Мой оппонент может возразить, что [X], но на самом деле [Y]".
Это делает твой аргумент неуязвимым для самого сильного возражения.`
            : `### 👤 Shadow Opponent Simulation
Before writing your argument, imagine your strongest opponent reading it.
Ask yourself: "How would I tear this argument apart if I were the opponent?"
Find the weakest point in your position and close it PREEMPTIVELY — before your opponent can strike.

Include at least one preemptive counter-argument in your response:
"My opponent might argue that [X], but in reality [Y]."
This makes your argument immune to the strongest possible objection.`;

    return `\n\n${langIntro}`;
}

export function buildEmpathyMirrorPrompt(language: string): string {
    const langIntro =
        language === 'Russian'
            ? `### ❤️ Зеркало эмпатии
Прежде чем контратаковать оппонента, признай ценность его позиции.
Напиши одно предложение в начале, которое показывает, что ты понимаешь,
почему оппонент занимает эту позицию — какие ценности, опасения или интересы за ней стоят.

Формат: "Я понимаю, что для тебя важно [X], потому что [Y]."
Только после этого переходи к контраргументу.

Это не делает тебя слабее — наоборот, ты показываешь, что понял оппонента
глубже, чем он сам себя понимает.`
            : `### ❤️ Empathy Mirror
Before countering your opponent, acknowledge the value in their position.
Write one sentence at the start showing you understand WHY your opponent
holds this position — what values, concerns, or interests lie behind it.

Format: "I understand that [X] matters to you because [Y]."
Only then move to your counter-argument.

This does not make you weaker — it shows you understand the opponent
more deeply than they understand themselves.`;

    return `\n\n${langIntro}`;
}

export function buildEpistemicHumilityPrompt(language: string): string {
    const langIntro =
        language === 'Russian'
            ? `### 📊 Калибровка уверенности (P1.27 — Propagation)
Для каждого существенного утверждения укажи уровень уверенности одним из маркеров:

- [certain] — абсолютно уверен, несколько источников
- [likely] — высокая уверенность, один источник или сильная логика
- [possible] — логический вывод, нет прямых источников
- [unlikely] — низкая вероятность, контраргументы существенны
- [impossible] — противоречит известным фактам или логике

Правила пропагации неопределённости:
- Если A [likely] + B [possible] → вывод C не может быть [certain]
- При aggregации учитывай наименее уверенную посылку
- Штраф за overconfidence: маркер [certain] при ошибке снижает доверие

Честное признание низкой уверенности заслуживает БОЛЬШЕ доверия,
чем ложная уверенность. Не бойся говорить "я не уверен".`
            : `### 📊 Confidence Calibration (P1.27 — Propagation)
For each significant claim, indicate your confidence level using one of:

- [certain] — absolutely sure, multiple sources
- [likely] — high confidence, one source or strong logic
- [possible] — logical inference, no direct sources
- [unlikely] — low probability, counter-arguments significant
- [impossible] — contradicts known facts or logic

Uncertainty propagation rules:
- If A [likely] + B [possible] → conclusion C cannot be [certain]
- When aggregating, consider the least certain premise
- Overconfidence penalty: [certain] marker on an error reduces trust

Honest acknowledgment of low confidence earns MORE trust
than false certainty. Do not be afraid to say "I am not sure."`;

    return `\n\n${langIntro}`;
}

export function buildHeatAdaptivePrompt(heatLevel: number, language: string): string {
    const clamped = Math.max(0, Math.min(1, heatLevel));
    let tone: string;
    let toneInstruction: string;

    if (clamped >= 0.8) {
        if (language === 'Russian') {
            tone = 'страстный';
            toneInstruction =
                'Говори прямо, энергично, с убеждением. Это жаркий спор — не бойся эмоций. Используй короткие, сильные предложения.';
        } else {
            tone = 'passionate';
            toneInstruction =
                'Speak directly, energetically, with conviction. This is a heated exchange — do not fear emotion. Use short, strong sentences.';
        }
    } else if (clamped >= 0.5) {
        if (language === 'Russian') {
            tone = 'уверенный';
            toneInstruction =
                'Сохраняй уверенный, но уважительный тон. Приводи факты, но не бойся показывать отношение.';
        } else {
            tone = 'confident';
            toneInstruction =
                'Maintain a confident but respectful tone. Present facts but do not be afraid to show your stance.';
        }
    } else {
        if (language === 'Russian') {
            tone = 'аналитический';
            toneInstruction =
                'Сохраняй спокойный, аналитический тон. Фокусируйся на логике и фактах, минимизируй эмоциональные формулировки.';
        } else {
            tone = 'analytical';
            toneInstruction =
                'Maintain a calm, analytical tone. Focus on logic and facts. Minimize emotional language.';
        }
    }

    if (language === 'Russian') {
        return `\n\n### 🌡️ Тон выступления\nУровень накала: ${(clamped * 100).toFixed(0)}%\nРекомендуемый тон: ${tone}\n${toneInstruction}`;
    }
    return `\n\n### 🌡️ Debate Tone\nHeat level: ${(clamped * 100).toFixed(0)}%\nRecommended tone: ${tone}\n${toneInstruction}`;
}

export function buildFallacySentinelPrompt(originalTopic: string, language: string): string {
    const topic = sanitizeForPrompt(originalTopic, 200);
    const langIntro =
        language === 'Russian'
            ? `### 🛡️ Страж фокуса и логики
Оригинальный тезис дебатов: "${topic}"

Прежде чем писать свой аргумент, задай себе два вопроса:
1. Отклонилась ли дискуссия от исходного тезиса? Если да — верни фокус: "Давайте вернёмся к главному вопросу о [тезис]."
2. Использует ли кто-то логические уловки (соломенное чучело, ad hominem, ложную дилемму, подмену тезиса)? Если да — вежливо укажи на это.

Твоя задача — держать дебаты честными и сфокусированными.`
            : `### 🛡️ Focus & Fallacy Sentinel
Original debate thesis: "${topic}"

Before writing your argument, ask yourself two questions:
1. Has the discussion drifted from the original thesis? If yes — refocus: "Let's return to the main question about [thesis]."
2. Is anyone using logical fallacies (straw man, ad hominem, false dilemma, red herring)? If yes — politely point it out.

Your job is to keep the debate honest and focused.`;

    return `\n\n${langIntro}`;
}

export function buildCredibilityPrompt(
    scores: { source: string; score: number; domainTier: number; domainLabel: string }[],
    language: string,
): string {
    const table = scores
        .map(
            (s) =>
                `- "${s.source.slice(0, 80)}" → ${(s.score * 10).toFixed(0)}/10 (tier ${s.domainTier}: ${s.domainLabel})`,
        )
        .join('\n');

    const langIntro =
        language === 'Russian'
            ? `### 📊 Достоверность источников
Приведённые ниже источники имеют следующие оценки достоверности.
Учитывай эти оценки при цитировании — источники с низким баллом требуют
дополнительной верификации или более слабой опоры на них.\n${table}`
            : `### 📊 Source Credibility
The following sources have these credibility ratings.
Factor these scores into your citation weighting — low-scoring sources need
additional verification or weaker reliance.\n${table}`;

    return `\n\n${langIntro}`;
}

export function buildObjectionAnticipationPrompt(language: string): string {
    const langIntro =
        language === 'Russian'
            ? `### 🔮 Превентивный prebuttal
Прежде чем завершить аргумент, задай себе: "Какое самое сильное возражение
может выдвинуть оппонент?" — и ответь на него заранее.

Добавь в свой ответ секцию:
"Мой оппонент может возразить, что [X], однако [Y]."
Это показывает, что ты уже учёл контраргументы и твоя позиция продумана глубже.`
            : `### 🔮 Preemptive Prebuttal
Before finishing your argument, ask yourself: "What is the strongest objection
my opponent could raise?" — and answer it in advance.

Add a section to your response:
"My opponent might object that [X], however [Y]."
This shows you have already considered counter-arguments and your position
is more thoroughly reasoned.`;

    return `\n\n${langIntro}`;
}

export function buildTriangulationPrompt(language: string): string {
    const langIntro =
        language === 'Russian'
            ? `### 🔄 Триангуляция источников
Для ключевых утверждений (новых claim-ов или прямой атаки на оппонента)
постарайся использовать минимум 2-3 НЕЗАВИСИМЫХ источника разных типов:
- Научное исследование / статья
- Новостной репортаж / журналистика данных
- Экспертное мнение / официальный документ

Один источник может быть ошибочным. Триангуляция делает твой аргумент
устойчивым к ошибкам в отдельных источниках.`
            : `### 🔄 Source Triangulation
For key claims (new claims or direct attacks on your opponent),
try to use at least 2-3 INDEPENDENT sources of different types:
- Scientific study / paper
- News report / data journalism
- Expert opinion / official document

A single source can be wrong. Triangulation makes your argument
resilient to errors in individual sources.`;

    return `\n\n${langIntro}`;
}

export function buildDriftCorrectionPrompt(score: number, language: string): string {
    const intensity = score >= 0.8 ? 'STRONG' : score >= 0.65 ? 'MODERATE' : 'MILD';
    if (language.startsWith('ru')) {
        if (intensity === 'STRONG') {
            return `\n\n### ВЫХОД ИЗ ПЕРСОНАЖА (критично)
Ваш ответ не соответствует вашему персонажу. Напомните себе свою роль и вернитесь к ней. Если вы [PRO] — аргументируйте ЗА. Если [CON] — аргументируйте ПРОТИВ. Если [NEUTRAL] — сохраняйте аналитический баланс.`;
        }
        if (intensity === 'MODERATE') {
            return `\n\n### Отклонение от персонажа
Ваш ответ частично отклоняется от вашего персонажа. Вернитесь к своей роли и используйте характерную для неё лексику и позицию.`;
        }
        return `\n\n### Лёгкое отклонение от персонажа
Старайтесь сохранять последовательность вашего персонажа в аргументации.`;
    }
    if (intensity === 'STRONG') {
        return `\n\n### PERSONA DRIFT (critical)
Your response does not match your assigned persona. Remember your role and realign: if [PRO] — argue FOR; if [CON] — argue AGAINST; if [NEUTRAL] — maintain analytical balance.`;
    }
    if (intensity === 'MODERATE') {
        return `\n\n### Persona drift detected
Your response partially drifts from your assigned persona. Return to your role and use characteristic language and stance.`;
    }
    return `\n\n### Mild persona drift
Try to maintain consistency with your assigned persona in your argumentation.`;
}

export function buildRedundancyWarningPrompt(score: number, language: string): string {
    const pct = (score * 100).toFixed(0);
    const langIntro =
        language === 'Russian'
            ? `### ⚠️ ОБНАРУЖЕН ПОВТОР (сходство ${pct}%)
Твой текущий аргумент слишком похож на твои предыдущие высказывания.
Повторение одного и того же снижает качество дебатов.

У тебя есть два варианта:
1. Предложи НОВЫЙ аргумент, который ты ещё не использовал
2. Если новых аргументов нет — ЧЕСТНО признай, что оппонент прав по этому пункту, и сделай уступку

Повторять уже сказанное ЗАПРЕЩЕНО. Твои оппоненты и судья уже слышали твою позицию.`
            : `### ⚠️ REPETITION DETECTED (${pct}% similarity)
Your current argument is too similar to your previous statements.
Repeating the same points degrades debate quality.

You have two options:
1. Present a NEW argument you have not used before
2. If you have no new arguments — HONESTLY concede this point to your opponent

Repeating what you already said is PROHIBITED. Your opponents and the judge have already heard your position.`;

    return `\n\n${langIntro}`;
}

export function buildCrossExaminationPrompt(_language = DEFAULT_LANGUAGE): string {
    return (
        '\n\n### Cross-Examination Mode\n' +
        'Directly QUESTION one specific claim made by another participant. Do NOT make your own argument — ' +
        'instead, ask a pointed question that exposes a gap, inconsistency, or unsupported assumption in their ' +
        'reasoning. Good cross-examination: targets the WEAKEST link in their argument chain. ' +
        'Your question should force them to either provide missing evidence or concede the point.'
    );
}

export function buildDeltaFocusingPrompt(_language = DEFAULT_LANGUAGE): string {
    return (
        '\n\n### Delta-Focusing Mode\n' +
        'Do NOT repeat or acknowledge points of agreement. Focus EXCLUSIVELY on areas where you disagree ' +
        'with other participants. If a claim has already been made and you agree with it, ignore it and move ' +
        'on. Your contribution must advance the debate by sharpening points of contention, not restating common ground.'
    );
}

export function buildCriticPrompt(language: string): string {
    return buildPrePublishCriticPrompt(language);
}

export function buildDpoSamplerPrompt(_language = DEFAULT_LANGUAGE): string {
    return (
        '\n\n### Argument Quality Standard\n' +
        'Before writing, recall the characteristics of a STRONG argument: specific evidence, clear logical ' +
        'structure, acknowledgment of counter-points, and precise language. Your argument will be evaluated ' +
        'against this quality standard. Avoid vagueness, unsupported claims, and rhetorical fluff.'
    );
}

export function buildUncertaintyPropagationPrompt(_language = DEFAULT_LANGUAGE): string {
    return (
        '\n\n### Uncertainty Propagation\n' +
        'After each claim in your argument, append your confidence level: [HIGH], [MEDIUM], or [LOW]. ' +
        'If your claim depends on a previous claim with lower confidence, your conclusion inherits that ' +
        'uncertainty. Be honest about what you know vs. what you infer. A chain is only as strong as its weakest link.'
    );
}

export function buildRhetoricSafetyPrompt(_language = DEFAULT_LANGUAGE): string {
    return (
        '\n\n### Rhetoric Safety Guidelines\n' +
        'Argue against POSITIONS, not people. Avoid: ad hominem attacks, inflammatory language, ' +
        'straw man arguments, emotional manipulation, and false dichotomies. ' +
        'You may be passionate, but you must remain respectful and logically rigorous.'
    );
}

export function buildBiddingTimePrompt(_language = DEFAULT_LANGUAGE): string {
    return (
        '\n\n### Speaking Time Auction\n' +
        'Not all participants will speak this round. Your argument must be CONCISE and HIGH-IMPACT to earn ' +
        'the floor. Make your strongest point in 2-3 sentences. If you ramble or repeat points already made, ' +
        'you will lose your speaking slot. Quality over quantity.'
    );
}

export function buildAdaptiveOrderPrompt(_language = DEFAULT_LANGUAGE): string {
    return (
        '\n\n### Adaptive Speaking Order\n' +
        'The speaking order has been dynamically adjusted this round. You may be speaking earlier or later ' +
        'than usual. If speaking early: set up key framing. If speaking late: address points raised by ' +
        'others and push toward resolution. Adapt your approach to your position in the order.'
    );
}

export function buildBlindEvaluationPrompt(_language = DEFAULT_LANGUAGE): string {
    return (
        '\n\n### Blind Evaluation Context\n' +
        'The judge will evaluate your argument without knowing which participant made it. ' +
        'Your name, role, and persona are irrelevant — only the quality of your reasoning matters. ' +
        'Focus entirely on making the clearest, most evidence-backed case possible.'
    );
}

export function buildPivotStrategyPrompt(_language = DEFAULT_LANGUAGE): string {
    return (
        '\n\n### Pivot Strategy Assessment\n' +
        'Consider whether your current argument approach is working. If you have been making the same type of ' +
        'argument for multiple rounds without gaining traction, PIVOT. Change your framing, use different evidence, ' +
        'or attack from a different angle. Stale approaches lose debates.'
    );
}

export function buildSynthesisPrompt(_language = DEFAULT_LANGUAGE): string {
    return (
        '\n\n### Synthesis Opportunity\n' +
        'The debate has reached a stage where synthesis is valuable. Identify the strongest points from ALL sides ' +
        'and propose a coherent resolution that incorporates the best of each position. ' +
        'A good synthesis does not compromise — it transcends the original disagreement by finding a higher-level ' +
        'framework that accommodates the valid insights from every perspective.'
    );
}

export function buildExecutableEvidencePrompt(language: string): string {
    return (
        '\n\n### Executable Evidence Requirement\n' +
        'If you make a factual claim that can be numerically verified, write a short Python or JavaScript ' +
        'code snippet to DEMONSTRATE it. Put the code in a code block. The code should:\n' +
        '1. Define the claim as a testable assertion\n' +
        '2. Compute the relevant numbers or probabilities\n' +
        '3. Print the result showing whether your claim holds\n\n' +
        'Example: If claiming "X is more efficient than Y", write code that computes both and compares them.\n' +
        'Only include code for claims that are actually testable — do not fabricate data.\n' +
        `Respond in ${language}.`
    );
}

export function buildHiddenIncentivesPrompt(text: string, _language = DEFAULT_LANGUAGE): string {
    return `\n\n### ⚠️ Conflict of Interest Disclosure\n${text}\n\nAcknowledge or address these potential conflicts honestly in your argument.`;
}

export function buildGoTPrompt(text: string, _language = DEFAULT_LANGUAGE): string {
    return (
        '\n\n### Graph-of-Thoughts Deliberation — Reasoning Branches\n' +
        'Before writing your argument, internally explore the reasoning branches the system has identified:\n' +
        `${text}\n\n` +
        'Synthesize the strongest logic from these branches into your public argument. ' +
        'Your final response should reflect the best reasoning across all explored angles.'
    );
}

export function buildBlendingPrompt(text: string, _language = DEFAULT_LANGUAGE): string {
    return (
        '\n\n### 🔄 Semantic Concept Blending\n' +
        'The debate may be stuck in a false dichotomy. Consider this blended framework:\n' +
        `${text}\n\n` +
        'Instead of defending one pole, propose a resolution that transcends the apparent contradiction. ' +
        'Use the blended concept as a starting point for a more nuanced position.'
    );
}

export function buildForecasterPrompt(text: string, _language = DEFAULT_LANGUAGE): string {
    return (
        '\n\n### 📊 Outcome Forecast — Strategic Guidance\n' +
        `${text}\n\n` +
        'Consider this forecast before writing your argument. ' +
        'The recommended angle has the highest expected judge score based on current debate dynamics. ' +
        'Use it as strategic guidance — adapt your argument for maximum impact.'
    );
}

export function buildBestOfNPrompt(_language = DEFAULT_LANGUAGE): string {
    return (
        '\n\n### 🔬 Best-of-N Selection\n' +
        'Your argument was selected as the strongest variant from multiple candidates. ' +
        'It was chosen for its combination of novelty and rebuttal strength. ' +
        'Deliver it with confidence — the selection process has already filtered for quality.'
    );
}

export function buildAgreementAnchoringPrompt(
    premises: Array<{ text: string; participantIds: string[] }>,
    _language = DEFAULT_LANGUAGE,
): string {
    if (premises.length === 0) return '';
    const list = premises.map((p) => `- "${p.text}" (shared by ${p.participantIds.join(', ')})`).join('\n');
    return (
        '\n\n### Agreement Anchoring\n' +
        'Start from these shared premises both sides have acknowledged:\n' +
        `${list}\n` +
        'Anchor your argument on this common ground, then show how the opponent’s later claim contradicts it. ' +
        'Exposing inconsistency from a shared starting point is highly persuasive.'
    );
}

export function buildBurdenOfProofPrompt(
    claims: Array<{ claimText: string; agentName: string }>,
    _language = DEFAULT_LANGUAGE,
): string {
    if (claims.length === 0) return '';
    const list = claims.map((c) => `- [${c.agentName}] "${c.claimText.slice(0, 120)}"`).join('\n');
    return (
        '\n\n### Burden of Proof — Unsupported Claims Detected\n' +
        'The following opponent claims lack evidence (no numbers, citations, or sources):\n' +
        `${list}\n` +
        'Directly challenge one of these claims: demand the missing evidence, or show why the claim fails without it. ' +
        'A claim without evidence carries zero weight.'
    );
}
