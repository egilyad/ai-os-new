/**
 * OpenClawService — N.2 (OpenClaw import layer, additive).
 *
 * - SOUL.md → CharacterDoc → real persona stack (name/role/personality,
 *   rules→beliefs, skills→toolkit note, style→commStyle).
 * - AGENTS.md → peers (@mentions) + handoff rules (→ collaboration contracts
 *   via CoordinationService when wired).
 * - HEARTBEAT.md → cron entries in kv (`claw-cron/*`) + `dueCron()` matcher
 *   (minute/hour/dow/wildcard fields; checked by scheduler/Fleet).
 * - Channels registry (telegram/whatsapp/discord/...) in kv.
 * - ClawHub publish → SkillMarket manifest.
 */
import type { IEventBus } from '../../types/interfaces';
import type { DataAccessLayer } from '../../dal/types';
import type { ICharacterService } from '../../contracts/rivals2';
import type { ISkillMarketService } from '../../contracts/ops';
import type { IOpenClawService } from '../../contracts/rivals9';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('OpenClaw');

interface CronEntry {
    id: string;
    agent: string;
    message: string;
    minute: string;
    hour: string;
    dow: string;
}

function section(md: string, title: string): string {
    const m = md.match(new RegExp(`^#+\\s*${title}\\s*$([\\s\\S]*?)(?=^#+\\s|\\Z)`, 'mi'));
    return (m?.[1] ?? '').trim();
}

function parseCronLine(line: string): { minute: string; hour: string; dow: string } | null {
    // Accepts "Every day at 9:00 AM", "Every Monday at 10:00", "*/15 * * * *".
    const cron = line.match(/(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)/);
    if (cron) return { minute: cron[1] as string, hour: cron[2] as string, dow: cron[5] as string };
    const daily = line.match(/every day at (\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (daily) {
        let h = Number(daily[1]);
        if (/pm/i.test(daily[3] ?? '') && h < 12) h += 12;
        return { minute: String(Number(daily[2])), hour: String(h), dow: '*' };
    }
    const weekly = line.match(/every (\w+) at (\d{1,2}):(\d{2})/i);
    if (weekly) {
        const days: Record<string, string> = {
            sunday: '0', monday: '1', tuesday: '2', wednesday: '3',
            thursday: '4', friday: '5', saturday: '6',
        };
        return {
            minute: String(Number(weekly[3])),
            hour: String(Number(weekly[2])),
            dow: days[(weekly[1] ?? '').toLowerCase()] ?? '*',
        };
    }
    return null;
}

function fieldMatch(field: string, value: number): boolean {
    if (field === '*') return true;
    if (field.startsWith('*/')) {
        const n = Number(field.slice(2));
        return n > 0 && value % n === 0;
    }
    return field.split(',').some((p) => Number(p) === value);
}

export class OpenClawService implements IOpenClawService {
    constructor(
        private dal: DataAccessLayer,
        private events: IEventBus,
        private characters: ICharacterService,
        private skills?: ISkillMarketService,
    ) {}

    async init(): Promise<void> {
        LOGGER.info('init', {});
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    async importSoul(markdown: string): Promise<string> {
        const identity = (section(markdown, 'Identity') || markdown.split('\n')[0]) ?? 'Claw';
        const rules = section(markdown, 'Rules');
        const skills = section(markdown, 'Skills');
        const style = section(markdown, 'Style');
        const name = (identity.match(/name[:\s]+(.+)/i)?.[1] ?? identity.split('\n')[0] ?? 'Claw').trim().slice(0, 80);
        const personId = await this.characters.importCharacter({
            name,
            bio: identity.split('\n').map((l) => l.trim()).filter((l) => l.length > 0).slice(0, 10),
            lore: rules ? rules.split('\n').map((l) => l.trim()).filter((l) => l.length > 0).slice(0, 10) : [],
            style: { chat: style ? [style.slice(0, 500)] : [] },
            topics: skills ? skills.split(/[,;\n]/).map((s) => s.trim()).filter((s) => s.length > 0).slice(0, 12) : [],
            adjectives: [],
        });
        this.events.emit(EVENTS.CLAW_SOUL, { personId, name });
        return personId;
    }

    async importAgentsRoster(markdown: string): Promise<{ agents: number; handoffs: number }> {
        const mentions = [...markdown.matchAll(/@([a-zA-Z0-9_-]+)/g)].map((m) => m[1] as string);
        const agents = [...new Set(mentions)];
        const handoffs = [...markdown.matchAll(/(?:handoff|pass|delegate)[^\n]{0,120}/gi)].length;
        await this.dal.kv.set('claw-roster', { agents, handoffs, at: Date.now() });
        return { agents: agents.length, handoffs };
    }

    async importHeartbeat(markdown: string): Promise<string[]> {
        const ids: string[] = [];
        for (const line of markdown.split('\n')) {
            const sched = parseCronLine(line);
            if (!sched) continue;
            const agent = line.match(/@([a-zA-Z0-9_-]+)/)?.[1] ?? 'default';
            const entry: CronEntry = {
                id: genId('clawcron'),
                agent,
                message: line.trim().slice(0, 500),
                ...sched,
            };
            await this.dal.kv.set(`claw-cron/${entry.id}`, entry);
            ids.push(entry.id);
        }
        this.events.emit(EVENTS.CLAW_CRON, { count: ids.length });
        return ids;
    }

    async registerChannel(name: string, kind: string): Promise<void> {
        await this.dal.kv.set(`claw-channels/${name.slice(0, 80)}`, { kind: kind.slice(0, 40), at: Date.now() });
    }

    async listChannels(): Promise<Array<{ name: string; kind: string }>> {
        const rows = await this.dal.kv.list('claw-channels/');
        return rows.map((r) => {
            const v = r.value as { kind: string };
            return { name: r.id.replace(/^claw-channels\//, ''), kind: v.kind };
        });
    }

    async dueCron(nowMs = Date.now()): Promise<Array<{ id: string; agent: string; message: string }>> {
        const d = new Date(nowMs);
        const rows = await this.dal.kv.list('claw-cron/');
        const due: Array<{ id: string; agent: string; message: string }> = [];
        for (const r of rows) {
            const e = r.value as CronEntry;
            if (
                fieldMatch(e.minute, d.getMinutes()) &&
                fieldMatch(e.hour, d.getHours()) &&
                fieldMatch(e.dow, d.getDay())
            ) {
                // Fire once per minute: skip if already fired this minute.
                const firedAt = await this.dal.kv.get<number>(`claw-fired/${e.id}`);
                const minuteKey = Math.floor(nowMs / 60000);
                if (firedAt !== minuteKey) {
                    await this.dal.kv.set(`claw-fired/${e.id}`, minuteKey);
                    due.push({ id: e.id, agent: e.agent, message: e.message });
                }
            }
        }
        return due;
    }

    async publishClawSkill(input: { name: string; description: string; permissions?: string[] }): Promise<string> {
        if (!this.skills) throw new Error('Skill market unavailable');
        const manifest = await this.skills.publish({
            name: input.name,
            version: '0.1.0',
            description: `[clawhub] ${input.description.slice(0, 400)}`,
            permissions: input.permissions ?? [],
            entry: 'SKILL.md',
            author: 'clawhub',
        });
        return manifest.id;
    }
}
