#!/usr/bin/env node
/**
 * extract-models-catalog.mjs
 *
 * Manual (non-CI) tool that turns a models.dev checkout (MIT, https://github.com/sst/models.dev)
 * into a compact TypeScript catalog consumed by the kernel.
 *
 * Usage:
 *   MODELS_DEV_DIR="C:\\path\\to\\models.dev" node scripts/extract-models-catalog.mjs
 *   MODELS_DEV_DIR="..." node scripts/extract-models-catalog.mjs --providers openai,anthropic --out src/kernel/data/models-catalog.ts
 *
 * The models.dev repository itself is NOT vendored into this repo: this script is run on demand
 * and only its generated output (src/kernel/data/models-catalog.ts) is committed.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const DEFAULT_PROVIDERS = [
    'openai',
    'anthropic',
    'google',
    'deepseek',
    'xai',
    'mistral',
    'cohere',
    'nvidia',
    'alibaba',
    'moonshotai',
    'zhipuai',
    'minimax',
    'groq',
    'meta',
    'cerebras',
    'togetherai',
    'perplexity',
    'openrouter',
];

const DEFAULT_OUT = 'src/llm/catalog/models-catalog.ts';
const DEFAULT_DETAIL_OUT = 'src/llm/catalog/models-catalog-detail.ts';

/** Candidate locations of a local models.dev checkout (the repo is not vendored). */
function modelsDevCandidates(repoRoot, explicit) {
    const candidates = [];
    if (explicit) candidates.push(explicit);
    candidates.push(path.join(repoRoot, '..', 'ai-os-references', 'OpenCodeAgent', 'models.dev-dev', 'models.dev-dev'));
    candidates.push(path.join(repoRoot, 'src/kernel/agents/OpenCodeAgent/models.dev-dev/models.dev-dev'));
    return candidates;
}

function args() {
    const out = {
        providers: DEFAULT_PROVIDERS,
        out: DEFAULT_OUT,
        detailOut: DEFAULT_DETAIL_OUT,
        dir: process.env.MODELS_DEV_DIR,
    };
    const argv = process.argv.slice(2);
    for (let i = 0; i < argv.length; i++) {
        if (argv[i] === '--providers') out.providers = String(argv[++i]).split(',').map((s) => s.trim()).filter(Boolean);
        else if (argv[i] === '--out') out.out = String(argv[++i]);
        else if (argv[i] === '--detail-out') out.detailOut = String(argv[++i]);
        else if (argv[i] === '--dir') out.dir = String(argv[++i]);
    }
    return out;
}

