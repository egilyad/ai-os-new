/**
 * Role Testing Sandbox Service
 * Tests roles before assignment to agents
 */

import { genId } from '../../utils/gen-id';
import { rootLogger } from './logger-service';
import type { ILLMClientService } from '../contracts/provider-adapter';
import type { IEventBus } from '../types/interfaces';
import { sanitizePromptVar } from '../../shared/utils/sanitize';
import { EVENTS } from '../events/event-names';
const MAX_RESULTS = 500; // B10-143: Cap results to prevent unbounded growth

const LOGGER = rootLogger.child('RoleSandbox');

export interface TestCase {
    id: string;
    roleId: string;
    name: string;
    prompt: string;
    expectedOutcome?: string;
    createdAt: number;
}

export interface TestResult {
    testId: string;
    roleId: string;
    success: boolean;
    response: string;
    metrics: {
        latencyMs: number;
        tokens: number;
        cost: number;
    };
    timestamp: number;
    feedback?: string;
}

export interface SandboxConfig {
    timeoutMs: number;
    maxTokens: number;
}

const DEFAULT_CONFIG: SandboxConfig = {
    timeoutMs: 30000,
    maxTokens: 1000,
};

export class RoleTestingSandboxService {
    private config: SandboxConfig;
    private testCases: Map<string, TestCase[]> = new Map();
    private results: TestResult[] = [];
    private llmClient: ILLMClientService;
    private _initialized = false;
    private async db(): Promise<import('../types/interfaces').IDatabaseService> {
        const { database } = await import('../instances/core-references');
        return database;
    }

    private _eventBus: IEventBus | null = null;

    constructor(
        llmClient: ILLMClientService,
        config: Partial<SandboxConfig> = {},
        eventBus?: IEventBus,
    ) {
        this.llmClient = llmClient;
        this.config = { ...DEFAULT_CONFIG, ...config };
        this._eventBus = eventBus ?? null;
    }

    async init(): Promise<void> {
        if (this._initialized) return;
        this._initialized = true;
        const saved = await (
            await this.db()
        ).getKv<{
            testCases: [string, TestCase[]][];
            results: TestResult[];
        }>('role_testing_data');
        if (saved) {
            for (const [roleId, cases] of saved.testCases) {
                this.testCases.set(roleId, cases);
            }
            this.results = saved.results || [];
        }
        LOGGER.info('RoleTestingSandbox', `Initialized with ${this.results.length} test results`);
    }

    /**
     * Run a test prompt with a role configuration
     */
    async runTest(
        roleId: string,
        systemPrompt: string,
        testPrompt: string,
        options?: {
            temperature?: number;
            model?: string;
        },
    ): Promise<TestResult> {
        const startTime = Date.now();
        const testId = genId('test');

        LOGGER.info('RoleTestingSandbox', 'Running test', { roleId, testId });

        try {
            const response = await this.llmClient.sendMessage(
                [
                    { role: 'system', content: sanitizePromptVar(systemPrompt) },
                    { role: 'user', content: sanitizePromptVar(testPrompt) },
                ],
                {
                    temperature: options?.temperature ?? 0.7,
                    model: options?.model,
                    maxTokens: this.config.maxTokens,
                },
            );

            const latencyMs = Date.now() - startTime;
            const tokens = response.tokens || 0;
            const cost = tokens * 0.00001; // Rough estimate

            const result: TestResult = {
                testId,
                roleId,
                success: !!response.content,
                response: response.content || '',
                metrics: { latencyMs, tokens, cost },
                timestamp: Date.now(),
            };

            this.results.push(result);
            // B10-143: Cap results array to prevent unbounded growth
            if (this.results.length > MAX_RESULTS) {
                this.results = this.results.slice(-MAX_RESULTS);
            }
            await this.save();

            this._eventBus?.emit(EVENTS.ROLE_SANDBOX_TEST_COMPLETED, result);
            LOGGER.info('RoleTestingSandbox', 'Test completed', {
                testId,
                success: result.success,
            });

            return result;
        } catch (error) {
            const latencyMs = Date.now() - startTime;
            const result: TestResult = {
                testId,
                roleId,
                success: false,
                response: `Error: ${String(error)}`,
                metrics: { latencyMs, tokens: 0, cost: 0 },
                timestamp: Date.now(),
                feedback: `Test failed: ${String(error)}`,
            };

            this.results.push(result);
            // B10-143: Cap results array to prevent unbounded growth
            if (this.results.length > MAX_RESULTS) {
                this.results = this.results.slice(-MAX_RESULTS);
            }
            await this.save();

            this._eventBus?.emit(EVENTS.ROLE_SANDBOX_TEST_FAILED, result);
            LOGGER.error('RoleTestingSandbox', 'Test failed', { testId, error });

            return result;
        }
    }

