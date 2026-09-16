import type { DebateArgument } from '../../contracts/debate-types';
import type {
    InferredStrategy,
    IStrategyFingerprintService,
} from '../../contracts/debate-strategy-fingerprint';

const PATTERNS: Array<{
    name: string;
    confidence: number;
    signals: RegExp[];
    traits: string[];
    counterTactic: string;
}> = [
    {
        name: 'Evidence Heavy',
        confidence: 0.7,
        signals: [
            /\b(study|research|data|evidence|according to|statistics?|survey|analysis)\b/i,
            /\b(percent|\d+%|\d+ percent|majority|minority)\b/i,
        ],
        traits: ['cites external sources', 'uses quantitative claims', 'appeals to authority'],
        counterTactic:
            'Challenge their source credibility and recency. Ask whether the data supports their specific claim.',
    },
    {
        name: 'Emotional Appeal',
        confidence: 0.65,
        signals: [
            /\b(think of the children|future generations|suffering|harm|tragedy|outrage|horrifying)\b/i,
            /\b(how would you feel|imagine|empathy|compassion|hearts|soul)\b/i,
        ],
        traits: ['appeals to emotion', 'uses vivid language', 'frames around values'],
        counterTactic:
            'Acknowledge the emotional weight but redirect to factual analysis. Show that good intentions do not guarantee good outcomes.',
    },
    {
        name: 'First Principles',
        confidence: 0.7,
        signals: [
            /\b(fundamentally|at its core|by definition|essentially|axiom|first principle)\b/i,
            /\b(if we accept that|given that|let us assume|suppose)\b/i,
        ],
        traits: ['argues from axioms', 'builds deductive chains', 'resists empirical grounding'],
        counterTactic:
            'Challenge their axioms. Show that reasonable people can disagree on first principles. Ask what evidence would change their mind.',
    },
    {
        name: 'Procedural / Technical',
        confidence: 0.65,
        signals: [
            /\b(implementation|mechanism|process|protocol|framework|infrastructure)\b/i,
            /\b(practically|concretely|specifically|step by step)\b/i,
        ],
        traits: ['focuses on mechanics', 'demands specifics', 'avoids abstract principles'],
        counterTactic:
            'Accept their technical frame but broaden to include systemic effects. Ask about second-order consequences.',
    },
    {
        name: 'Red Herring / Distraction',
        confidence: 0.6,
        signals: [
            /\b(what about|but what about|and besides|moreover|setting aside)\b/i,
            /\b(irrelevant|that does not matter|not the point|missing the point)\b/i,
        ],
        traits: ['shifts topic', 'introduces tangents', 'avoids direct engagement'],
        counterTactic:
            'Gently redirect to the original claim. Name the distraction explicitly and return focus.',
    },
    {
        name: 'Ad Hominem / Dismissive',
        confidence: 0.6,
        signals: [
            /\b(you clearly|you obviously|you do not understand|you are wrong|nonsense|ridiculous)\b/i,
            /\b(typical|predictable|biased|agenda|propaganda)\b/i,
        ],
        traits: ['attacks the speaker', 'dismisses without engagement', 'uses loaded labels'],
        counterTactic:
            'Do not take the bait. Model civil discourse by addressing the argument, not the tone. Point out the ad hominem if needed.',
    },
    {
        name: 'Hypothetical / Counterfactual',
        confidence: 0.6,
        signals: [
            /\b(what if|imagine if|suppose that|consider a world|hypothetically)\b/i,
            /\b(thought experiment|scenario|alternative|what would happen)\b/i,
        ],
        traits: ['uses hypotheticals', 'tests logical consistency', 'explores edge cases'],
        counterTactic:
            'Engage with the hypothetical but ground it in realistic constraints. Ask whether the hypothetical is plausible.',
    },
    {
        name: 'Appeal to Common Sense',
        confidence: 0.55,
        signals: [
            /\b(common sense|obviously|clearly|everyone knows|it goes without saying)\b/i,
            /\b(self-evident|intuitive|plainly|transparently)\b/i,
        ],
        traits: [
            'assumes consensus',
            'dismisses counter-arguments as unnatural',
            'uses folk wisdom',
        ],
        counterTactic:
            'Point out that common sense is often contradictory. Show an example where "common sense" was wrong.',
    },
];

export class StrategyFingerprintService implements IStrategyFingerprintService {
    private roundPatternHits = new Map<string, Map<string, number[]>>();

    analyzeOpponent(
        _opponentId: string,
        _opponentName: string,
        previousArguments: DebateArgument[],
        _allParticipants: Array<{ id: string; name: string; role: string }>,
    ): Map<string, InferredStrategy> {
        const inferences = new Map<string, InferredStrategy>();

        const byAgent = new Map<string, DebateArgument[]>();
        for (const arg of previousArguments) {
            const existing = byAgent.get(arg.agentId) || [];
            existing.push(arg);
            byAgent.set(arg.agentId, existing);
        }

        for (const [agentId, args] of byAgent) {
            const combined = args.map((a) => a.content).join(' ');
            const lower = combined.toLowerCase();

            const hitPatterns = new Map<string, number[]>();
            for (const pat of PATTERNS) {
                let hits = 0;
                for (const signal of pat.signals) {
                    const matches = lower.match(signal);
                    if (matches) hits += matches.length;
                }
                if (hits >= 2) {
                    const rounds = args.map((a) => a.round);
                    hitPatterns.set(pat.name, rounds);
                }
            }

            let bestName = 'General / Mixed';
            let bestConfidence = 0;
            let bestTraits: string[] = [];
            let bestCounterTactic = 'Engage their arguments directly and look for logical gaps.';

            for (const [name, rounds] of hitPatterns) {
                const pat = PATTERNS.find((p) => p.name === name);
                if (!pat) continue;
                const roundDiversity = new Set(rounds).size;
                const confidence = Math.min(
                    1,
                    pat.confidence + roundDiversity * 0.05 + Math.min(rounds.length * 0.02, 0.1),
                );
                if (confidence > bestConfidence) {
                    bestConfidence = confidence;
                    bestName = name;
                    bestTraits = pat.traits;
                    bestCounterTactic = pat.counterTactic;
                }
            }

            this.roundPatternHits.set(agentId, hitPatterns);

            inferences.set(agentId, {
                name: bestName,
                confidence: Math.round(bestConfidence * 100) / 100,
                observedRounds: args.map((a) => a.round),
                traits: bestTraits,
                counterTactic: bestCounterTactic,
            });
        }

        return inferences;
    }

    getFingerprintPrompt(
        myId: string,
        inferences: Map<string, InferredStrategy>,
        language: string,
    ): string | undefined {
        const opponents: string[] = [];
        for (const [agentId, strat] of inferences) {
            if (agentId === myId) continue;
            if (strat.confidence < 0.4) continue;
            opponents.push(
                `${strat.name} (confidence: ${Math.round(strat.confidence * 100)}%): ${strat.counterTactic}`,
            );
        }
        if (opponents.length === 0) return undefined;

        const intro =
            language === 'Russian'
                ? '### Стратегический анализ оппонента\nВы заметили следующие паттерны в аргументах оппонентов:'
                : "### Opponent Strategy Fingerprint\nYou have identified the following patterns in your opponents' arguments:";

        return intro + '\n' + opponents.join('\n');
    }

    reset(): void {
        this.roundPatternHits.clear();
    }
}
