/**
 * RivalLabs config — one card per RIVAL service (phases R/T/V/W/X/Y/Z).
 *
 * Data-driven UI surface: each entry maps a lazyService + one representative
 * method + an arg mapper over max 2 text inputs. Complex signatures are
 * adapted (csv/lines/pairs splits) so every card stays a single Run button.
 * Full method surface remains available in code; the panel is the demo/probe
 * surface, not a second orchestrator.
 */
import * as S from '../../kernel/instances/services-extras';

export type CardArgs = 'none' | 'a' | 'ab';

export interface RivalServiceDef {
    key: string;
    title: string;
    svc: unknown;
    method: string;
    args: CardArgs;
    map: (a: string, b: string) => unknown[];
    run?: (a: string, b: string) => Promise<unknown>;
}

export interface RivalPhaseDef {
    id: 'r' | 't' | 'v' | 'w' | 'x' | 'y' | 'z';
    services: RivalServiceDef[];
}

const A = (fn: (a: string, b: string) => unknown[]): ((a: string, b: string) => unknown[]) => fn;
const csv = (s: string): string[] =>
    s.split(',').map((x) => x.trim()).filter(Boolean);
const lines = (s: string): string[] =>
    s.split('\n').map((x) => x.trim()).filter(Boolean);
const pairsRecord = (s: string): Record<string, number> => {
    const out: Record<string, number> = {};
    for (const part of s.split(',')) {
        const i = part.indexOf(':');
        if (i < 0) continue;
        const k = part.slice(0, i).trim();
        const v = Number(part.slice(i + 1).trim());
        if (k && Number.isFinite(v)) out[k] = v;
    }
    return out;
};
const one = (a: string): unknown[] => [a];
const two = (a: string, b: string): unknown[] => [a, b];
const none = (): unknown[] => [];

function def(
    key: string,
    title: string,
    svc: unknown,
    method: string,
    args: CardArgs,
    map: (a: string, b: string) => unknown[] = none,
    run?: (a: string, b: string) => Promise<unknown>,
): RivalServiceDef {
    return { key, title, svc, method, args, map, run };
}

