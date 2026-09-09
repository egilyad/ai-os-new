import type {
    AudienceArchetype,
    AudienceMember,
    AudienceReaction,
    AudienceReactionEvent,
    AudiencePoll,
    AudienceSideChatMessage,
    AudienceState,
    IAudienceService,
} from '../contracts/audience';
import { AUDIENCE_ARCHETYPES } from './audience-archetypes';
import { SeededRng } from '../utils/seedable-rng';

let _counter = 0;
const _rng = new SeededRng();
const pick = <T>(arr: T[]): T => _rng.pick(arr);
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

const ARGUMENT_TRIGGERS: Record<string, { reaction: AudienceReaction; weight: number }[]> = {
    strong_evidence: [
        { reaction: 'applause', weight: 0.5 },
        { reaction: 'cheer', weight: 0.3 },
        { reaction: 'silence', weight: 0.2 },
    ],
    fallacy: [
        { reaction: 'outrage', weight: 0.4 },
        { reaction: 'boo', weight: 0.3 },
        { reaction: 'laugh', weight: 0.2 },
        { reaction: 'silence', weight: 0.1 },
    ],
    witty: [
        { reaction: 'laugh', weight: 0.6 },
        { reaction: 'applause', weight: 0.2 },
        { reaction: 'cheer', weight: 0.2 },
    ],
    emotional: [
        { reaction: 'applause', weight: 0.3 },
        { reaction: 'silence', weight: 0.4 },
        { reaction: 'cheer', weight: 0.3 },
    ],
    aggressive: [
        { reaction: 'outrage', weight: 0.4 },
        { reaction: 'boo', weight: 0.3 },
        { reaction: 'silence', weight: 0.2 },
        { reaction: 'laugh', weight: 0.1 },
    ],
    weak: [
        { reaction: 'boo', weight: 0.3 },
        { reaction: 'laugh', weight: 0.3 },
        { reaction: 'silence', weight: 0.4 },
    ],
};

const SIDE_CHAT_TEMPLATES: Record<string, string[]> = {
    zealot: [
        'FINALLY someone said it!',
        'THIS is the truth right here!',
        'How can anyone disagree with that?!',
    ],
    skeptic: [
        "I'd like to see the source on that.",
        'Convenient how they left out the counter-evidence.',
        "Hmm, that's one interpretation.",
    ],
    cheerleader: ['AMAZING point!', 'So well said!', 'This is why I love watching debates!'],
    detractor: ['This is pathetic.', 'Is this the best they can do?', 'Waste of time.'],
    thinker: [
        'Interesting framing.',
        'The premise deserves more examination.',
        "There's a deeper assumption here.",
    ],
    jester: [
        'Did anyone else catch that face?',
        'This is better than reality TV.',
        "Plot twist: they're both wrong.",
    ],
    troll: [
        "Hot take: neither knows what they're talking about.",
        "Let me play devil's advocate here...",
        'Actually, the real issue is much simpler.',
    ],
    fanboy: ["They're so brilliant!", 'I wish I could argue like that.', 'Can I get an autograph?'],
    empath: [
        'I feel so stressed watching this!',
        'My heart is racing!',
        'That was a brutal rebuttal.',
    ],
    casual: ['Wait, what just happened?', 'This got intense!', 'Is it over yet?'],
    panicker: ["They're destroying our side!", "It's all over!", 'SOMEONE SAY SOMETHING!'],
    lawyer: [
        'Objection: appeal to emotion.',
        "That's a non sequitur.",
        'Could you define your terms?',
    ],
};

const FALLBACK_CHAT = [
    "That's a good point.",
    'I never thought of it that way.',
    'Interesting perspective.',
    'Not sure I agree.',
    'Can someone explain that to me?',
];

function classifyArgument(text: string): string[] {
    const lower = text.toLowerCase();
    const classes: string[] = [];
    if (/\b(study|research|data|evidence|according to|statistics?|survey)\b/.test(lower))
        classes.push('strong_evidence');
    if (/\b(fallacy|strawman|ad hominem|slippery slope|whataboutism)\b/.test(lower))
        classes.push('fallacy');
    if (/\b(funny|humor|joke|ridiculous|absurd|laugh)\b/.test(lower)) classes.push('witty');
    if (/\b(emotion|feel|heartbreaking|tragic|beautiful|hope)\b/.test(lower))
        classes.push('emotional');
    if (/\b(attack|destroy|stupid|idiot|wrong|nonsense)\b/.test(lower)) classes.push('aggressive');
    if (/\b(maybe|perhaps|i think|not sure|possibly|might be wrong)\b/.test(lower))
        classes.push('weak');
    if (classes.length === 0) classes.push('weak');
    return classes;
}

