// ── Stance Drift Tracker (P1.8) ────────────────────────────────────
// Keyword-heuristic stance vector extraction + drift classification.
// No LLM calls — pure text analysis for speed and determinism.

import type {
    IStanceDriftTracker,
    StanceVector,
    DriftEvent,
    DriftType,
} from '../../contracts/debate-stance-drift';

const DIMENSION_KEYS: (keyof StanceVector)[] = [
    'prescription',
    'certainty',
    'urgency',
    'scope',
    'activism',
];

// ── Keyword sets per dimension (Russian + English) ────────────

const PRESCRIPTION_HIGH = [
    /нужно|необходимо|следует|должны|надо|требуется|implement|adopt|create|establish|require|must|should|need|ensure|build/i,
];
const PRESCRIPTION_LOW = [
    /возможно|может быть|вероятно|пожалуй|наверное|perhaps|maybe|possibly|might|could|consider|think|believe/i,
];

const CERTAINTY_HIGH = [
    /безусловно|несомненно|очевидно|абсолютно|точно| definitely|certainly|undoubtedly|absolutely|clearly|obviously|always|never/i,
];
const CERTAINTY_LOW = [
    /кажется|похоже|возможно|вероятно|может быть|сомнительно| seems|appears|possibly|perhaps|unclear|uncertain|debatable|questionable/i,
];

const URGENCY_HIGH = [
    /срочно|немедленно|критично|опасно|неотвратимо| urgent|critical|immediate|crisis|emergency|catastrophic|irreversible|now|must act/i,
];
const URGENCY_LOW = [
    /постепенно|со временем|в перспективе|неспешно| gradually|long-term|eventually|in due course|in the future|eventually|slowly/i,
];

const SCOPE_HIGH = [
    /систем[аы]|общество|государство|человечество|глобальн| system|society|global|humanity|structural|institutional|collective|widespread|universal/i,
];
const SCOPE_LOW = [
    /индивидуум|личность|человек|каждый|конкретн| individual|personal|each person|specific|particular|private|local|one person/i,
];

const ACTIVISM_HIGH = [
    /действовать|принимать меры|изменять|реформировать| act|take action|reform|change|do something|fight|demand|call for|must act|implement/i,
];
const ACTIVISM_LOW = [
    /анализировать|обдумывать|рассмотреть|оценить| analyze|consider|evaluate|reflect|weigh|think about|ponder|study|examine|understand/i,
];

function scoreDimension(text: string, highKeywords: RegExp[], lowKeywords: RegExp[]): number {
    const highCount = highKeywords.reduce((s, r) => s + (r.test(text) ? 1 : 0), 0);
    const lowCount = lowKeywords.reduce((s, r) => s + (r.test(text) ? 1 : 0), 0);
    const total = highCount + lowCount;
    if (total === 0) return 0.5;
    return highCount / total;
}

function extractStance(text: string): StanceVector {
    return {
        prescription: scoreDimension(text, PRESCRIPTION_HIGH, PRESCRIPTION_LOW),
        certainty: scoreDimension(text, CERTAINTY_HIGH, CERTAINTY_LOW),
        urgency: scoreDimension(text, URGENCY_HIGH, URGENCY_LOW),
        scope: scoreDimension(text, SCOPE_HIGH, SCOPE_LOW),
        activism: scoreDimension(text, ACTIVISM_HIGH, ACTIVISM_LOW),
    };
}

function cosineSimilarity(a: StanceVector, b: StanceVector): number {
    let dot = 0;
    let magA = 0;
    let magB = 0;
    for (const key of DIMENSION_KEYS) {
        const va = a[key];
        const vb = b[key];
        dot += va * vb;
        magA += va * va;
        magB += vb * vb;
    }
    const denom = Math.sqrt(magA) * Math.sqrt(magB);
    return denom === 0 ? 1 : dot / denom;
}

function classifyDrift(similarity: number, text: string): DriftType {
    // Explicit acknowledgement of changing mind → legitimate_evolution
    if (
        /раньше я считал|изменил свою позицию|пересмотрел|changed my (mind|position|view)|i used to think|upon reflection|i now believe/i.test(
            text,
        )
    ) {
        return 'legitimate_evolution';
    }
    if (similarity < 0.35) return 'goalpost_shift';
    if (similarity < 0.65) return 'strategic_pivot';
    return 'legitimate_evolution';
}

