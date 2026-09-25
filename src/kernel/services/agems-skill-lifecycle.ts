import { getDexieDb } from './database-service';

export type SkillState = 'ACTIVE' | 'STALE' | 'ARCHIVED';

export async function detectStaleSkills(days = 30): Promise<number> {
    const since = Date.now() - days * 86400000;
    const skills = (await getDexieDb().skills.toArray()) as Array<{ id: string; lastUsedAt?: number; status?: string }>;
    let count = 0;
    for (const s of skills) {
        const last = s.lastUsedAt ?? 0;
        if (last < since && s.status !== 'archived') {
            await getDexieDb().skills.update(s.id, { status: 'archived' } as never);
            count++;
        }
    }
    return count;
}

export async function setSkillState(skillId: string, state: SkillState): Promise<void> {
    const status = state.toLowerCase();
    await getDexieDb().skills.update(skillId, { status } as never);
}