export class AudienceService implements IAudienceService {
    private readonly MAX_MEMBERS = 100;
    private readonly MAX_REACTIONS = 500;
    private readonly MAX_MESSAGES = 200;
    private members: AudienceMember[] = [];
    private reactions: AudienceReactionEvent[] = [];
    private messages: AudienceSideChatMessage[] = [];
    private activePoll: AudiencePoll | null = null;
    private pollIdCounter = 0;
    private totalSentiment = 0;
    private totalEngagement = 0;
    private memberTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
    private pollTimer: ReturnType<typeof setTimeout> | null = null;
    private _lastReactionTime = 0;
    private _lastMsgTime = 0;
    private readonly RATE_LIMIT_MS = 200;

    async init(): Promise<void> {}

    async start(): Promise<void> {}

    async destroy(): Promise<void> {
        this.memberTimers.forEach((t) => clearTimeout(t));
        this.memberTimers.clear();
        if (this.pollTimer) clearTimeout(this.pollTimer);
        this.members = [];
        this.reactions = [];
        this.messages = [];
        this.activePoll = null;
    }

    getArchetypes(): AudienceArchetype[] {
        return AUDIENCE_ARCHETYPES;
    }

    populate(size: number): void {
        this.memberTimers.forEach((t) => clearTimeout(t));
        this.memberTimers.clear();
        this.members = [];
        this.messages = [];
        this.reactions = [];
        this.activePoll = null;
        this.totalSentiment = 0;
        this.totalEngagement = 0;

        const shuffled = [...AUDIENCE_ARCHETYPES].sort(() => _rng.next() - 0.5);
        const actualSize = Math.min(size, this.MAX_MEMBERS);
        for (let i = 0; i < actualSize; i++) {
            const arch = shuffled[i % shuffled.length]!;
            const id = `audience-${++_counter}`;
            const nameSuffix = _rng.chance(0.5) ? _rng.nextInt(0, 9998).toString() : '';
            this.members.push({
                id,
                archetypeId: arch.id,
                name: `${arch.name}${nameSuffix ? `_${nameSuffix}` : ''}`,
                emoji: arch.emoji,
                engagement: arch.engagement + (_rng.next() - 0.5) * 0.2,
                sentiment: arch.sentimentBias + (_rng.next() - 0.5) * 0.3,
                currentReaction: null,
                message: null,
                hasVoted: false,
            });
            this.totalSentiment += arch.sentimentBias;
            this.totalEngagement += arch.engagement;
        }
    }

    getState(): AudienceState {
        return {
            members: this.members,
            reactions: this.reactions.slice(-50),
            recentMessages: this.messages.slice(-30),
            activePoll: this.activePoll,
            sentiment: this.members.length > 0 ? this.totalSentiment / this.members.length : 0,
            engagement: this.members.length > 0 ? this.totalEngagement / this.members.length : 0,
        };
    }

    getMembers(): AudienceMember[] {
        return this.members;
    }

    getActivePoll(): AudiencePoll | null {
        return this.activePoll;
    }

    getRecentMessages(count = 20): AudienceSideChatMessage[] {
        return this.messages.slice(-count);
    }

    getDominantReaction(): { reaction: AudienceReaction; intensity: number } | null {
        const recent = this.reactions.slice(-20);
        if (recent.length === 0) return null;
        const counts: Record<string, { count: number; totalIntensity: number }> = {};
        for (const r of recent) {
            if (!counts[r.reaction]) counts[r.reaction] = { count: 0, totalIntensity: 0 };
            counts[r.reaction]!.count++;
            counts[r.reaction]!.totalIntensity += r.intensity;
        }
        let best = '';
        let bestScore = 0;
        for (const [k, v] of Object.entries(counts)) {
            const score = v.count * (v.totalIntensity / v.count);
            if (score > bestScore) {
                bestScore = score;
                best = k;
            }
        }
        return best
            ? { reaction: best as AudienceReaction, intensity: bestScore / recent.length }
            : null;
    }

    startPoll(question: string, options: string[]): AudiencePoll {
        const poll: AudiencePoll = {
            id: `poll-${++this.pollIdCounter}`,
            round: 0,
            question,
            options,
            votes: Object.fromEntries(options.map((o) => [o, 0])),
            totalVotes: 0,
            closed: false,
            winner: null,
        };
        this.activePoll = poll;

        for (const m of this.members) {
            m.hasVoted = false;
        }

        if (this.pollTimer) clearTimeout(this.pollTimer);
        this.pollTimer = setTimeout(() => this.closePoll(), 30000);

        return poll;
    }

