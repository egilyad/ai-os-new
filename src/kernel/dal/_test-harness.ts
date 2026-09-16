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
        get crews() {
            return dexie!.crews;
        },
        get crewTasks() {
            return dexie!.crewTasks;
        },
        get councilSessions() {
            return dexie!.councilSessions;
        },
        get councilMessages() {
            return dexie!.councilMessages;
        },
        get councilVotes() {
            return dexie!.councilVotes;
        },
        get graphs() {
            return dexie!.graphs;
        },
        get graphRuns() {
            return dexie!.graphRuns;
        },
        get graphCheckpoints() {
            return dexie!.graphCheckpoints;
        },
        get graphDecisions() {
            return dexie!.graphDecisions;
        },
        get ltMemories() {
            return dexie!.ltMemories;
        },
        get memoryLinks() {
            return dexie!.memoryLinks;
        },
        get personaProfiles() {
            return dexie!.personaProfiles;
        },
        get voices() {
            return dexie!.voices;
        },
        get personaDepths() {
            return dexie!.personaDepths;
        },
        get sharedContexts() {
            return dexie!.sharedContexts;
        },
        get contextEntries() {
            return dexie!.contextEntries;
        },
        get goals() {
            return dexie!.goals;
        },
        get hierarchyNodes() {
            return dexie!.hierarchyNodes;
        },
        get auditLog() {
            return dexie!.auditLog;
        },
        get mcpServers() {
            return dexie!.mcpServers;
        },
        get toolGrants() {
            return dexie!.toolGrants;
        },
        get sandboxTickets() {
            return dexie!.sandboxTickets;
        },
        get skillManifests() {
            return dexie!.skillManifests;
        },
        get missionWatches() {
            return dexie!.missionWatches;
        },
        get mobileSessions() {
            return dexie!.mobileSessions;
        },
        get notifications() {
            return dexie!.notifications;
        },
        get a2aAgents() {
            return dexie!.a2aAgents;
        },
        get fedPeers() {
            return dexie!.fedPeers;
        },
        get handoffs() {
            return dexie!.handoffs;
        },
        get collabContracts() {
            return dexie!.collabContracts;
        },
        get marketListings() {
            return dexie!.marketListings;
        },
        get marketBids() {
            return dexie!.marketBids;
        },
        get improvements() {
            return dexie!.improvements;
        },
        get strategies() {
            return dexie!.strategies;
        },
        get decompositions() {
            return dexie!.decompositions;
        },
        get healthSignals() {
            return dexie!.healthSignals;
        },
        get cogMemories() {
            return dexie!.cogMemories;
        },
        get memPolicies() {
            return dexie!.memPolicies;
        },
        get counterfactuals() {
            return dexie!.counterfactuals;
        },
        get knowledgePackages() {
            return dexie!.knowledgePackages;
        },
        get capabilities() {
            return dexie!.capabilities;
        },
        get trustScores() {
            return dexie!.trustScores;
        },
        get policyRules() {
            return dexie!.policyRules;
        },
        get govRoles() {
            return dexie!.govRoles;
        },
        get provenanceNodes() {
            return dexie!.provenanceNodes;
        },
        get provenanceEdges() {
            return dexie!.provenanceEdges;
        },
        get extensions() {
            return dexie!.extensions;
        },
        get bundles() {
            return dexie!.bundles;
        },
        get surfaces() {
            return dexie!.surfaces;
        },
        get osSnapshots() {
            return dexie!.osSnapshots;
        },
        get benchmarks() {
            return dexie!.benchmarks;
        },
        get evalRuns() {
            return dexie!.evalRuns;
        },
        get redFindings() {
            return dexie!.redFindings;
        },
        get simulations() {
            return dexie!.simulations;
        },
        get societyNorms() {
            return dexie!.societyNorms;
        },
        get orgs() {
            return dexie!.orgs;
        },
        get intents() {
            return dexie!.intents;
        },
        get modalCaps() {
            return dexie!.modalCaps;
        },
        get knowledgeSources() {
            return dexie!.knowledgeSources;
        },
        get trainGuides() {
            return dexie!.trainGuides;
        },
        get agentLoops() {
            return dexie!.agentLoops;
        },
        get groupChats() {
            return dexie!.groupChats;
        },
        get memoryBlocks() {
            return dexie!.memoryBlocks;
        },
        get runQueue() {
            return dexie!.runQueue;
        },
        get threads() {
            return dexie!.threads;
        },
        get scopedMem() {
            return dexie!.scopedMem;
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
            dexie!.crews.clear(),
            dexie!.crewTasks.clear(),
            dexie!.councilSessions.clear(),
            dexie!.councilMessages.clear(),
            dexie!.councilVotes.clear(),
            dexie!.graphs.clear(),
            dexie!.graphRuns.clear(),
            dexie!.graphCheckpoints.clear(),
            dexie!.graphDecisions.clear(),
            dexie!.ltMemories.clear(),
            dexie!.memoryLinks.clear(),
            dexie!.personaProfiles.clear(),
            dexie!.voices.clear(),
            dexie!.personaDepths.clear(),
            dexie!.sharedContexts.clear(),
            dexie!.contextEntries.clear(),
            dexie!.goals.clear(),
            dexie!.hierarchyNodes.clear(),
            dexie!.auditLog.clear(),
            dexie!.mcpServers.clear(),
            dexie!.toolGrants.clear(),
            dexie!.sandboxTickets.clear(),
            dexie!.skillManifests.clear(),
            dexie!.missionWatches.clear(),
            dexie!.mobileSessions.clear(),
            dexie!.notifications.clear(),
            dexie!.a2aAgents.clear(),
            dexie!.fedPeers.clear(),
            dexie!.handoffs.clear(),
            dexie!.collabContracts.clear(),
            dexie!.marketListings.clear(),
            dexie!.marketBids.clear(),
            dexie!.improvements.clear(),
            dexie!.strategies.clear(),
            dexie!.decompositions.clear(),
            dexie!.healthSignals.clear(),
            dexie!.cogMemories.clear(),
            dexie!.memPolicies.clear(),
            dexie!.counterfactuals.clear(),
            dexie!.knowledgePackages.clear(),
            dexie!.capabilities.clear(),
            dexie!.trustScores.clear(),
            dexie!.policyRules.clear(),
            dexie!.govRoles.clear(),
            dexie!.provenanceNodes.clear(),
            dexie!.provenanceEdges.clear(),
            dexie!.extensions.clear(),
            dexie!.bundles.clear(),
            dexie!.surfaces.clear(),
            dexie!.osSnapshots.clear(),
            dexie!.benchmarks.clear(),
            dexie!.evalRuns.clear(),
            dexie!.redFindings.clear(),
            dexie!.simulations.clear(),
            dexie!.societyNorms.clear(),
            dexie!.orgs.clear(),
            dexie!.intents.clear(),
            dexie!.modalCaps.clear(),
            dexie!.knowledgeSources.clear(),
            dexie!.trainGuides.clear(),
            dexie!.agentLoops.clear(),
            dexie!.groupChats.clear(),
            dexie!.memoryBlocks.clear(),
            dexie!.runQueue.clear(),
            dexie!.threads.clear(),
            dexie!.scopedMem.clear(),
        ]);
    };

    return { db, dexie, clearAll };
}