export const RIVAL_PHASES: RivalPhaseDef[] = [
    {
        id: 'r',
        services: [
            def('constit', 'Constitutional', S.constitutionalService, 'critique', 'a', A(one)),
            def('voyager', 'Voyager', S.voyagerService, 'step', 'none'),
            def('smallville', 'Smallville', S.smallvilleService, 'reflect', 'a', A(one)),
            def('alphacode', 'AlphaCode', S.alphaCodeService, 'generate', 'a', A(one)),
            def('worldmodel', 'WorldModel', S.worldModelService, 'predict', 'ab', A(two)),
            def('neuro', 'NeuroSymbolic', S.neuroSymbolicService, 'query', 'ab', A(two)),
            def('swarm', 'Swarm', S.swarmService, 'pso', 'a', A(one)),
            def('alife', 'ALife', S.alifeService, 'tick', 'none'),
            def('curiosity', 'Curiosity', S.curiosityService, 'pickAction', 'ab', A((a, b) => [a, csv(b)])),
            def('quantum', 'QuantumDeep', S.quantumDeepService, 'defineQubo', 'a', A((a) => [csv(a), []])),
        ],
    },
    {
        id: 't',
        services: [
            def('claudecode', 'ClaudeCode', S.claudeCodeService, 'proposePlan', 'a', A(one)),
            def('mcpdeep', 'MCP-Deep', S.mcpDeepService, 'connectAll', 'none'),
            def('computer', 'Computer+', S.computerService, 'act', 'ab', A(two)),
            def('files', 'FilesApi', S.filesApiService, 'list', 'none'),
            def('cache', 'CacheControl', S.cacheControlService, 'stats', 'none'),
            def('project', 'Project', S.projectService, 'createProject', 'a', A(one)),
            def('dynwf', 'DynamicWorkflow', S.dynamicWorkflowService, 'run', 'a', A((a) => [lines(a)])),
            def(
                'routine',
                'Routine',
                S.routineService,
                'define',
                'ab',
                A((a, b) => [a || 'demo', { kind: 'api', spec: b || 'manual' }, [a || 'demo']]),
            ),
            def('agentview', 'AgentView', S.agentViewService, 'sessions', 'none'),
        ],
    },
    {
        id: 'v',
        services: [
            def('sci', 'SciAgents', S.sciAgentsService, 'hypothesize', 'a', A(one)),
            def('sparks', 'Sparks', S.sparksService, 'cycle', 'a', A(one)),
            def('aisci', 'AI-Scientist', S.aiScientistService, 'runNext', 'none'),
            def('latent', 'LAteNT', S.latentService, 'synthesize', 'none'),
            def('eight', '8-Stage', S.eightStageService, 'run', 'a', A(one)),
            def('cognitae', 'Cognitae', S.cognitaeService, 'run', 'a', A(one)),
            def('cogteam', 'CogTeam', S.cogTeamService, 'run', 'a', A(one)),
            def('syn', 'Syn', S.synService, 'sleep', 'none'),
            def('helix', 'Helix', S.helixService, 'gaps', 'none'),
            def('ideator', 'Ideator', S.ideatorService2, 'testDialogues', 'a', A(one)),
        ],
    },
    {
        id: 'w',
        services: [
            def('rck', 'RCK', S.rckService, 'bind', 'ab', A(two)),
            def('cognee', 'Cognee', S.cogneeService, 'recall', 'a', A(one)),
            def('metan', 'Metan', S.metanService, 'buildHierarchy', 'a', A(one)),
            def('concepts', 'Concepts', S.conceptsService, 'compose', 'ab', A(two)),
            def('secondbrain', 'SecondBrain', S.secondBrainService, 'run', 'a', A(one)),
            def('storm', 'STORM', S.stormService2, 'research', 'a', A(one)),
            def('bb', 'Blackboard', S.blackboardService2, 'tick', 'none'),
            def('metactrl', 'MetaCtrl', S.metaControllerService2, 'pick', 'a', A(one)),
            def('dolores', 'DOLORES', S.doloresService2, 'trace', 'none'),
            def('episteme', 'Episteme', S.epistemeService2, 'sync', 'ab', A(two)),
        ],
    },
    {
        id: 'x',
        services: [
            def('metakb', 'Meta-KB', S.metaKbService, 'query', 'a', A(one)),
            def('researchos', 'Research-OS', S.researchOsService, 'createFolder', 'a', A(one)),
            def('deep2', 'DeepResearch-2', S.deepResearch2Service, 'run', 'a', A(one)),
            def('darwin', 'Darwin', S.darwinService, 'evolve', 'a', A(one)),
            def('qyvaria', 'Qyvaria', S.qyvariaService, 'query', 'a', A(one)),
            def('parliament', 'Parliamentary', S.parliamentaryService, 'run', 'a', A(one)),
            def('policy', 'PolicyDebate', S.policyDebateService, 'run', 'ab', A(two)),
            def('socratic', 'Socratic', S.socraticService2, 'discuss', 'a', A(one)),
            def('fishbowl', 'Fishbowl', S.fishbowlService, 'rotate', 'a', A(one)),
            def('delphi', 'Delphi', S.delphiService, 'round', 'a', A((a) => [pairsRecord(a)])),
        ],
    },
    {
        id: 'y',
        services: [
            def('pi', 'Pi Toolkit', S.piService, 'dispatch', 'a', A(one), async (a) => {
                const svc = S.piService as unknown as {
                    registerTool(name: string): Promise<void>;
                    dispatch(tool: string): Promise<string>;
                };
                const name = a.trim() || 'demo-tool';
                await svc.registerTool(name);
                return svc.dispatch(name);
            }),
            def('zed', 'Zed', S.zedService, 'openBuffer', 'ab', A(two)),
            def('warp', 'Warp', S.warpService, 'block', 'a', A(one)),
            def('gpe', 'gpt-engineer', S.gptEngineerService, 'run', 'a', A(one)),
            def('goose', 'Goose', S.gooseService, 'runRecipe', 'ab', A((a) => [a]), async (a, b) => {
                const svc = S.gooseService as unknown as {
                    recipe(name: string, steps: string[]): Promise<string>;
                    runRecipe(name: string): Promise<string>;
                };
                const name = a.trim() || 'demo-recipe';
                await svc.recipe(name, [b.trim() || 'step']);
                return svc.runRecipe(name);
            }),
            def('continue', 'Continue', S.continueService, 'chat', 'a', A(one)),
            def('tabby', 'Tabby', S.tabbyService, 'complete', 'a', A(one)),
            def('pilot', 'gpt-pilot', S.gptPilotService, 'start', 'a', A(one)),
            def('void', 'Void', S.voidService, 'session', 'a', A(one)),
            def('crush', 'Crush', S.crushService, 'pretty', 'a', A(one)),
            def('whale', 'CodeWhale', S.codeWhaleService, 'cargoCheck', 'none'),
        ],
    },
    {
        id: 'z',
        services: [
            def('codex', 'Codex', S.codexService, 'prompt', 'a', A(one)),
            def('geminicli', 'GeminiCLI', S.geminiCliService, 'chat', 'a', A(one)),
            def('kilo', 'Kilo', S.kiloService, 'fanout', 'a', A(one)),
            def('interp', 'Interpreter', S.interpreterService, 'exec', 'a', A(one)),
            def('miniswe', 'Mini-SWE', S.miniSweService, 'solve', 'a', A(one)),
            def('helicone', 'Helicone', S.heliconeService, 'hits', 'none'),
            def('portkey', 'Portkey', S.portkeyService, 'route', 'a', A(one)),
            def('litelm', 'LiteLLM', S.liteLlmService, 'proxy', 'ab', A(two)),
            def('langfuse', 'Langfuse', S.langfuseService, 'eval', 'a', A(one)),
        ],
    },
];
