/**
 * AssistantDiagnosisService — routing a problem to the right layer.
 *
 * A symptom rarely says where the fault is. "The panel does not open" can be
 * a missing route (B), a broken provider key (D) or a stale article (A). The
 * assistant should not guess: it should classify the symptom and then run the
 * checks that belong to that layer.
 *
 * The routing is deterministic on purpose — it must be reproducible and
 * explainable, and it must not burn a model call to classify a string.
 */

/** The four knowledge layers of the system. */
export type DiagnosisLayer = 'A' | 'B' | 'C' | 'D';

export interface DiagnosisCheck {
    /** Which action answers this check. */
    action: string;
    /** What the check proves. */
    question: string;
    /** Arguments for the action, if any. */
    args?: Record<string, unknown>;
}

export interface DiagnosisPlan {
    layer: DiagnosisLayer;
    /** Why this layer was chosen. */
    reasons: string[];
    /** The checks to run, in order. */
    checks: DiagnosisCheck[];
    /** Other layers worth a look if the first one comes out clean. */
    fallbackLayers: DiagnosisLayer[];
}

interface LayerPattern {
    layer: DiagnosisLayer;
    /** Words that point at this layer. */
    patterns: RegExp[];
    /** Why this layer would explain the symptom. */
    reason: string;
    checks: DiagnosisCheck[];
}

const LAYERS: LayerPattern[] = [
    {
        layer: 'A',
        patterns: [
            /документ/i,
            /стать/i,
            /вики|wiki/i,
            /не совпад|расхожд/i,
            /описан/i,
            /readme|инструкц/i,
        ],
        reason: 'Симптом говорит о расхождении между описанием и поведением.',
        checks: [
            {
                action: 'system.find',
                question: 'Какая статья описывает этот узел?',
                args: { query: '' },
            },
            {
                action: 'system.describe',
                question: 'Что говорит код (панель → роут → компонент → тесты)?',
            },
        ],
    },
    {
        layer: 'B',
        patterns: [
            /панел/i,
            /роут|маршрут|route/i,
            /не открыва|не открыл/i,
            /белый экран|пустой экран/i,
            /404|не найден/i,
            /компонент|экран/i,
            /кнопк/i,
            /не клика|не реагир/i,
        ],
        reason: 'Симптом указывает на структуру: роут, компонент или экран.',
        checks: [
            {
                action: 'system.find',
                question: 'Какая панель отвечает за это место?',
                args: { query: '' },
            },
            {
                action: 'system.describe',
                question: 'Существует ли реализация и какие тесты её закрывают?',
            },
            {
                action: 'ui.openPanel',
                question: 'Открывается ли панель в интерфейсе?',
            },
        ],
    },
    {
        layer: 'C',
        patterns: [
            /забыл|не помн/i,
            /истори/i,
            /вчера|в прошлый раз|раньше/i,
            /решени|вывод/i,
            /урок/i,
            /дневник/i,
            /повторя/i,
        ],
        reason: 'Симптом связан с памятью: то, что было решено или забыто.',
        checks: [
            {
                action: 'memory.search',
                question: 'Что уже известно по этой теме?',
                args: { query: '' },
            },
            {
                action: 'diary.recent',
                question: 'Что ассистент уже пробовал?',
            },
        ],
    },
    {
        layer: 'D',
        patterns: [
            /не работает|не работает\b/i,
            /ключ|provider|провайдер/i,
            /ошибк|exception|стектрейс|stack ?trace/i,
            /таймаут|timeout|завис/i,
            /503|502|500|429/i,
            /агент.*(упал|не отвечает|молчит)/i,
            /дебат/i,
            /медленн/i,
        ],
        reason: 'Симптом указывает на живое состояние: ключи, провайдер, агенты.',
        checks: [
            {
                action: 'keys.health',
                question: 'Живы ли ключи?',
            },
            {
                action: 'agents.list',
                question: 'Что происходит с агентами?',
            },
            {
                action: 'tools.list',
                question: 'Доступны ли инструменты?',
            },
        ],
    },
];

export class AssistantDiagnosisService {
    /**
     * Route a symptom to a layer and return the plan of checks.
     *
     * When the symptom is ambiguous, the layer with the strongest signal
     * wins; the others stay in the fallback list.
     */
    diagnose(symptom: string): DiagnosisPlan {
        const text = symptom.trim();
        if (!text) {
            const d = LAYERS.find((l) => l.layer === 'B')!;
            return {
                layer: 'B',
                reasons: ['Симптом пустой — проверяем структуру по умолчанию.'],
                checks: d.checks,
                fallbackLayers: ['D', 'C', 'A'],
            };
        }

        const scored = LAYERS.map((pattern) => {
            const reasons: string[] = [];
            for (const re of pattern.patterns) {
                const match = text.match(re);
                if (match) reasons.push(`совпадение «${match[0]}»`);
            }
            return { pattern, reasons, score: reasons.length };
        }).filter((s) => s.score > 0);

        if (scored.length === 0) {
            const d = LAYERS.find((l) => l.layer === 'D')!;
            return {
                layer: 'D',
                reasons: ['Признаков слоя не найдено — начинаем с живого состояния.'],
                checks: d.checks,
                fallbackLayers: ['B', 'C', 'A'],
            };
        }

        scored.sort((a, b) => b.score - a.score);
        const best = scored[0]!;
        const fallback = scored
            .slice(1)
            .map((s) => s.pattern.layer)
            .concat(
                LAYERS.map((l) => l.layer).filter(
                    (l) => l !== best.pattern.layer && !scored.some((s) => s.pattern.layer === l),
                ),
            );

        return {
            layer: best.pattern.layer,
            reasons: [best.pattern.reason, ...best.reasons],
            checks: best.pattern.checks,
            fallbackLayers: [...new Set(fallback)],
        };
    }

    /** A short instruction for the assistant prompt. */
    rule(): string {
        return (
            'When something misbehaves, call system.diagnose first: it routes the ' +
            'symptom to a layer and returns the checks to run in that layer.'
        );
    }
}