    /**
     * Compare multiple roles with the same test prompt
     */
    async compareRoles(
        roles: Array<{ id: string; systemPrompt: string }>,
        testPrompt: string,
    ): Promise<Map<string, TestResult>> {
        const results = new Map<string, TestResult>();

        for (const role of roles) {
            const result = await this.runTest(role.id, role.systemPrompt, testPrompt);
            results.set(role.id, result);
        }

        return results;
    }

    /**
     * Run saved test cases for a role
     */
    async runSavedTests(
        roleId: string,
        getSystemPrompt?: (roleId: string) => string,
    ): Promise<TestResult[]> {
        const testCases = this.testCases.get(roleId) || [];
        const systemPrompt = getSystemPrompt ? getSystemPrompt(roleId) : '';
        const results: TestResult[] = [];

        for (const testCase of testCases) {
            const result = await this.runTest(roleId, systemPrompt, testCase.prompt);
            results.push(result);
        }

        return results;
    }

    /**
     * Save a test case for a role
     */
    async saveTestCase(
        roleId: string,
        data: { name: string; prompt: string; expectedOutcome?: string },
    ): Promise<TestCase> {
        const id = genId('tc');
        const testCase: TestCase = {
            id,
            roleId,
            name: data.name,
            prompt: data.prompt,
            expectedOutcome: data.expectedOutcome,
            createdAt: Date.now(),
        };

        if (!this.testCases.has(roleId)) {
            this.testCases.set(roleId, []);
        }
        this.testCases.get(roleId)!.push(testCase);

        await this.save();
        LOGGER.info('RoleTestingSandbox', 'Test case saved', { roleId, testId: id });

        return testCase;
    }

    /**
     * Get test cases for a role
     */
    getTestCases(roleId: string): TestCase[] {
        return this.testCases.get(roleId) || [];
    }

    /**
     * Get test results for a role
     */
    getResults(roleId: string): TestResult[] {
        return this.results.filter((r) => r.roleId === roleId);
    }

    /**
     * Delete a test case
     */
    async deleteTestCase(roleId: string, testId: string): Promise<boolean> {
        const cases = this.testCases.get(roleId);
        if (!cases) return false;

        const index = cases.findIndex((tc) => tc.id === testId);
        if (index === -1) return false;

        cases.splice(index, 1);
        await this.save();
        return true;
    }

    /**
     * Get comparison metrics between roles
     */
    getComparisonMetrics(roleIds: string[]): {
        roleId: string;
        avgLatency: number;
        avgTokens: number;
        successRate: number;
        totalTests: number;
    }[] {
        return roleIds.map((roleId) => {
            const roleResults = this.results.filter((r) => r.roleId === roleId);
            const successful = roleResults.filter((r) => r.success);

            return {
                roleId,
                avgLatency:
                    roleResults.length > 0
                        ? roleResults.reduce((sum, r) => sum + r.metrics.latencyMs, 0) /
                          roleResults.length
                        : 0,
                avgTokens:
                    roleResults.length > 0
                        ? roleResults.reduce((sum, r) => sum + r.metrics.tokens, 0) /
                          roleResults.length
                        : 0,
                successRate: roleResults.length > 0 ? successful.length / roleResults.length : 0,
                totalTests: roleResults.length,
            };
        });
    }

    /**
     * Clear results for a role
     */
    async clearResults(roleId: string): Promise<void> {
        this.results = this.results.filter((r) => r.roleId !== roleId);
        await this.save();
        LOGGER.info('RoleTestingSandbox', 'Results cleared', { roleId });
    }

    destroy(): void {
        this._initialized = false;
        this.testCases.clear();
        this.results = [];
    }

    private async save(): Promise<void> {
        const testCasesEntries: [string, TestCase[]][] = Array.from(this.testCases.entries());
        await (
            await this.db()
        ).setKv('role_testing_data', {
            testCases: testCasesEntries,
            results: this.results.slice(-1000), // Keep last 1000 results
        });
    }
}