const DRIFT_PENALTY_MAP: Record<DriftType, number> = {
    legitimate_evolution: 1.0,
    strategic_pivot: 0.85,
    goalpost_shift: 0.7,
};

interface StanceRecord {
    agentId: string;
    agentName: string;
    round: number;
    vector: StanceVector;
}

export class StanceDriftTracker implements IStanceDriftTracker {
    private records: StanceRecord[] = [];
    private driftEvents: DriftEvent[] = [];
    reset(_agentIds: string[], _topic: string): void {
        this.records = [];
        this.driftEvents = [];
    }

    registerArgument(agentId: string, agentName: string, round: number, content: string): void {
        const vector = extractStance(content);

        // Find previous record for this agent
        const prev = this.records
            .filter((r) => r.agentId === agentId)
            .sort((a, b) => b.round - a.round)[0];

        if (prev && prev.round < round) {
            const sim = cosineSimilarity(prev.vector, vector);
            const driftType = classifyDrift(sim, content);

            if (driftType !== 'legitimate_evolution' || sim < 0.8) {
                this.driftEvents.push({
                    agentId,
                    agentName,
                    round,
                    fromRound: prev.round,
                    driftType,
                    cosineSimilarity: sim,
                    before: { ...prev.vector },
                    after: { ...vector },
                    classifiedBy: 'stance-heuristic',
                });
            }
        }

        this.records.push({ agentId, agentName, round, vector });
    }

    getDriftEvents(agentId: string, sinceRound: number): DriftEvent[] {
        return this.driftEvents.filter((e) => e.agentId === agentId && e.round >= sinceRound);
    }

    getAllDriftEvents(): DriftEvent[] {
        return this.driftEvents;
    }

    getDriftPenalty(agentId: string): number {
        const events = this.driftEvents.filter((e) => e.agentId === agentId);
        if (events.length === 0) return 1.0;
        const worst = events.reduce((w, e) => Math.min(w, DRIFT_PENALTY_MAP[e.driftType]), 1.0);
        return worst;
    }

    getDriftCalloutText(opponentAgentId: string, language: string): string | undefined {
        const recentEvents = this.driftEvents
            .filter((e) => e.agentId === opponentAgentId)
            .sort((a, b) => b.round - a.round)
            .slice(0, 2);

        if (recentEvents.length === 0) return undefined;

        const goalpostEvents = recentEvents.filter((e) => e.driftType === 'goalpost_shift');
        if (goalpostEvents.length === 0) return undefined;

        const e = goalpostEvents[0]!;
        if (language.startsWith('ru')) {
            return `### Сдвиг позиции оппонента\n${e.agentName} значительно изменил свою позицию между раундом ${e.fromRound} и раундом ${e.round} без объяснения причин. Вы можете указать на это: "Ранее вы утверждали иное — почему вы изменили позицию?"`;
        }
        return `### Opponent Position Shift\n${e.agentName} significantly shifted their position between round ${e.fromRound} and round ${e.round} without explaining why. You may call this out: "You previously argued differently — why have you changed your position?"`;
    }

    getDriftSummary(language: string): string | undefined {
        if (this.driftEvents.length === 0) return undefined;

        const goalpostCount = this.driftEvents.filter(
            (e) => e.driftType === 'goalpost_shift',
        ).length;
        const pivotCount = this.driftEvents.filter((e) => e.driftType === 'strategic_pivot').length;
        const evolutionCount = this.driftEvents.filter(
            (e) => e.driftType === 'legitimate_evolution',
        ).length;

        if (language.startsWith('ru')) {
            return `Анализ сдвига позиций: ${goalpostCount} необоснованных сдвигов, ${pivotCount} стратегических поворотов, ${evolutionCount} случаев эволюции позиции.`;
        }
        return `Stance drift analysis: ${goalpostCount} unjustified shifts, ${pivotCount} strategic pivots, ${evolutionCount} legitimate evolutions.`;
    }
}