    closePoll(): AudiencePoll | null {
        if (!this.activePoll || this.activePoll.closed) return null;
        this.activePoll.closed = true;
        let maxVotes = 0;
        for (const [opt, count] of Object.entries(this.activePoll.votes)) {
            if (count > maxVotes) {
                maxVotes = count;
                this.activePoll.winner = opt;
            }
        }
        return this.activePoll;
    }

    vote(memberId: string, option: string): boolean {
        const member = this.members.find((m) => m.id === memberId);
        if (!member || !this.activePoll || this.activePoll.closed || member.hasVoted) return false;
        if (!Object.prototype.hasOwnProperty.call(this.activePoll.votes, option)) return false;
        member.hasVoted = true;
        this.activePoll.votes[option] = (this.activePoll.votes[option] || 0) + 1;
        this.activePoll.totalVotes++;
        return true;
    }

    triggerReaction(reaction: AudienceReaction, intensity = 0.5, targetAgentId?: string): void {
        const now = Date.now();
        if (now - this._lastReactionTime < this.RATE_LIMIT_MS) return;
        this._lastReactionTime = now;
        const reactingMembers = this.members.filter((m) =>
            _rng.chance(this.getReactionProbability(m, reaction)),
        );
        for (const m of reactingMembers) {
            const event: AudienceReactionEvent = {
                reaction,
                intensity: clamp(intensity * (0.5 + _rng.next() * 0.5), 0, 1),
                sourceId: m.id,
                sourceName: m.name,
                targetAgentId,
                timestamp: Date.now(),
            };
            this.reactions.push(event);
            if (this.reactions.length > this.MAX_REACTIONS)
                this.reactions = this.reactions.slice(-this.MAX_REACTIONS);
            m.currentReaction = reaction;
            if (this.memberTimers.has(m.id)) clearTimeout(this.memberTimers.get(m.id)!);
            this.memberTimers.set(
                m.id,
                setTimeout(() => {
                    m.currentReaction = null;
                }, 3000),
            );
        }
    }

    addMessage(memberId: string, text: string): void {
        const now = Date.now();
        if (now - this._lastMsgTime < this.RATE_LIMIT_MS) return;
        this._lastMsgTime = now;
        const member = this.members.find((m) => m.id === memberId);
        if (!member) return;
        const msg: AudienceSideChatMessage = {
            id: `chat-${Date.now()}-${_rng.nextInt(100000, 999999).toString(36)}`,
            memberId,
            memberName: member.name,
            emoji: member.emoji,
            text,
            timestamp: Date.now(),
            sentiment: text.includes('!') || text.includes('??') ? 'sarcastic' : 'neutral',
        };
        this.messages.push(msg);
        if (this.messages.length > this.MAX_MESSAGES)
            this.messages = this.messages.slice(-this.MAX_MESSAGES);
        member.message = text;
        const msgKey = `msg_${member.id}`;
        const existingMsgTimer = this.memberTimers.get(msgKey);
        if (existingMsgTimer) clearTimeout(existingMsgTimer);
        this.memberTimers.set(
            msgKey,
            setTimeout(() => {
                member.message = null;
                this.memberTimers.delete(msgKey);
            }, 8000),
        );
    }

    processArgument(_agentId: string, agentName: string, text: string): void {
        const classes = classifyArgument(text);

        for (const cls of classes) {
            const triggers = ARGUMENT_TRIGGERS[cls];
            if (!triggers) continue;
            for (const t of triggers) {
                if (_rng.chance(t.weight * 0.3)) {
                    this.triggerReaction(t.reaction, 0.3 + _rng.next() * 0.4);
                }
            }
        }

        const chatters = this.members.filter((m) => {
            const archetype = AUDIENCE_ARCHETYPES.find((a) => a.id === m.archetypeId);
            return archetype && _rng.chance(archetype.engagement * 0.12);
        });

        for (const member of chatters.slice(0, 3)) {
            const archetype = AUDIENCE_ARCHETYPES.find((a) => a.id === member.archetypeId)!;
            const templates = SIDE_CHAT_TEMPLATES[archetype.id] || FALLBACK_CHAT;
            const text_ = pick(templates).replace('{agent}', agentName);
            this.addMessage(member.id, text_);
        }
    }

    clear(): void {
        this.members = [];
        this.messages = [];
        this.reactions = [];
        this.activePoll = null;
    }

    private getReactionProbability(member: AudienceMember, reaction: AudienceReaction): number {
        const archetype = AUDIENCE_ARCHETYPES.find((a) => a.id === member.archetypeId);
        if (!archetype) return 0.1;
        const baseWeight = archetype.reactionWeights[reaction] || 0.1;
        const engagementMod = member.engagement;
        return clamp(baseWeight * engagementMod * (0.5 + _rng.next() * 0.5), 0, 0.95);
    }
}