// ---------------------------------------------------------------------------
// Minimal TOML subset parser (enough for models.dev files).
// Supports: comments, bare/quoted keys, [table], [[array of tables]],
// strings ('...', "..."), booleans, integers (with _ separators), floats,
// arrays (multi-line), inline tables.
// ---------------------------------------------------------------------------
function parseToml(text) {
    let i = 0;
    const n = text.length;
    const root = {};
    let current = root;

    const peek = () => text[i];
    const isSpace = (c) => c === ' ' || c === '\t' || c === '\r';
    const isValueEnd = (c) => c === undefined || c === ',' || c === ']' || c === '}' || c === '\n' || c === '#';

    function skipInlineSpace() {
        while (i < n && isSpace(text[i])) i++;
    }

    function skipSpaceAndComments() {
        while (i < n) {
            const c = text[i];
            if (isSpace(c) || c === '\n') { i++; continue; }
            if (c === '#') { while (i < n && text[i] !== '\n') i++; continue; }
            break;
        }
    }

    function readQuotedString() {
        const quote = text[i++];
        let out = '';
        if (quote === "'") {
            while (i < n && text[i] !== "'") out += text[i++];
            i++;
            return out;
        }
        while (i < n && text[i] !== '"') {
            if (text[i] === '\\') {
                const esc = text[++i];
                if (esc === 'n') out += '\n';
                else if (esc === 't') out += '\t';
                else if (esc === 'r') out += '\r';
                else if (esc === '"') out += '"';
                else if (esc === '\\') out += '\\';
                else if (esc === 'u') { out += String.fromCharCode(parseInt(text.slice(i + 1, i + 5), 16)); i += 4; }
                else out += esc;
                i++;
            } else {
                out += text[i++];
            }
        }
        i++;
        return out;
    }

    function readBareKey() {
        let out = '';
        while (i < n && /[A-Za-z0-9_\-.]/.test(text[i])) out += text[i++];
        return out;
    }

    function parseValue() {
        skipInlineSpace();
        const c = text[i];
        if (c === '"' || c === "'") return readQuotedString();
        if (c === '[') {
            i++;
            const arr = [];
            for (;;) {
                skipSpaceAndComments();
                if (text[i] === ']') { i++; break; }
                arr.push(parseValue());
                skipSpaceAndComments();
                if (text[i] === ',') { i++; continue; }
                if (text[i] === ']') { i++; break; }
                if (i >= n) break;
            }
            return arr;
        }
        if (c === '{') {
            i++;
            const obj = {};
            for (;;) {
                skipSpaceAndComments();
                if (text[i] === '}') { i++; break; }
                if (i >= n) break;
                const key = readBareKey().trim();
                skipInlineSpace();
                if (text[i] === '=') i++;
                obj[key] = parseValue();
                skipSpaceAndComments();
                if (text[i] === ',') { i++; continue; }
                if (text[i] === '}') { i++; break; }
            }
            return obj;
        }
        // scalar token
        let tok = '';
        while (i < n && !isValueEnd(text[i])) tok += text[i++];
        tok = tok.trim();
        if (tok === 'true') return true;
        if (tok === 'false') return false;
        const num = tok.replace(/_/g, '');
        if (/^[+-]?\d+$/.test(num)) return parseInt(num, 10);
        if (/^[+-]?(\d+\.\d*|\.\d+|\d+)([eE][+-]?\d+)?$/.test(num)) return parseFloat(num);
        return tok.replace(/^["']|["']$/g, '');
    }

    function resolve(obj, keys) {
        let node = obj;
        for (const key of keys) {
            if (typeof node[key] !== 'object' || node[key] === null || Array.isArray(node[key])) {
                node[key] = {};
            }
            node = node[key];
        }
        return node;
    }

    for (;;) {
        skipSpaceAndComments();
        if (i >= n) break;
        const c = text[i];
        if (c === '[') {
            const isArrayTable = text[i + 1] === '[';
            i += isArrayTable ? 2 : 1;
            const keys = [];
            let key = '';
            while (i < n && text[i] !== ']') {
                if (text[i] === '.') { keys.push(key.trim()); key = ''; i++; continue; }
                if (text[i] === '"' || text[i] === "'") { key += readQuotedString(); continue; }
                key += text[i++];
            }
            keys.push(key.trim());
            i++; // closing ]
            if (isArrayTable) i++; // second ]
            if (isArrayTable) {
                const parent = resolve(root, keys.slice(0, -1));
                const last = keys[keys.length - 1];
                if (!Array.isArray(parent[last])) parent[last] = [];
                const entry = {};
                parent[last].push(entry);
                current = entry;
            } else {
                current = resolve(root, keys);
            }
            continue;
        }
        // key = value
        const keys = [];
        for (;;) {
            skipInlineSpace();
            let key;
            if (text[i] === '"' || text[i] === "'") key = readQuotedString();
            else key = readBareKey();
            keys.push(key.trim());
            skipInlineSpace();
            if (text[i] === '.') { i++; continue; }
            break;
        }
        skipInlineSpace();
        if (text[i] === '=') i++;
        const value = parseValue();
        const target = current === root ? resolve(root, keys.slice(0, -1)) : current;
        target[keys[keys.length - 1]] = value;
    }

    return root;
}

function walkToml(dir) {
    const out = [];
    if (!fs.existsSync(dir)) return out;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) out.push(...walkToml(full));
        else if (entry.isFile() && entry.name.endsWith('.toml')) out.push(full);
    }
    return out;
}

function assign(target, source) {
    for (const [k, v] of Object.entries(source)) {
        if (v && typeof v === 'object' && !Array.isArray(v)) {
            target[k] = { ...(target[k] && typeof target[k] === 'object' ? target[k] : {}), ...v };
        } else {
            target[k] = v;
        }
    }
    return target;
}

function readModelFile(file) {
    try {
        return parseToml(fs.readFileSync(file, 'utf8'));
    } catch (err) {
        if (process.env.CATALOG_DEBUG) console.error('parse error', file, err && err.message);
        return null;
    }
}

