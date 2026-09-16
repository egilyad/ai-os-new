export interface RivalsCatalogService {
    name: string;
    description: string;
}
export interface RivalsCatalogGroup {
    id: string;
    title: string;
    origin: string;
    services: RivalsCatalogService[];
}

export const RIVALS_CATALOG: RivalsCatalogGroup[] = [
    {
        id: 'rivals',
        title: 'Rivals Core (F)',
        origin: 'AutoGen/Swarm/Letta/MetaGPT',
        services: [
            { name: 'groupchatService', description: 'AutoGen-style speaker selection + nested chats' },
            { name: 'guardrailService', description: 'Swarm-style tripwires' },
            { name: 'memoryBlocksService', description: 'Letta-style core blocks' },
            { name: 'plannerService', description: 'Semantic Kernel planners + filters' },
            { name: 'sopService', description: 'MetaGPT SOP pipelines' },
        ],
    },
    {
        id: 'rivals2',
        title: 'Rivals2 (G)',
        origin: 'Aider/RAG/React',
        services: [
            { name: 'aiderService', description: 'Aider-style workspace' },
            { name: 'ragService', description: 'RAG retrieve→critique→refine' },
            { name: 'reactService', description: 'ReAct loop' },
        ],
    },
    {
        id: 'rivals3',
        title: 'Rivals3 (H)',
        origin: 'BotRouter/CodePlan',
        services: [
            { name: 'botrouterService', description: 'Bot routing' },
            { name: 'codeplanService', description: 'Code planning' },
        ],
    },
    {
        id: 'rivals5',
        title: 'Rivals5 (J)',
        origin: 'CodeExec/Computer',
        services: [
            { name: 'codeexecService', description: 'E2B code tickets' },
            { name: 'computerService', description: 'Computer-use harness' },
        ],
    },
];
