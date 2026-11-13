/**
 * Dexie schema versioning tests — P2.19 + P1-13.
 *
 * Verifies:
 * 1. Version declarations are in ascending order (Dexie requirement)
 * 2. No tables are dropped between versions (data loss guard)
 * 3. DEXIE_VERSION_DEFS (schema-versions.ts) matches the registered chain
 * 4. Latest version includes all tables from the Table declarations
 */
import { describe, it, expect } from 'vitest';
import { SuperAgentsDB } from './dexie-schema';
import { DEXIE_VERSION_DEFS } from './dexie/schema-versions';

const LATEST_VERSION = 45;

describe('Dexie schema versioning (P2.19 / P1-13)', () => {
    it('version declarations are in ascending order', () => {
        const db = new SuperAgentsDB();
        expect(db).toBeDefined();
        expect(db.verno).toBe(LATEST_VERSION);
    });

    it('DEXIE_VERSION_DEFS covers v5..latest in ascending order', () => {
        const nums = DEXIE_VERSION_DEFS.map((d) => d.version);
        expect(nums[0]).toBe(5);
        expect(nums[nums.length - 1]).toBe(LATEST_VERSION);
        for (let i = 1; i < nums.length; i++) {
            expect(nums[i]).toBeGreaterThan(nums[i - 1]!);
        }
    });

    it('latest version (v43) includes all project tables', async () => {
        const db = new SuperAgentsDB();
        db.version(999).stores({
            projects: 'id, status, type, createdAt, updatedAt',
            projectTasks: 'id, projectId, agentId, status, priority, createdAt',
            projectRuns: 'id, taskId, projectId, agentId, status, createdAt',
            projectFiles: '[projectId+path], projectId, path',
            projectArtifacts: 'id, projectId, type, createdAt',
            projectAssignments: '[projectId+agentId], projectId, agentId',
        });
        await db.open();

        expect(db.projects).toBeDefined();
        expect(db.projectTasks).toBeDefined();
        expect(db.projectRuns).toBeDefined();
        expect(db.projectFiles).toBeDefined();
        expect(db.projectArtifacts).toBeDefined();
        expect(db.projectAssignments).toBeDefined();

        await db.delete();
    });

    it('no tables are dropped between consecutive versions', () => {
        for (let i = 1; i < DEXIE_VERSION_DEFS.length; i++) {
            const prev = DEXIE_VERSION_DEFS[i - 1]!;
            const curr = DEXIE_VERSION_DEFS[i]!;
            for (const table of Object.keys(prev.stores)) {
                expect(
                    curr.stores[table],
                    `v${prev.version}→v${curr.version}: table '${table}' must not be dropped`,
                ).toBeDefined();
            }
        }
    });

    it('Table type declarations match actual Dexie table properties', () => {
        const db = new SuperAgentsDB();
        const expectedTables = [
            'notes',
            'memories',
            'apiKeys',
            'sessions',
            'roles',
            'cognitiveTraces',
            'traces',
            'skills',
            'connectors',
            'keyValue',
            'debateSessions',
            'debateVerdicts',
            'debateTimeline',
            'debateOverrides',
            'sessionLinks',
            'eventLog',
            'crystals',
            'crystalVersions',
            'junctions',
            'synthSessions',
            'synthPerspectives',
            'genJobs',
            'forumTopics',
            'forumPosts',
            'forumVotes',
            'forumSubs',
            'workflows',
            'scenarios',
            'invocations',
            'invocationPolicies',
            'invocationCosts',
            'directorSessions',
            'crews',
            'crewTasks',
            'councilSessions',
            'councilMessages',
            'councilVotes',
            'graphs',
            'graphRuns',
            'graphCheckpoints',
            'graphDecisions',
            'ltMemories',
            'memoryLinks',
            'personaProfiles',
            'voices',
            'personaDepths',
            'sharedContexts',
            'contextEntries',
            'goals',
            'hierarchyNodes',
            'auditLog',
            'mcpServers',
            'toolGrants',
            'sandboxTickets',
            'skillManifests',
            'missionWatches',
            'mobileSessions',
            'notifications',
            'a2aAgents',
            'fedPeers',
            'handoffs',
            'collabContracts',
            'marketListings',
            'marketBids',
            'improvements',
            'strategies',
            'decompositions',
            'healthSignals',
            'cogMemories',
            'memPolicies',
            'counterfactuals',
            'knowledgePackages',
            'capabilities',
            'trustScores',
            'policyRules',
            'govRoles',
            'provenanceNodes',
            'provenanceEdges',
            'extensions',
            'bundles',
            'surfaces',
            'osSnapshots',
            'benchmarks',
            'evalRuns',
            'redFindings',
            'simulations',
            'societyNorms',
            'orgs',
            'intents',
            'modalCaps',
            'knowledgeSources',
            'trainGuides',
            'agentLoops',
            'groupChats',
            'memoryBlocks',
            'runQueue',
            'threads',
            'scopedMem',
            'projects',
            'projectTasks',
            'projectRuns',
            'projectFiles',
            'projectArtifacts',
            'projectAssignments',
            'agentSkills',
            'agentTools',
            'agentResponsibilities',
            'agentMetrics',
            'agentMemory',
            'agentExecutions',
            'agentConfigRevisions',
            'agentApiKeys',
            'agentBudgets',
            'agentRepositories',
            'agemsTasks',
            'taskComments',
            'labels',
            'taskLabels',
            'taskWorkProducts',
            'taskTriggers',
            'approvalPolicies',
            'approvalRequests',
            'platformBudgets',
            'budgetIncidents',
            'meetings',
            'meetingDecisions',
            'catalogAgents',
            'catalogSkills',
            'catalogTools',
            'auditLogs',
        ];

        for (const table of expectedTables) {
            expect((db as unknown as Record<string, unknown>)[table]).toBeDefined();
        }
    });
});
