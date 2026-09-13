import '../../tests/setup-runtime';
import { describe, it, expect } from 'vitest';
import { runtime } from '../runtime';
import type {
    ICopilotService,
    IBedrockService,
    ICxfService,
    IAgentforceService,
    IEntityService,
    IKoreService,
    ICampaignService,
    IEmployeeService,
    ICodeAgentService,
    IAssistantService,
    IGumService,
} from '../contracts/rivals4';

const get = <T>(token: string): T => runtime.getService<T>(token);

describe('Phase36 e2e chain (I)', () => {
    it('topic → guard → flow → force → entity → dialog → campaign → employee → code → assistant → form', async () => {
        const copilot = get<ICopilotService>('copilotService');
        expect(
            (await copilot.defineTopic({ name: 'help', triggerPhrases: ['help me'], reply: 'Hi {name}' })).length,
        ).toBeGreaterThan(0);

        const bedrock = get<IBedrockService>('bedrockService');
        expect((await bedrock.guard('hello, call me tomorrow')).ok).toBe(true);

        const cxf = get<ICxfService>('cxfService');
        expect((await cxf.createFlow('support')).length).toBeGreaterThan(0);

        const force = get<IAgentforceService>('agentforceService');
        expect((await force.defineTopic({ label: 'triage', instructions: 'sort requests' })).length).toBeGreaterThan(0);

        const entity = get<IEntityService>('entityService');
        expect(await entity.extractList('I want pizza and sushi', ['pizza', 'sushi'])).toEqual(['pizza', 'sushi']);

        const kore = get<IKoreService>('koreService');
        expect((await kore.startDialog('bot1', 'sess1')).length).toBeGreaterThan(0);

        const campaign = get<ICampaignService>('campaignService');
        expect((await campaign.createCampaign('promo', 'Sale!', [])).length).toBeGreaterThan(0);

        const employee = get<IEmployeeService>('employeeService');
        expect((await employee.hire({ name: 'ops-bot', triggers: ['invoice'] })).length).toBeGreaterThan(0);

        const codeAgent = get<ICodeAgentService>('codeAgentService');
        expect((await codeAgent.run('summarize task')).answer).toContain('offline');

        const assistant = get<IAssistantService>('assistantService');
        expect((await assistant.defineAssistant({ name: 'helper' })).length).toBeGreaterThan(0);

        const gum = get<IGumService>('gumService');
        expect(await gum.vaultRef('api-key-ref')).toBe('api-key-ref');
    }, 60000);
});
