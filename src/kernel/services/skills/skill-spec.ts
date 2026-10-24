/**
 * Declarative agent skills.
 *
 * Ported from the Hermes Agent skill format (MIT): a skill is a markdown file
 * with a YAML-ish frontmatter header and a procedural body. The frontmatter
 * carries the metadata, the body carries the steps.
 *
 * Two rules from the reference format are enforced here because they are what
 * makes a skill usable by an agent:
 *  - the description is one sentence, at most 60 characters, ending with a dot;
 *  - the body references *native agent tools* (`read_file`, `patch`, ...),
 *    not shell utilities — a skill must be executable through the toolset the
 *    agent actually has.
 *
 * The parser is intentionally dependency-free (no yaml package): the frontmatter
 * subset used by skills is flat `key: value` plus simple lists.
 */

export interface AgentSkillSpec {
    id: string;
    name: string;
    /** One sentence, <= 60 chars, ends with a period. */
    description: string;
    version: string;
    license?: string;
    platforms?: string[];
    tags?: string[];
    relatedSkills?: string[];
    /** Ordered procedure steps. */
    steps: string[];
    /** Observable condition that tells the agent the skill is finished. */
    completionCriteria?: string[];
}

export const SKILL_DESCRIPTION_MAX_LENGTH = 60;

/** Parse a SKILL.md document into a spec, or return null when malformed. */
export function parseSkillMarkdown(markdown: string): AgentSkillSpec | null {
    const normalized = markdown.replace(/\r\n/g, '\n');
    if (!normalized.startsWith('---')) return null;
    const end = normalized.indexOf('\n---', 3);
    if (end === -1) return null;

    const frontmatter = normalized.slice(3, end).trim();
    const body = normalized.slice(end + 4).trim();

    const fields = new Map<string, string>();
    for (const line of frontmatter.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const colon = trimmed.indexOf(':');
        if (colon === -1) continue;
        const key = trimmed.slice(0, colon).trim();
        let value = trimmed.slice(colon + 1).trim();
        if (
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))
        ) {
            value = value.slice(1, -1);
        }
        if (value.startsWith('[') && value.endsWith(']')) {
            value = value
                .slice(1, -1)
                .split(',')
                .map((v) => v.trim().replace(/^['"]|['"]$/g, ''))
                .filter(Boolean)
                .join(', ');
        }
        fields.set(key, value);
    }

    const name = fields.get('name');
    const description = fields.get('description');
    if (!name || !description) return null;

    const steps: string[] = [];
    const completionCriteria: string[] = [];
    for (const rawLine of body.split('\n')) {
        const line = rawLine.trim();
        if (!line) continue;
        if (/^[-*]\s*done:/i.test(line)) {
            completionCriteria.push(line.replace(/^[-*]\s*done:\s*/i, '').trim());
        } else if (/^[-*]\s+/.test(line)) {
            steps.push(line.replace(/^[-*]\s+/, '').trim());
        } else if (/^\d+[.)]\s+/.test(line)) {
            steps.push(line.replace(/^\d+[.)]\s+/, '').trim());
        }
    }

    return {
        id: slugify(name),
        name,
        description,
        version: fields.get('version') ?? '1.0.0',
        license: fields.get('license'),
        platforms: splitList(fields.get('platforms')),
        tags: splitList(fields.get('tags')),
        relatedSkills: splitList(fields.get('related_skills')),
        steps,
        completionCriteria,
    };
}

function splitList(value: string | undefined): string[] | undefined {
    if (!value) return undefined;
    const items = value
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean);
    return items.length ? items : undefined;
}