function normalize(model) {
    const caps = model.capabilities || {};
    const reasoning = typeof model.reasoning === 'boolean'
        ? model.reasoning
        : caps.reasoning && caps.reasoning.supported === true
            ? true
            : undefined;
    const toolCall = typeof model.tool_call === 'boolean'
        ? model.tool_call
        : caps.tools && caps.tools.supported === true
            ? true
            : undefined;

    let input;
    let output;
    let cacheRead;
    if (model.cost && typeof model.cost.input === 'number') {
        input = model.cost.input;
        output = typeof model.cost.output === 'number' ? model.cost.output : undefined;
        cacheRead = typeof model.cost.cache_read === 'number' ? model.cost.cache_read : undefined;
    } else if (model.cost && model.cost.text) {
        const text = model.cost.text;
        input = text.input && typeof text.input.price === 'number' ? text.input.price : undefined;
        output = text.output && typeof text.output.price === 'number' ? text.output.price : undefined;
        cacheRead = text.input && text.input.cache && typeof text.input.cache.read === 'number'
            ? text.input.cache.read
            : undefined;
    }

    const modalities = model.modalities || {};
    const inputModalities = Array.isArray(modalities.input) ? modalities.input : [];
    const outputModalities = Array.isArray(modalities.output) ? modalities.output : [];
    const context = model.limit && typeof model.limit.context === 'number' ? model.limit.context : undefined;

    return {
        input,
        output,
        cacheRead,
        context,
        outputModalities,
        reasoning,
        toolCall,
        vision: inputModalities.some((m) => typeof m === 'string' && m.startsWith('image/')) || inputModalities.includes('image')
            ? true
            : undefined,
        maxOutput: model.limit && typeof model.limit.output === 'number' ? model.limit.output : undefined,
        releaseDate: typeof model.release_date === 'string' ? model.release_date : undefined,
        knowledge: typeof model.knowledge === 'string' ? model.knowledge : undefined,
        deprecated: model.status === 'deprecated' ? true : undefined,
    };
}

