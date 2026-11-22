/**
 * Model-class router (AgentScope / OWL E4).
 *
 * Fast deterministic classification of a request into a model class, then a
 * lookup into configured per-class model identifiers. No network calls: a
 * cheap local decision that complements the existing UCB1/provider router.
 */
import type {
    IModelClassRouterService,
    ModelClass,
    ModelClassDecision,
} from '../../contracts/model-class-router';

const SIGNALS: Array<{ cls: ModelClass; words: string[] }> = [
    {
        cls: 'code',
        words: [
            'code',
            'function',
            'bug',
            'typescript',
            'javascript',
            'python',
            'refactor',
            'compile',
            'test',
            'код',
            'функция',
            'баг',
            'рефактор',
        ],
    },
    {
        cls: 'vision',
        words: [
            'image',
            'screenshot',
            'picture',
            'vision',
            'photo',
            'изображение',
            'скриншот',
            'картинка',
        ],
    },
    {
        cls: 'reasoning',
        words: [
            'prove',
            'analyze',
            'reason',
            'derive',
            'compare',
            'architecture',
            'design',
            'доказать',
            'проанализируй',
            'сравни',
            'архитектура',
        ],
    },
    {
        cls: 'creative',
        words: [
            'write',
            'story',
            'poem',
            'creative',
            'markdown',
            'article',
            'напиши',
            'историю',
            'стихи',
            'статью',
        ],
    },
];

export class ModelClassRouterService implements IModelClassRouterService {
    classify(request: string): ModelClass {
        const text = request.toLowerCase();
        if (text.trim().length < 40) return 'trivial';
        for (const { cls, words } of SIGNALS) {
            if (words.some((w) => text.includes(w))) return cls;
        }
        return 'reasoning';
    }

    route(request: string, models: Partial<Record<ModelClass, string>>): ModelClassDecision {
        const cls = this.classify(request);
        const model = models[cls] ?? models['reasoning'] ?? '';
        return {
            cls,
            model,
            reason: `classified as ${cls} from request signals`,
            confidence: 0.8,
        };
    }
}
