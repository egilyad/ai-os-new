import { genId } from '../../utils/gen-id';

export interface Skill {
    id: string;
    name: string;
    description: string;
    steps: string[];
    tags: string[];
    sourceTask?: string;
    createdAt: number;
    lastUsedAt?: number;
    useCount: number;
}

export interface RecordSkillInput {
    name: string;
    description: string;
    steps: string[];
    tags?: string[];
    sourceTask?: string;
}

export interface SkillStore {
    load(): Promise<Skill[]>;
    save(skills: Skill[]): Promise<void>;
}

/**
 * P2-1: Record a Skill — procedureal memory. A skill is a reusable, named
 * procedure (steps) captured from a task or session. It is stored via an
 * injected SkillStore so the storage backend (in-memory, KV, Dexie) can be
 * chosen by the caller without coupling to a concrete persistence layer.
 */
export class SkillService {
    private readonly skills = new Map<string, Skill>();

    constructor(private readonly store: SkillStore) {}

    async init(): Promise<void> {
        const loaded = await this.store.load();
        this.skills.clear();
        for (const s of loaded) this.skills.set(s.id, s);
    }

    async record(input: RecordSkillInput): Promise<Skill> {
        const skill: Skill = {
            id: genId('skill'),
            name: input.name.trim(),
            description: input.description.trim(),
            steps: input.steps.map((s) => s.trim()).filter(Boolean),
            tags: [...(input.tags ?? [])],
            sourceTask: input.sourceTask,
            createdAt: Date.now(),
            useCount: 0,
        };
        this.skills.set(skill.id, skill);
        await this.persist();
        return skill;
    }

    async markUsed(id: string): Promise<void> {
        const s = this.skills.get(id);
        if (!s) return;
        s.useCount += 1;
        s.lastUsedAt = Date.now();
        await this.persist();
    }

    list(): Skill[] {
        return [...this.skills.values()];
    }

    get(id: string): Skill | undefined {
        return this.skills.get(id);
    }

    search(query: string): Skill[] {
        const q = query.toLowerCase();
        return this.list().filter(
            (s) =>
                s.name.toLowerCase().includes(q) ||
                s.description.toLowerCase().includes(q) ||
                s.tags.some((t) => t.toLowerCase().includes(q)),
        );
    }

    async remove(id: string): Promise<void> {
        this.skills.delete(id);
        await this.persist();
    }

    private async persist(): Promise<void> {
        await this.store.save([...this.skills.values()]);
    }
}

export function createMemorySkillStore(initial: Skill[] = []): SkillStore {
    let data: Skill[] = [...initial];
    return {
        load: async () => [...data],
        save: async (skills) => {
            data = [...skills];
        },
    };
}

export function createKvSkillStore(
    kv: { getKv<T>(id: string): Promise<T | null>; setKv<T>(id: string, value: T): Promise<void> },
    key = 'skills:v1',
): SkillStore {
    return {
        load: async () => (await kv.getKv<Skill[]>(key)) ?? [],
        save: async (skills) => {
            await kv.setKv(key, skills);
        },
    };
}
