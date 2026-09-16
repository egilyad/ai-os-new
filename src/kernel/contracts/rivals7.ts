import type { ILifecycle } from './lifecycle';

/** M.1 — Discourse-style polls, solved, trust levels, badges. */
export interface IForumPlusService extends ILifecycle {
    createPoll(topicId: string, question: string, options: string[], closesAt?: number): Promise<string>;
    votePoll(pollId: string, voterId: string, option: string): Promise<Record<string, number>>;
    markSolved(topicId: string, postId: string): Promise<void>;
    trustOf(userId: string): Promise<number>;
    recordActivity(userId: string): Promise<number>;
    awardBadges(userId: string): Promise<string[]>;
}

/** M.1 — Loomio-style decision tools. */
export interface IDecisionService extends ILifecycle {
    propose(title: string, options?: string[]): Promise<string>;
    vote(proposalId: string, voterId: string, position: 'agree' | 'abstain' | 'disagree' | 'block'): Promise<void>;
    outcome(proposalId: string): Promise<{ counts: Record<string, number>; result: string; quorum: boolean }>;
    dotVote(topic: string, voterId: string, dots: Record<string, number>): Promise<void>;
    rankedVote(topic: string, voterId: string, ranking: string[]): Promise<void>;
    rankedOutcome(topic: string): Promise<Array<{ option: string; score: number }>>;
}

/** M.1 — Polis-style opinion clustering. */
export interface IPolisService extends ILifecycle {
    addStatement(convoId: string, text: string): Promise<string>;
    vote(convoId: string, statementId: string, voterId: string, vote: 'agree' | 'disagree' | 'pass'): Promise<void>;
    clusters(convoId: string, k?: number): Promise<Array<{ id: number; members: string[] }>>;
    consensus(convoId: string): Promise<Array<{ statementId: string; text: string; agreement: number }>>;
}

/** M.2 — Reflexion loop. */
export interface IReflexionService extends ILifecycle {
    run(task: string, maxTrials?: number): Promise<{ answer: string; trials: number; reflections: string[] }>;
    reflections(taskKind?: string): Promise<string[]>;
}

/** M.2 — Tree-of-Thoughts BFS search. */
export interface ITotService extends ILifecycle {
    search(task: string, breadth?: number, depth?: number, keep?: number): Promise<{
        best: string;
        path: string[];
        evaluated: number;
    }>;
}

/** M.2 — Self-consistency sampling. */
export interface ISelfConsistencyService extends ILifecycle {
    sample(task: string, n?: number): Promise<{ answer: string; confidence: number; votes: number }>;
}

/** M.2 — SOAR-style productions + impasse + chunking. */
export interface ISoarService extends ILifecycle {
    setFact(key: string, value: string): Promise<void>;
    addProduction(input: { name: string; when: Record<string, string>; then: Record<string, string> }): Promise<string>;
    cycle(maxCycles?: number): Promise<{ fired: string[]; impasses: number; chunks: number }>;
}

/** M.2 — OpenCog-lite atoms + PLN inheritance. */
export interface IAtomService extends ILifecycle {
    addNode(kind: 'Concept' | 'Predicate', name: string, strength?: number, confidence?: number): Promise<string>;
    addLink(kind: 'Inheritance' | 'Implication' | 'Similarity', from: string, to: string, strength?: number, confidence?: number): Promise<string>;
    deduce(concept: string): Promise<Array<{ concept: string; strength: number }>>;
}

/** M.3 — Grafana-style meters + alerts. */
export interface IMeterService extends ILifecycle {
    inc(name: string, by?: number): Promise<void>;
    gauge(name: string, value: number): Promise<void>;
    observe(name: string, value: number): Promise<void>;
    series(name: string, last?: number): Promise<Array<{ at: number; value: number }>>;
    addAlert(name: string, threshold: number, direction?: 'above' | 'below'): Promise<void>;
    checkAlerts(): Promise<Array<{ name: string; value: number }>>;
}

/** M.3 — Sentry-style error inbox. */
export interface IErrorInboxService extends ILifecycle {
    capture(error: string, context?: string): Promise<string>;
    groups(): Promise<Array<{ fingerprint: string; count: number; status: string; sample: string }>>;
    resolve(fingerprint: string): Promise<void>;
    ignore(fingerprint: string): Promise<void>;
}
