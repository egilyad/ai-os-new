import type { IBuilderAgentService } from '../../contracts/builder';
import type { WorkflowRepository } from '../../dal/workflow-repository';
import type { IEventBus } from '../../types/interfaces';
import type {
    CompiledFlow,
    CompiledStep,
    FlowId,
    ValidationError,
    ValidationResult,
    WorkflowEdge,
    WorkflowManifest,
    WorkflowNode,
    WorkflowNodeType,
    WorkflowRecord,
} from '../../types/builder-types';
import { rootLogger } from '../logger-service';

const LOGGER = rootLogger.child('BuilderAgent');

const NODE_KEYWORDS: Array<{ keywords: string[]; type: WorkflowNodeType }> = [
    {
        keywords: ['debate', 'дискуссия', 'аргумент', 'спор', 'critique', 'discuss', 'argue'],
        type: 'debate',
    },
    {
        keywords: ['junction', 'соедин', 'связ', 'сопостав', 'link', 'connect', 'bridge'],
        type: 'junction',
    },
    { keywords: ['forum', 'форум', 'обсужден', 'community'], type: 'forum' },
    { keywords: ['synthesis', 'синтез', 'обобщ', 'summar', 'consolidat'], type: 'synthesis' },
    { keywords: ['interpret', 'интерпрет', 'анализ', 'explain', 'analyz'], type: 'interpretation' },
    {
        keywords: ['filter', 'фильтр', 'провер', 'услов', 'gate', 'guard', 'check', 'if'],
        type: 'gate',
    },
];

const HANDLER_EVENTS: Record<WorkflowNodeType, string> = {
    agent: 'agent:invoke',
    debate: 'debate:start',
    junction: 'junction:detect',
    forum: 'forum:topic:create',
    synthesis: 'synthesis:session:create',
    interpretation: 'lens:apply',
    gate: 'workflow:gate:evaluate',
};

const OUTPUT_EVENTS: Record<WorkflowNodeType, string> = {
    agent: 'agent:completed',
    debate: 'debate:verdict:generated',
    junction: 'junction:detected',
    forum: 'forum:post:created',
    synthesis: 'synthesis:completed',
    interpretation: 'lens:applied',
    gate: 'workflow:gate:passed',
};