export function slugify(value: string): string {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

/**
 * Validate a spec against the skill contract.
 * Returns a list of human-readable problems (empty = valid).
 */
export function validateSkillSpec(spec: AgentSkillSpec): string[] {
    const problems: string[] = [];
    if (!spec.name.trim()) problems.push('name is required');
    if (!spec.description.trim()) {
        problems.push('description is required');
    } else {
        if (spec.description.length > SKILL_DESCRIPTION_MAX_LENGTH) {
            problems.push(
                `description must be <= ${SKILL_DESCRIPTION_MAX_LENGTH} characters (got ${spec.description.length})`,
            );
        }
        if (!spec.description.endsWith('.')) problems.push('description must end with a period');
        if (/[.!?]\s+\S/.test(spec.description)) {
            problems.push('description must be a single sentence');
        }
    }
    if (spec.steps.length === 0) problems.push('skill must contain at least one step');
    if (!spec.version.trim()) problems.push('version is required');
    return problems;
}

/**
 * Built-in skill catalogue.
 *
 * The steps name native agent tools, so a skill stays executable with the
 * toolset the agent actually owns.
 */
export const AGENT_SKILL_CATALOG: Readonly<Record<string, AgentSkillSpec>> = {
    'systematic-debugging': {
        id: 'systematic-debugging',
        name: 'systematic-debugging',
        description: 'Find the root cause before changing any code.',
        version: '1.1.0',
        license: 'MIT',
        platforms: ['linux', 'macos', 'windows'],
        tags: ['debugging', 'troubleshooting', 'root-cause'],
        relatedSkills: ['root-cause-analysis'],
        steps: [
            'Прочитай `read_file` репродуцирующий код и соседние модули.',
            'Сформулируй гипотезу причины и запиши её списком.',
            'Проверь гипотезу минимальным запуском через `t-code`.',
            'Только после подтверждения причины предложи правку.',
        ],
        completionCriteria: [
            'Причина подтверждена запуском, а не догадкой.',
        ],
    },
    'root-cause-analysis': {
        id: 'root-cause-analysis',
        name: 'root-cause-analysis',
        description: 'Separate symptom, trigger and root cause.',
        version: '1.0.0',
        license: 'MIT',
        tags: ['analysis', 'root-cause'],
        steps: [
            'Опиши наблюдаемый симптом фактами.',
            'Найди триггер: условие, при котором симптом появляется.',
            'Проследи цепочку до первопричины.',
        ],
        completionCriteria: ['Цепочка симптом → триггер → причина заполнена.'],
    },
    'literature-synthesis': {
        id: 'literature-synthesis',
        name: 'literature-synthesis',
        description: 'Turn scattered sources into one structured brief.',
        version: '1.0.0',
        license: 'MIT',
        tags: ['research', 'synthesis'],
        steps: [
            'Собери источники через `t-web-search` и `t-search` (память).',
            'Для каждого источника выпиши утверждение и цитату.',
            'Сгруппируй утверждения по темам, отметь противоречия.',
        ],
        completionCriteria: ['Есть выводы со ссылкой на источник и список противоречий.'],
    },
    'step-by-step-execution': {
        id: 'step-by-step-execution',
        name: 'step-by-step-execution',
        description: 'Execute a procedure one verifiable step at a time.',
        version: '1.0.0',
        license: 'MIT',
        tags: ['execution', 'procedure'],
        steps: [
            'Выпиши шаги процедуры в порядке выполнения.',
            'Выполняй по одному шагу и фиксируй результат.',
            'Останавливайся на первом шаге, где результат неожиданен.',
        ],
        completionCriteria: ['Каждый шаг подтверждён результатом инструмента.'],
    },
    'wiki-brain': {
        id: 'wiki-brain',
        name: 'wiki-brain',
        description: 'Search the compiled wiki to ground answers in cited sources.',
        version: '1.0.0',
        license: 'MIT',
        platforms: ['linux', 'macos', 'windows'],
        tags: ['wiki', 'knowledge', 'rag', 'grounding'],
        relatedSkills: ['literature-synthesis'],
        steps: [
            'Уточни запрос и какие сущности или концепции нужны.',
            'Вызови поиск по вики: `wikiBrainService.query.search(query)` через инструмент памяти.',
            'Возьми top-k страниц вместе с `sources[]` как трейс.',
            'Построй ответ на основе страниц со ссылкой на их slug.',
            'Если нужной страницы нет — предложи поставить источник на инжест.',
        ],
        completionCriteria: [
            'Ответ опирается на страницы wiki; каждая ссылка ведёт на существующий slug.',
        ],
    },
};

/** Resolve the skills declared by an agent id. */
export function resolveAgentSkills(skillIds: string[]): AgentSkillSpec[] {
    return skillIds
        .map((id) => AGENT_SKILL_CATALOG[id])
        .filter((s): s is AgentSkillSpec => Boolean(s));
}

/** Render a skill as the prompt block that is injected into the agent context. */
export function renderSkillPrompt(spec: AgentSkillSpec): string {
    const lines: string[] = [`## Навык: ${spec.name}`, spec.description];
    if (spec.steps.length) {
        lines.push('Шаги:');
        spec.steps.forEach((step, i) => lines.push(`${i + 1}. ${step}`));
    }
    if (spec.completionCriteria?.length) {
        lines.push('Готово, когда:');
        spec.completionCriteria.forEach((c) => lines.push(`- ${c}`));
    }
    return lines.join('\n');
}
