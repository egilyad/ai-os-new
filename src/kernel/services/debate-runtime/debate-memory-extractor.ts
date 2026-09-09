import type { TimelineEntry, Claim } from '../../contracts/debate-runtime';

// ── Memory Units ───────────────────────────────────────────────────

export type MemoryUnitType = 'argument' | 'decision' | 'conflict' | 'insight' | 'evidence' | 'consensus';

export interface MemoryUnit {
  readonly id: string;
  readonly sessionId: string;
  readonly type: MemoryUnitType;
  readonly content: string;
  readonly agentId: string;
  readonly round: number;
  readonly confidence: number;
  readonly relatedUnitIds: string[];
  readonly metadata: Record<string, unknown>;
  readonly extractedAt: number;
}

export interface ExtractedMemory {
  readonly sessionId: string;
  readonly units: MemoryUnit[];
  readonly summary: {
    arguments: number;
    decisions: number;
    conflicts: number;
    insights: number;
    evidence: number;
    consensus: number;
  };
  readonly extractedAt: number;
}

// ── Pattern Matchers ───────────────────────────────────────────────

interface PatternMatch {
  type: MemoryUnitType;
  confidence: number;
  content: string;
  agentId: string;
  round: number;
}

const DECISION_PATTERNS = [
  /(?:therefore|consequently|thus|so|we (?:should|must|can)|the (?:best|correct|right) (?:approach|solution|option))/i,
  /(?:итог|следовательно|вывод|значит|нужно|стоит|правильный|лучший)/i,
];

const CONFLICT_PATTERNS = [
  /(?:disagree|however|but|on the contrary|wrong|incorrect|refute|counter)/i,
  /(?:несогласен|однако|но|напротив|неверно|ошибочно|опровергаю|контраргумент)/i,
];

const INSIGHT_PATTERNS = [
  /(?:interesting|novel|surprising|key insight|important to note|crucial|breakthrough)/i,
  /(?:интересно|новое|удивительно|ключевой|важно|критично|прорыв)/i,
];

const EVIDENCE_PATTERNS = [
  /(?:evidence|data|study|research|shows|proves|indicates|statistics|according to)/i,
  /(?:доказательство|данные|исследование|показывает|доказывает|статистика|согласно)/i,
];

const CONSENSUS_PATTERNS = [
  /(?:agree|consensus|common ground|shared understanding|both sides|mutual)/i,
  /(?:согласие|консенсус|общее|схождение|обе стороны|общий)/i,
];

// ── Memory Extractor ───────────────────────────────────────────────

export class DebateMemoryExtractor {
  private unitIdCounter = 0;

  extractFromTimeline(sessionId: string, entries: TimelineEntry[]): ExtractedMemory {
    const units: MemoryUnit[] = [];

    for (const entry of entries) {
      if (entry.type === 'agent:responded') {
        const payload = entry.payload as { agentId: string; content: string; round: number };
        const matches = this.analyzeContent(payload.content, payload.agentId, payload.round);

        for (const match of matches) {
          units.push(this.createUnit(sessionId, match));
        }
      }

      if (entry.type === 'consensus:reached') {
        const payload = entry.payload as { confidence: number; agreements: number; conflicts: number };
        units.push(this.createUnit(sessionId, {
          type: 'consensus',
          confidence: payload.confidence,
          content: `Consensus reached: ${payload.agreements} agreements, ${payload.conflicts} conflicts`,
          agentId: 'system',
          round: 0,
        }));
      }
    }

    // Link related units
    const linkedUnits = this.linkRelatedUnits(units);

    return {
      sessionId,
      units: linkedUnits,
      summary: {
        arguments: linkedUnits.filter(u => u.type === 'argument').length,
        decisions: linkedUnits.filter(u => u.type === 'decision').length,
        conflicts: linkedUnits.filter(u => u.type === 'conflict').length,
        insights: linkedUnits.filter(u => u.type === 'insight').length,
        evidence: linkedUnits.filter(u => u.type === 'evidence').length,
        consensus: linkedUnits.filter(u => u.type === 'consensus').length,
      },
      extractedAt: Date.now(),
    };
  }

  extractClaims(units: MemoryUnit[]): Claim[] {
    return units
      .filter(u => u.type === 'argument' || u.type === 'evidence')
      .map(u => ({
        id: u.id,
        text: u.content,
        agentId: u.agentId,
        round: u.round,
        confidence: u.confidence,
        speaker: u.agentId,
        role: '',
      }));
  }

  private analyzeContent(content: string, agentId: string, round: number): PatternMatch[] {
    const matches: PatternMatch[] = [];

    for (const pattern of DECISION_PATTERNS) {
      if (pattern.test(content)) {
        matches.push({ type: 'decision', confidence: 0.7, content, agentId, round });
      }
    }

    for (const pattern of CONFLICT_PATTERNS) {
      if (pattern.test(content)) {
        matches.push({ type: 'conflict', confidence: 0.6, content, agentId, round });
      }
    }

    for (const pattern of INSIGHT_PATTERNS) {
      if (pattern.test(content)) {
        matches.push({ type: 'insight', confidence: 0.65, content, agentId, round });
      }
    }

    for (const pattern of EVIDENCE_PATTERNS) {
      if (pattern.test(content)) {
        matches.push({ type: 'evidence', confidence: 0.7, content, agentId, round });
      }
    }

    for (const pattern of CONSENSUS_PATTERNS) {
      if (pattern.test(content)) {
        matches.push({ type: 'consensus', confidence: 0.6, content, agentId, round });
      }
    }

    // If no patterns matched, classify as argument
    if (matches.length === 0) {
      matches.push({ type: 'argument', confidence: 0.5, content, agentId, round });
    }

    return matches;
  }

  private createUnit(sessionId: string, match: PatternMatch): MemoryUnit {
    this.unitIdCounter++;
    return {
      id: `mem-${sessionId}-${this.unitIdCounter}-${Date.now()}`,
      sessionId,
      type: match.type,
      content: match.content.slice(0, 2000),
      agentId: match.agentId,
      round: match.round,
      confidence: match.confidence,
      relatedUnitIds: [],
      metadata: {},
      extractedAt: Date.now(),
    };
  }

  private linkRelatedUnits(units: MemoryUnit[]): MemoryUnit[] {
    // Link conflicts with arguments they reference
    const arguments_ = units.filter(u => u.type === 'argument');

    return units.map(unit => {
      if (unit.type === 'conflict') {
        // Find related arguments (same round, different agents)
        const related = arguments_
          .filter(a => a.round === unit.round && a.agentId !== unit.agentId)
          .map(a => a.id)
          .slice(0, 3);
        return { ...unit, relatedUnitIds: related };
      }
      if (unit.type === 'consensus') {
        // Link to all arguments
        const related = arguments_.map(a => a.id).slice(0, 10);
        return { ...unit, relatedUnitIds: related };
      }
      return unit;
    });
  }

  destroy(): void {
    this.unitIdCounter = 0;
  }
}