function genId(): string {
    return `wf_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function generateFromPrompt(prompt: string): WorkflowManifest {
    const lower = prompt.toLowerCase();
    const nodes: WorkflowNode[] = [];
    const edges: WorkflowEdge[] = [];

    nodes.push({ id: 'entry', type: 'agent', label: 'Entry Agent', position: { x: 0, y: 0 } });

    let lastNodeId = 'entry';
    let yPos = 150;

    for (const rule of NODE_KEYWORDS) {
        if (rule.keywords.some((kw) => lower.includes(kw))) {
            const nodeId = `${rule.type}_${nodes.length}`;
            nodes.push({
                id: nodeId,
                type: rule.type,
                label: rule.type.charAt(0).toUpperCase() + rule.type.slice(1),
                position: { x: 0, y: yPos },
            });
            edges.push({ id: `e_${lastNodeId}_${nodeId}`, from: lastNodeId, to: nodeId });
            lastNodeId = nodeId;
            yPos += 150;
        }
    }

    nodes.push({ id: 'exit', type: 'agent', label: 'Exit Agent', position: { x: 0, y: yPos } });
    edges.push({ id: `e_${lastNodeId}_exit`, from: lastNodeId, to: 'exit' });

    const now = Date.now();
    return {
        workflow_id: genId(),
        title: prompt.slice(0, 80),
        description: prompt,
        version: 1,
        status: 'draft',
        trigger: { kind: 'manual', source: 'prompt' },
        nodes,
        edges,
        createdAt: now,
        updatedAt: now,
    };
}

function validateManifest(manifest: WorkflowManifest): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const nodeIds = new Set(manifest.nodes.map((n) => n.id));

    for (const node of manifest.nodes) {
        if (!node.id || !node.type || !node.label) {
            errors.push({
                nodeId: node.id,
                code: 'MISSING_FIELD',
                message: 'Node missing required field',
                severity: 'error',
            });
        }
    }

    for (const edge of manifest.edges) {
        if (!nodeIds.has(edge.from)) {
            errors.push({
                code: 'EDGE_ORPHAN_FROM',
                message: `Edge references unknown from-node: ${edge.from}`,
                severity: 'error',
            });
        }
        if (!nodeIds.has(edge.to)) {
            errors.push({
                code: 'EDGE_ORPHAN_TO',
                message: `Edge references unknown to-node: ${edge.to}`,
                severity: 'error',
            });
        }
    }

    for (const node of manifest.nodes) {
        if (node.type === 'gate' && !node.config?.condition) {
            warnings.push({
                nodeId: node.id,
                code: 'GATE_NO_CONDITION',
                message: `Gate node ${node.id} has no condition`,
                severity: 'warning',
            });
        }
    }

    const visited = new Set<string>();
    const inStack = new Set<string>();
    const adj = new Map<string, string[]>();
    for (const node of manifest.nodes) adj.set(node.id, []);
    for (const edge of manifest.edges) {
        const list = adj.get(edge.from);
        if (list) list.push(edge.to);
    }
    function dfs(nodeId: string): boolean {
        if (inStack.has(nodeId)) return true;
        if (visited.has(nodeId)) return false;
        visited.add(nodeId);
        inStack.add(nodeId);
        for (const next of adj.get(nodeId) ?? []) {
            if (dfs(next)) return true;
        }
        inStack.delete(nodeId);
        return false;
    }
    for (const node of manifest.nodes) {
        if (dfs(node.id)) {
            errors.push({
                code: 'CYCLE_DETECTED',
                message: 'Cycle detected in workflow graph',
                severity: 'error',
            });
            break;
        }
    }

    const connected = new Set<string>();
    for (const edge of manifest.edges) {
        connected.add(edge.from);
        connected.add(edge.to);
    }
    for (const node of manifest.nodes) {
        if (!connected.has(node.id) && node.id !== 'entry' && node.id !== 'exit') {
            warnings.push({
                nodeId: node.id,
                code: 'ORPHAN_NODE',
                message: `Node ${node.id} is disconnected`,
                severity: 'warning',
            });
        }
    }

    return { valid: errors.length === 0, errors, warnings };
}

function compileManifest(manifest: WorkflowManifest): CompiledFlow {
    const steps: CompiledStep[] = manifest.nodes.map((node) => ({
        stepId: node.id,
        nodeType: node.type,
        handlerEvent: HANDLER_EVENTS[node.type],
        outputEvent: OUTPUT_EVENTS[node.type],
        config: node.config ?? {},
        checkpointEnabled: node.type !== 'gate',
    }));

    return {
        flowId: manifest.workflow_id,
        manifestVersion: manifest.version,
        compiledAt: Date.now(),
        steps,
        entryEvent: HANDLER_EVENTS[manifest.nodes[0]?.type ?? 'agent'],
        exitEvent: OUTPUT_EVENTS[manifest.nodes[manifest.nodes.length - 1]?.type ?? 'agent'],
    };
}

export class BuilderAgentService implements IBuilderAgentService {
    private repository: WorkflowRepository;
    private eventBus: IEventBus;

    constructor(deps: { repository: WorkflowRepository; eventBus: IEventBus }) {
        this.repository = deps.repository;
        this.eventBus = deps.eventBus;
    }

    async init(): Promise<void> {
        LOGGER.info('BuilderAgent', 'Initialized');
    }

    async destroy(): Promise<void> {
        LOGGER.info('BuilderAgent', 'Destroyed');
    }

    async generate(input: { prompt: string }): Promise<WorkflowManifest> {
        const manifest = generateFromPrompt(input.prompt);
        LOGGER.info('BuilderAgent', `Generated manifest: ${manifest.workflow_id}`, {
            nodeCount: manifest.nodes.length,
        });
        return manifest;
    }

    async validate(manifest: WorkflowManifest): Promise<ValidationResult> {
        const result = validateManifest(manifest);
        LOGGER.info(
            'BuilderAgent',
            `Validated manifest ${manifest.workflow_id}: ${result.valid ? 'PASS' : 'FAIL'}`,
            {
                errors: result.errors.length,
                warnings: result.warnings.length,
            },
        );
        return result;
    }

    async compile(manifest: WorkflowManifest): Promise<CompiledFlow> {
        const flow = compileManifest(manifest);
        LOGGER.info('BuilderAgent', `Compiled manifest ${manifest.workflow_id}`, {
            steps: flow.steps.length,
        });
        return flow;
    }

    async deploy(flowId: FlowId): Promise<void> {
        const record = await this.repository.get(flowId);
        if (!record) throw new Error(`Workflow ${flowId} not found`);
        if (!record.manifest) throw new Error(`Workflow ${flowId} has no manifest`);

        record.status = 'deployed';
        record.updatedAt = Date.now();
        await this.repository.put(record);

        await this.eventBus.emit(
            'builder:flow:deployed' as never,
            {
                flowId,
                title: record.title,
                nodeCount: record.nodeCount,
                deployedAt: Date.now(),
            } as never,
        );

        LOGGER.info('BuilderAgent', `Deployed workflow ${flowId}`);
    }

    async listFlows(): Promise<WorkflowManifest[]> {
        const records = await this.repository.list();
        return records.filter((r) => r.manifest).map((r) => r.manifest!);
    }

    async getFlow(flowId: FlowId): Promise<WorkflowManifest | null> {
        const record = await this.repository.get(flowId);
        return record?.manifest ?? null;
    }

    async saveManifest(manifest: WorkflowManifest): Promise<WorkflowRecord> {
        const record: WorkflowRecord = {
            id: manifest.workflow_id,
            title: manifest.title,
            status: manifest.status,
            version: manifest.version,
            nodeCount: manifest.nodes.length,
            createdAt: manifest.createdAt,
            updatedAt: manifest.updatedAt,
            manifest,
        };
        await this.repository.put(record);
        return record;
    }

    async saveCompiled(manifest: WorkflowManifest, compiled: CompiledFlow): Promise<void> {
        const record = await this.repository.get(manifest.workflow_id);
        if (!record) throw new Error(`Workflow ${manifest.workflow_id} not found`);
        record.compiledFlow = compiled;
        record.status = 'compiled';
        record.updatedAt = Date.now();
        await this.repository.put(record);
    }
}
