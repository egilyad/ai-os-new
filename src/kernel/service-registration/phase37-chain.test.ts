import '../../tests/setup-runtime';
import { describe, it, expect } from 'vitest';
import { runtime } from '../runtime';
import type {
    IAppBuilderService,
    IIdeService,
    IPromptHubService,
    IOntologyService,
    IAclService,
    IWorkQueueService,
    IWriterService,
    IComputerService,
    ISearchService,
    ICodeExecService,
} from '../contracts/rivals5';

const get = <T>(token: string): T => runtime.getService<T>(token);

describe('Phase37 e2e chain (J)', () => {
    it('scaffold → ask → prompt → onto → acl → work → writer → computer → search → codeexec', async () => {
        const app = get<IAppBuilderService>('appBuilderService');
        expect((await app.clarify('todo app with auth')).length).toBeGreaterThan(0);

        const ide = get<IIdeService>('ideService');
        expect((await ide.terminal('npm test')).length).toBeGreaterThan(0);

        const hub = get<IPromptHubService>('promptHubService');
        await hub.publish('greet', 'Hello {{name}}!');
        expect(await hub.render('greet', { name: 'Al' })).toContain('Al');

        const onto = get<IOntologyService>('ontologyService');
        await onto.defineType('Customer', ['name', 'email']);
        expect(await onto.createInstance('Customer', { name: 'n', email: 'e' })).toBeDefined();

        const acl = get<IAclService>('aclService');
        await acl.tagSource('src-1', ['analyst']);
        expect(Array.isArray(await acl.searchScoped('analyst', 'q'))).toBe(true);

        const work = get<IWorkQueueService>('workQueueService');
        expect((await work.push({ job: 'triage' })).length).toBeGreaterThan(0);

        const writer = get<IWriterService>('writerService');
        expect((await writer.check('Hello world.')).score).toBe(1);

        const computer = get<IComputerService>('computerService');
        expect(await computer.act('no-ticket', 'screenshot', {})).toContain('handoff');

        const search = get<ISearchService>('searchService');
        expect(Array.isArray(await search.search('pricing', 4))).toBe(true);

        const codeexec = get<ICodeExecService>('codeExecService');
        const ticketId = await codeexec.submit('python', 'print(1)');
        expect(await codeexec.result(ticketId)).toContain('queued');
    }, 60000);
});