function main() {
    const opts = args();
    const candidates = modelsDevCandidates(repoRoot, opts.dir);
    const base = candidates.find((c) => fs.existsSync(c));
    if (!base) {
        console.error('models.dev checkout not found. Checked:');
        for (const c of candidates) console.error(`  - ${c}`);
        console.error('Set MODELS_DEV_DIR to a models.dev repository path.');
        process.exit(1);
    }

    const labDir = path.join(base, 'models');
    const providersDir = path.join(base, 'providers');
    const entries = [];

    for (const provider of opts.providers) {
        const modelsRoot = path.join(providersDir, provider, 'models');
        if (!fs.existsSync(modelsRoot)) {
            console.warn(`skip provider "${provider}" (not found)`);
            continue;
        }
        for (const file of walkToml(modelsRoot)) {
            const raw = readModelFile(file);
            if (!raw) continue;
            const modelId = path.relative(modelsRoot, file).split(path.sep).join('/').replace(/\.toml$/, '');

            let merged = {};
            if (raw.base_model) {
                const basePath = path.join(labDir, ...String(raw.base_model).split('/')) + '.toml';
                const baseModel = readModelFile(basePath);
                if (baseModel) merged = assign(merged, baseModel);
            }
            merged = assign(merged, raw);

            const norm = normalize(merged);
            if (!norm.context) continue;
            if ((merged.type ?? 'chat') !== 'chat') continue;
            if (norm.outputModalities.length > 0 && !norm.outputModalities.includes('text')) continue;

            const entry = {
                id: `${provider}/${modelId}`,
                provider,
                model: modelId,
                name: merged.name || modelId,
                context: norm.context,
                maxOutput: norm.maxOutput,
                input: norm.input,
                output: norm.output,
                cacheRead: norm.cacheRead,
                reasoning: norm.reasoning,
                toolCall: norm.toolCall,
                vision: norm.vision,
                releaseDate: norm.releaseDate,
                knowledge: norm.knowledge,
                deprecated: norm.deprecated,
            };
            entries.push(entry);
        }
    }

    entries.sort((a, b) => a.id.localeCompare(b.id));

    const contextWindows = {};
    const pricing = {};
    const capabilities = {};
    const addKey = (map, key, value) => {
        if (!(key in map)) map[key] = value;
    };
    for (const e of entries) {
        if (e.deprecated) continue;
        const keys = [e.model.toLowerCase()];
        const slash = keys[0].indexOf('/');
        if (slash > 0) keys.push(keys[0].slice(slash + 1));
        for (const key of keys) {
            addKey(contextWindows, key, e.context);
            if (typeof e.input === 'number' && typeof e.output === 'number') {
                addKey(pricing, key, { input: e.input, output: e.output, provider: e.provider });
            }
            const caps = {};
            if (e.toolCall) caps.toolCall = true;
            if (e.vision) caps.vision = true;
            if (e.reasoning) caps.reasoning = true;
            if (Object.keys(caps).length > 0) addKey(capabilities, key, caps);
        }
    }

    const cleanEntries = entries.map((e) => JSON.parse(JSON.stringify(e)));
    const cleanContext = Object.fromEntries(Object.entries(contextWindows).sort(([a], [b]) => a.localeCompare(b)));
    const cleanPricing = Object.fromEntries(Object.entries(pricing).sort(([a], [b]) => a.localeCompare(b)));
    const cleanCapabilities = Object.fromEntries(Object.entries(capabilities).sort(([a], [b]) => a.localeCompare(b)));

    const header = [
        '// AUTO-GENERATED by scripts/extract-models-catalog.mjs — DO NOT EDIT BY HAND.',
        '// Source: models.dev (MIT) — https://github.com/sst/models.dev',
        '// Regenerate: MODELS_DEV_DIR=<path> node scripts/extract-models-catalog.mjs',
        '',
    ];

    const runtimeLines = [...header];
    runtimeLines.push('export interface CatalogPricing {');
    runtimeLines.push('    input: number;');
    runtimeLines.push('    output: number;');
    runtimeLines.push('    provider: string;');
    runtimeLines.push('}');
    runtimeLines.push('');
    runtimeLines.push('export interface ModelCapabilities {');
    runtimeLines.push('    toolCall?: boolean;');
    runtimeLines.push('    vision?: boolean;');
    runtimeLines.push('    reasoning?: boolean;');
    runtimeLines.push('    maxOutput?: number;');
    runtimeLines.push('}');
    runtimeLines.push('');
    runtimeLines.push(`export const CATALOG_CONTEXT_WINDOWS: Record<string, number> = ${JSON.stringify(cleanContext)};`);
    runtimeLines.push('');
    runtimeLines.push(`export const CATALOG_PRICING: Record<string, CatalogPricing> = ${JSON.stringify(cleanPricing)};`);
    runtimeLines.push('');
    runtimeLines.push(`export const CATALOG_CAPABILITIES: Record<string, ModelCapabilities> = ${JSON.stringify(cleanCapabilities)};`);
    runtimeLines.push('');

    const detailLines = [...header];
    detailLines.push('export interface ModelCatalogEntry {');
    detailLines.push('    id: string;');
    detailLines.push('    provider: string;');
    detailLines.push('    model: string;');
    detailLines.push('    name: string;');
    detailLines.push('    context: number;');
    detailLines.push('    maxOutput?: number;');
    detailLines.push('    input?: number;');
    detailLines.push('    output?: number;');
    detailLines.push('    cacheRead?: number;');
    detailLines.push('    reasoning?: boolean;');
    detailLines.push('    toolCall?: boolean;');
    detailLines.push('    vision?: boolean;');
    detailLines.push('    releaseDate?: string;');
    detailLines.push('    knowledge?: string;');
    detailLines.push('    deprecated?: boolean;');
    detailLines.push('}');
    detailLines.push('');
    detailLines.push(`export const MODELS_CATALOG: ModelCatalogEntry[] = ${JSON.stringify(cleanEntries)};`);
    detailLines.push('');

    const outPath = path.join(repoRoot, opts.out);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, runtimeLines.join('\n'), 'utf8');
    const detailPath = path.join(repoRoot, opts.detailOut);
    fs.mkdirSync(path.dirname(detailPath), { recursive: true });
    fs.writeFileSync(detailPath, detailLines.join('\n'), 'utf8');

    console.log(`catalog: ${cleanEntries.length} models from ${opts.providers.length} providers`);
    console.log(
        `context windows: ${Object.keys(cleanContext).length}, pricing rows: ${Object.keys(cleanPricing).length}, capability rows: ${Object.keys(cleanCapabilities).length}`,
    );
    console.log(`-> ${opts.out} (${(fs.statSync(outPath).size / 1024).toFixed(1)} KB)`);
    console.log(`-> ${opts.detailOut} (${(fs.statSync(detailPath).size / 1024).toFixed(1)} KB)`);
}

main();
