/**
 * Integration test: the assistant on the real container.
 *
 * The unit tests prove the parts. This test proves the wiring: the phases
 * register the services, the actions exist, the trust ledger is seeded with
 * the panels of the system, and a whole turn runs end to end with a stubbed
 * model.
 */
import { describe, it, expect, beforeAll, vi } from 'vitest';
import 'fake-indexeddb/auto';
import { Container } from '../../container';
import { EventBus } from '../../events/event-bus';
import { registerServices } from '../../service-registration/index';
import { createDexieStorage } from '../storage/dexie-storage';
import { db as coreDatabase } from '../database-service';
import { LoggerService } from '../logger-service';
import type { AssistantActionRegistry } from './assistant-action-registry';
import type { CapabilityTrustService } from '../capability-trust/capability-trust-service';
import type { ProjectKnowledgeService } from './project-knowledge-service';
import type { AssistantService } from './assistant-service';
import type { AssistantDiaryService } from './assistant-diary-service';
import type { AssistantExamService } from './assistant-exam-service';
import type { ILLMClientService } from '../../contracts/provider-adapter';

let container: Container;
let eventBus: EventBus;

beforeAll(() => {
    container = new Container();
    eventBus = new EventBus(false);
    // The same services the runtime and the bootstrap register before the
    // phases run.
    container.register('logger', new LoggerService('Bootstrap'));
    container.register('database', coreDatabase);
    container.register('eventBus', eventBus);
    container.register('storageLayer', createDexieStorage());
    registerServices(container, eventBus, () => {
        /* lifecycle registration is not needed for the wiring test */
    });
});

describe('assistant wiring on the real container', () => {
    it('registers the assistant services', () => {
        expect(container.get('projectKnowledgeService')).toBeDefined();
        expect(container.get('assistantActionRegistry')).toBeDefined();
        expect(container.get('capabilityTrustService')).toBeDefined();
        expect(container.get('assistantNavigationService')).toBeDefined();
    });

    it('exposes the actions of every group', () => {
        const registry = container.get<AssistantActionRegistry>('assistantActionRegistry');
        const groups = registry.groups();
        expect(groups.research).toBeGreaterThan(0);
        expect(groups.navigation).toBeGreaterThan(0);
        expect(groups.work).toBeGreaterThan(0);
        expect(groups.coordination).toBeGreaterThan(0);

        const ids = registry.list().map((a) => a.id);
        expect(ids).toContain('system.find');
        expect(ids).toContain('system.exam');
        expect(ids).toContain('system.diagnose');
        expect(ids).toContain('ui.openPanel');
    });

    it('seeds the trust ledger with the panels of the system', () => {
        const trust = container.get<CapabilityTrustService>('capabilityTrustService');
        const stats = trust.stats();
        expect(stats.discovered).toBeGreaterThan(50);
        expect(trust.get('panel:memory')?.trust).toBe('discovered');
        expect(trust.get('action:system.find')?.trust).toBe('discovered');
    });

    it('knows the panels of the real system', () => {
        const knowledge = container.get<ProjectKnowledgeService>('projectKnowledgeService');
        expect(knowledge.panelsMatching().length).toBeGreaterThan(50);
        expect(knowledge.panel('assistant')?.route).toBe('/assistant');
    });

    it('runs a whole turn: the model calls an action and the answer is grounded', async () => {
        const llm = {
            sendMessage: vi
                .fn()
                .mockResolvedValueOnce({
                    content: '',
                    toolCalls: [
                        {
                            id: 'c1',
                            type: 'function',
                            function: { name: 'system.find', arguments: '{"query":"память"}' },
                        },
                    ],
                    latency: 1,
                    tokens: 1,
                })
                .mockResolvedValueOnce({
                    content: 'Панель памяти: /memory',
                    latency: 1,
                    tokens: 1,
                }),
        } as unknown as ILLMClientService;

        container.override('llmClientService', () => llm);

        const service = container.get<AssistantService>('projectAssistantService');
        const result = await service.ask({ text: 'где панель памяти?' });

        expect(result.content).toContain('/memory');
        expect(result.toolCalls).toContain('system.find');
        expect(result.rounds).toBe(2);

        // The action ran, so the ledger moved from discovered to verified.
        const trust = container.get<CapabilityTrustService>('capabilityTrustService');
        expect(trust.get('action:system.find')?.trust).toBe('verified');
    });

    it('exposes the diary and the exam', () => {
        expect(container.get('assistantDiaryService')).toBeDefined();
        expect(container.get('assistantExamService')).toBeDefined();
    });
});

describe('exam and diary on the real container', () => {
    it('refuses to claim a capability that was never executed', async () => {
        const exam = container.get<AssistantExamService>('assistantExamService');
        const verdict = await exam.examine('action:agents.spawn');
        expect(verdict.passed).toBe(false);
        expect(['discovered', 'declared']).toContain(verdict.level);
    });

    it('records a diary entry in the journal', async () => {
        const diary = container.get<AssistantDiaryService>('assistantDiaryService');
        const entry = await diary.write({
            kind: 'lesson',
            text: 'Проверка интеграции: дневник пишется',
            evidence: 'integration test',
        });
        expect(entry.id).toBeTruthy();
        expect(diary.recent(5).some((e) => e.text.includes('Проверка интеграции'))).toBe(true);
    });
});
