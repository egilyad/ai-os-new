// ── BiasProfiler (P1.18) ───────────────────────────────────────────────────
// Heuristic cognitive bias detection from argument text.
// Detects 15 bias types using pattern markers and rhetorical signals.
// Provides exploit and mitigation prompt blocks.

import type { IBiasProfiler, BiasProfile, BiasScore, BiasType } from '../../contracts/debate-bias';

interface BiasDetector {
    type: BiasType;
    patterns: RegExp[];
    weight: number; // 0-1 how strong the signal is
    isExploitable: boolean;
}

const BIAS_DETECTORS: BiasDetector[] = [
    {
        type: 'confirmation_bias',
        patterns: [
            /as i (said|argued|mentioned) earlier/i,
            /this only (confirms|proves|supports) what/i,
            /selectively (citing|using|choosing)/i,
            /ignoring (evidence|data|facts) (that|which)/i,
            /как я (говорил|утверждал|упоминал) ранее/i,
            /это (подтверждает|доказывает) то/i,
            /игнорируя (факты|данные|свидетельства)/i,
        ],
        weight: 0.8,
        isExploitable: true,
    },
    {
        type: 'anchoring',
        patterns: [
            /the (real|true|actual) (number|cost|value|figure) is/i,
            /at least \d+/i,
            /no less than/i,
            /by (far|any measure)/i,
            /на самом деле (стоит|равно|составляет)/i,
            /по меньшей мере/i,
            /не менее чем/i,
        ],
        weight: 0.6,
        isExploitable: true,
    },
    {
        type: 'dunning_kruger',
        patterns: [
            /it('?s| is) (simple|easy|obvious|trivial|clear)/i,
            /anyone (can see|would agree|understands)/i,
            /i (don't|do not) see how/i,
            /i (already|fully) (understand|grasp|comprehend)/i,
            /это (просто|легко|очевидно|тривиально)/i,
            /любой (поймет|согласится|видит)/i,
            /я (уже|полностью) (понимаю|осознаю)/i,
        ],
        weight: 0.7,
        isExploitable: true,
    },
    {
        type: 'availability_heuristic',
        patterns: [
            /(recent|latest|fresh|new) (study|research|data|example|case)/i,
            /just (last|this) (week|month|year)/i,
            /i (recall|remember|vividly remember)/i,
            /everyone (knows|has heard|talks about)/i,
            /(недавн|последн|свеж) (исследован|данн|пример|случа)/i,
            /все (знают|слышали|говорят о)/i,
            /я (помню|припоминаю)/i,
        ],
        weight: 0.6,
        isExploitable: true,
    },
    {
        type: 'false_dilemma',
        patterns: [
            /either\s+\w+\s+or\s+\w+/i,
            /there (are|is) (only|just) two/i,
            /the (only|real) (choice|option|alternative)/i,
            /или\s+\w+\s+или\s+\w+/i,
            /есть (только|лишь) два/i,
            /единственный (выбор|вариант)/i,
        ],
        weight: 0.8,
        isExploitable: true,
    },
    {
        type: 'slippery_slope',
        patterns: [
            /next (thing|step|we know) we('ll| will)/i,
            /before you know it/i,
            /lead[s]?\s+(to|us\s+to|down)/i,
            /slippery slope/i,
            /first\s+\w+\s+then\s+\w+/i,
            /if we allow|if you give/i,
            /а потом|затем|следом/i,
            /если (разрешить|позволить|допустить)/i,
            /скользкий/i,
        ],
        weight: 0.7,
        isExploitable: true,
    },
    {
        type: 'strawman',
        patterns: [
            /so what you('re| are) saying is/i,
            /what you really mean/i,
            /in other words, you think/i,
            /so your (argument|position|point) is that/i,
            /то есть ты (считаешь|утверждаешь|говоришь)/i,
            /другими словами/i,
            /значит (твоя|ваша) позиция/i,
        ],
        weight: 0.85,
        isExploitable: true,
    },
    {
        type: 'ad_hominem',
        patterns: [
            /you (just|only) (say|think|believe) that because/i,
            /you('re| are) (biased|wrong|mistaken) (about|on)/i,
            /you (don't|do not) (understand|get|see|grasp)/i,
            /you (clearly|obviously) (haven't|don't)/i,
            /ты (просто|только) (говоришь|думаешь) так/i,
            /ты (предвзят|неправ|ошибаешься)/i,
            /ты (не) (понимаешь|видишь|знаешь)/i,
        ],
        weight: 0.9,
        isExploitable: false,
    },
    {
        type: 'appeal_to_authority',
        patterns: [
            /as \w+ (said|wrote|argued|stated|noted)/i,
            /according to (expert|authority|professor|doctor|scientist)/i,
            /\w+ (himself|herself) (said|confirmed)/i,
            /the (consensus|majority) of (expert|scientist)/i,
            /как (сказал|писал|утверждал|отметил) \w+/i,
            /по мнению (эксперта|авторитета|профессора|ученого)/i,
            /консенсус (специалистов|ученых)/i,
        ],
        weight: 0.5,
        isExploitable: true,
    },
    {
        type: 'status_quo_bias',
        patterns: [
            /it('s| has| is) always been (this way|like this)/i,
            /we('ve| have) (always|never) (done|had)/i,
            /if it ('s|ain't) broke/i,
            /why (change|fix|alter|modify) what/i,
            /традиционно|всегда так (было|делали)/i,
            /зачем (менять|исправлять) то/i,
            /работает (и так|нормально)/i,
        ],
        weight: 0.6,
        isExploitable: true,
    },
    {
        type: 'bandwagon',
        patterns: [
            /(most|many|the majority|countless|numerous) people/i,
            /everyone (knows|agrees|thinks|believes)/i,
            /popular (opinion|view|belief)/i,
            /public (sentiment|opinion|consensus)/i,
            /большинство (людей|считает|думает)/i,
            /все (знают|согласны|думают)/i,
            /общественное (мнение|сознание)/i,
        ],
        weight: 0.5,
        isExploitable: true,
    },
    {
        type: 'optimism_bias',
        patterns: [
            /this (time|round) will be different/i,
            /we can (easily|simply|just) (solve|fix|handle)/i,
            /the (best|optimal|ideal) (case|scenario|outcome)/i,
            /worst[\s-]case (is|would be) (unlikely|rare)/i,
            /в этот раз будет (по-другому|иначе)/i,
            /мы легко (решим|справимся|сделаем)/i,
            /оптимистичный сценарий/i,
        ],
        weight: 0.5,
        isExploitable: true,
    },
];

export class BiasProfiler implements IBiasProfiler {
    private profiles = new Map<string, BiasProfile>();

    analyzeArgument(agentId: string, round: number, content: string): BiasProfile {
        const scores: BiasScore[] = [];

        for (const detector of BIAS_DETECTORS) {
            let matchCount = 0;
            let evidence = '';

            for (const p of detector.patterns) {
                const m = p.exec(content);
                if (m) {
                    matchCount++;
                    if (!evidence) evidence = m[0].slice(0, 80);
                }
            }

            if (matchCount > 0) {
                const rawScore = Math.min(1, (matchCount * detector.weight) / 2);
                scores.push({
                    type: detector.type,
                    score: rawScore,
                    evidence,
                    isExploitable: detector.isExploitable,
                });
            }
        }

        const dominant =
            scores.length > 0
                ? scores.reduce((a, b) => (a.score > b.score ? a : b))
                : { type: 'unknown' as BiasType, score: 0, evidence: '', isExploitable: false };

        const overallScore =
            scores.length > 0 ? scores.reduce((sum, b) => sum + b.score, 0) / scores.length : 0;

        const profile: BiasProfile = {
            agentId,
            round,
            biases: scores,
            dominantBias: dominant.type,
            overallScore,
        };

        this.profiles.set(`${agentId}:${round}`, profile);
        return profile;
    }

    getProfile(agentId: string, round: number): BiasProfile | undefined {
        return this.profiles.get(`${agentId}:${round}`);
    }

    getExploitPrompt(opponentId: string, round: number, language = 'Russian'): string {
        const oppProfile = this.getProfile(opponentId, round);
        if (!oppProfile || oppProfile.biases.length === 0) return '';

        const exploitable = oppProfile.biases.filter((b) => b.isExploitable);
        if (exploitable.length === 0) return '';

        const lines = exploitable.map(
            (b) =>
                `- ${this.biasLabel(b.type, language)} (strength: ${(b.score * 100).toFixed(0)}%)`,
        );

        if (language === 'Russian') {
            return (
                '\n\n### Cognitive Bias Exploitation (Strategic)\n' +
                'Your opponent shows these cognitive biases. Exploit them:\n' +
                lines.join('\n')
            );
        }

        return (
            '\n\n### Cognitive Bias Exploitation (Strategic)\n' +
            'Your opponent shows these cognitive biases. Exploit them:\n' +
            lines.join('\n')
        );
    }

    getMitigationPrompt(agentId: string, round: number, language = 'Russian'): string {
        const myProfile = this.getProfile(agentId, round);
        if (!myProfile || myProfile.biases.length === 0) return '';

        const topBiases = myProfile.biases.sort((a, b) => b.score - a.score).slice(0, 3);

        const lines = topBiases.map(
            (b) =>
                `- ${this.biasLabel(b.type, language)} — ${this.mitigationTip(b.type, language)}`,
        );

        if (language === 'Russian') {
            return (
                '\n\n### Self-Bias Check (Mitigation)\n' +
                'Review your own reasoning for these potential biases:\n' +
                lines.join('\n')
            );
        }

        return (
            '\n\n### Self-Bias Check (Mitigation)\n' +
            'Review your own reasoning for these potential biases:\n' +
            lines.join('\n')
        );
    }

    clearSession(): void {
        this.profiles.clear();
    }

    private biasLabel(type: BiasType, language: string): string {
        const labels: Record<BiasType, { en: string; ru: string }> = {
            confirmation_bias: { en: 'Confirmation bias', ru: 'Подтверждение своей точки зрения' },
            anchoring: { en: 'Anchoring', ru: 'Якорение на первом значении' },
            dunning_kruger: { en: 'Overconfidence', ru: 'Избыточная уверенность' },
            availability_heuristic: { en: 'Availability heuristic', ru: 'Эвристика доступности' },
            false_dilemma: { en: 'False dilemma', ru: 'Ложная дилемма' },
            slippery_slope: { en: 'Slippery slope', ru: 'Скользкий склон' },
            strawman: { en: 'Strawman', ru: 'Соломенное чучело' },
            ad_hominem: { en: 'Ad hominem', ru: 'Переход на личности' },
            appeal_to_authority: { en: 'Appeal to authority', ru: 'Апелляция к авторитету' },
            appeal_to_nature: { en: 'Appeal to nature', ru: 'Апелляция к природе' },
            survivorship_bias: { en: 'Survivorship bias', ru: 'Ошибка выжившего' },
            hindsight_bias: { en: 'Hindsight bias', ru: 'Ошибка ретроспективы' },
            optimism_bias: { en: 'Optimism bias', ru: 'Оптимистическое искажение' },
            status_quo_bias: { en: 'Status quo bias', ru: 'Консерватизм' },
            bandwagon: { en: 'Bandwagon effect', ru: 'Эффект большинства' },
            unknown: { en: 'Unknown bias', ru: 'Неизвестное искажение' },
        };
        return language === 'Russian' ? labels[type].ru : labels[type].en;
    }

    private mitigationTip(type: BiasType, language: string): string {
        const tips: Record<BiasType, { en: string; ru: string }> = {
            confirmation_bias: { en: 'Seek disconfirming evidence', ru: 'Ищи опровергающие факты' },
            anchoring: {
                en: 'Consider alternative reference points',
                ru: 'Рассмотри другие точки отсчёта',
            },
            dunning_kruger: {
                en: 'Acknowledge complexity and limits',
                ru: 'Признай сложность и ограничения',
            },
            availability_heuristic: {
                en: 'Check statistical base rates',
                ru: 'Проверь статистические базовые показатели',
            },
            false_dilemma: {
                en: 'Consider middle-ground positions',
                ru: 'Рассмотри промежуточные позиции',
            },
            slippery_slope: {
                en: 'Demand empirical evidence for each step',
                ru: 'Требуй доказательств для каждого шага',
            },
            strawman: {
                en: 'Address the strongest version of their argument',
                ru: 'Ответь на сильнейшую версию их аргумента',
            },
            ad_hominem: {
                en: 'Separate the person from the argument',
                ru: 'Отдели личность от аргумента',
            },
            appeal_to_authority: {
                en: 'Question the evidence, not the source',
                ru: 'Вопрошай доказательства, а не источник',
            },
            appeal_to_nature: {
                en: 'Natural is not always better',
                ru: 'Естественное не всегда лучше',
            },
            survivorship_bias: {
                en: 'Consider the invisible failures',
                ru: 'Учти невидимые неудачи',
            },
            hindsight_bias: {
                en: 'What was knowable before the outcome?',
                ru: 'Что было известно до результата?',
            },
            optimism_bias: {
                en: 'Prepare for worst-case scenarios',
                ru: 'Готовься к худшему сценарию',
            },
            status_quo_bias: {
                en: 'Would you choose this if starting fresh?',
                ru: 'Выбрал бы ты это начиная с нуля?',
            },
            bandwagon: { en: 'Popularity is not truth', ru: 'Популярность — не истина' },
            unknown: { en: 'Review reasoning carefully', ru: 'Перепроверь свои рассуждения' },
        };
        return language === 'Russian' ? tips[type].ru : tips[type].en;
    }
}
