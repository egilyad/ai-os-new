/**
 * Shared test harness for the Data Access Layer.
 *
 * Runs a real `SuperAgentsDB` (Dexie) instance on top of `fake-indexeddb`,
 * so repository tests exercise actual Dexie queries (compound indexes,
 * `.where().equals()`, `.sortBy()`, transactions) and the Zod `creating`
 * hooks from dexie-schema.
 *
 * NOT a *.test.* file — imported only by repository spec files.
 */

import { SuperAgentsDB } from '../services/dexie-schema';
import type { DatabaseService } from '../services/database-service';

let dexie: SuperAgentsDB | null = null;

export interface TestDb {
    db: DatabaseService;
    dexie: SuperAgentsDB;
    clearAll(): Promise<void>;
}

/** Get a single per-file SuperAgentsDB instance (tests run in isolated workers). */
export async function createTestDb(): Promise<TestDb> {
    if (!dexie) {
        dexie = new SuperAgentsDB();
        await dexie.open();
    } else if (!dexie.isOpen()) {
        await dexie.open();
    }

    const db = {
        get apiKeys() {
            return dexie!.apiKeys;
        },
        get notes() {
            return dexie!.notes;
        },
        get memories() {
            return dexie!.memories;
        },
        get sessions() {
            return dexie!.sessions;
        },
        get roles() {
            return dexie!.roles;
        },
        get cognitiveTraces() {
            return dexie!.cognitiveTraces;
        },
        get traces() {
            return dexie!.traces;
        },
        get skills() {
            return dexie!.skills;
        },
        get connectors() {
            return dexie!.connectors;
        },
        get keyValue() {
            return dexie!.keyValue;
        },
        get debateSessions() {
            return dexie!.debateSessions;
        },
        get debateVerdicts() {
            return dexie!.debateVerdicts;
        },
        get debateTimeline() {
            return dexie!.debateTimeline;
        },
        get debateOverrides() {
            return dexie!.debateOverrides;
        },
        get sessionLinks() {
            return dexie!.sessionLinks;
        },
        get eventLog() {
            return dexie!.eventLog;
        },
        get crystals() {
            return dexie!.crystals;
        },
        get crystalVersions() {
            return dexie!.crystalVersions;
        },
        get junctions() {
            return dexie!.junctions;
        },
        get synthSessions() {
            return dexie!.synthSessions;
        },
        get synthPerspectives() {
            return dexie!.synthPerspectives;
        },
        get genJobs() {
            return dexie!.genJobs;
        },
        get forumTopics() {
            return dexie!.forumTopics;
        },
        get forumPosts() {
            return dexie!.forumPosts;
        },
        get forumVotes() {
            return dexie!.forumVotes;
        },
        get forumSubs() {
            return dexie!.forumSubs;
        },
        get workflows() {
            return dexie!.workflows;
        },
        get scenarios() {
            return dexie!.scenarios;
        },
        get directorSessions() {
            return dexie!.directorSessions;
        },
        get invocations() {
            return dexie!.invocations;
        },
        get invocationPolicies() {
            return dexie!.invocationPolicies;
        },
        get db() {
            return dexie!;
        },
        async getKv<T>(id: string): Promise<T | null> {
            const record = await dexie!.keyValue.get(id);
            return record ? (record.value as T) : null;
        },
        async setKv<T>(id: string, value: T): Promise<void> {
            await dexie!.transaction('rw', dexie!.keyValue, async () => {
                const existing = await dexie!.keyValue.get(id);
                await dexie!.keyValue.put({
                    id,
                    value,
                    createdAt: existing?.createdAt ?? Date.now(),
                    version: (existing?.version ?? 0) + 1,
                });
            });
        },
    } as unknown as DatabaseService;

    const clearAll = async (): Promise<void> => {
        await Promise.all([
            dexie!.notes.clear(),
            dexie!.memories.clear(),
            dexie!.apiKeys.clear(),
            dexie!.sessions.clear(),
            dexie!.roles.clear(),
            dexie!.cognitiveTraces.clear(),
            dexie!.traces.clear(),
            dexie!.skills.clear(),
            dexie!.connectors.clear(),
            dexie!.keyValue.clear(),
            dexie!.debateSessions.clear(),
            dexie!.debateVerdicts.clear(),
            dexie!.debateTimeline.clear(),
            dexie!.debateOverrides.clear(),
            dexie!.sessionLinks.clear(),
            dexie!.eventLog.clear(),
            dexie!.crystals.clear(),
            dexie!.crystalVersions.clear(),
            dexie!.junctions.clear(),
            dexie!.synthSessions.clear(),
            dexie!.synthPerspectives.clear(),
            dexie!.genJobs.clear(),
            dexie!.forumTopics.clear(),
            dexie!.forumPosts.clear(),
            dexie!.forumVotes.clear(),
            dexie!.forumSubs.clear(),
            dexie!.workflows.clear(),
            dexie!.scenarios.clear(),
            dexie!.directorSessions.clear(),
            dexie!.invocations.clear(),
            dexie!.invocationPolicies.clear(),
        ]);
    };

    return { db, dexie, clearAll };
}
