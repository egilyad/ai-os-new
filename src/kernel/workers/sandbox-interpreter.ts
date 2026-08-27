import { parseScript, type ESTree } from 'meriyah';

export interface SandboxOs {
    executeTool: (toolId: string, input: unknown) => Promise<unknown>;
}

export interface SandboxRunOptions {
    maxSteps?: number;
    maxDepth?: number;
}

const MAX_STEPS_DEFAULT = 2_000_000;
const MAX_DEPTH_DEFAULT = 2000;

const FORBIDDEN_IDENTIFIERS = new Set([
    'importScripts',
    'XMLHttpRequest',
    'fetch',
    'WebSocket',
    'indexedDB',
    'eval',
    'Function',
    'arguments',
    'Proxy',
    'Reflect',
    'Atomics',
    'SharedArrayBuffer',
    'WeakRef',
    'FinalizationRegistry',
    'caches',
    'Cache',
    'CacheStorage',
    'BroadcastChannel',
    'MessageChannel',
    'MessagePort',
    'EventSource',
    'Event',
    'CustomEvent',
    'URLSearchParams',
    'Blob',
    'File',
    'FileReader',
    'FormData',
    'Headers',
    'Request',
    'Response',
    'globalThis',
    'self',
    'window',
    'parent',
    'top',
    'setTimeout',
    'setInterval',
    'clearTimeout',
    'clearInterval',
    'queueMicrotask',
    'requestAnimationFrame',
    'cancelAnimationFrame',
    'structuredClone',
    'performance',
]);

const FORBIDDEN_MEMBER_PROPERTIES = new Set([
    'constructor',
    '__proto__',
    'prototype',
    'caches',
    'registration',
    'serviceWorker',
    'onmessage',
    'onerror',
    'onclose',
]);

interface ValidationError {
    keyword: string;
}

function walkAndValidate(node: ESTree.Node, errors: ValidationError[]): void {
    switch (node.type) {
        case 'Identifier':
            if (FORBIDDEN_IDENTIFIERS.has(node.name)) {
                errors.push({ keyword: node.name });
            }
            break;
        case 'MemberExpression':
            if (
                !node.computed &&
                node.property.type === 'Identifier' &&
                FORBIDDEN_MEMBER_PROPERTIES.has(node.property.name)
            ) {
                errors.push({ keyword: node.property.name });
            }
            if (node.computed && node.property.type === 'Identifier') {
                errors.push({ keyword: 'computed_identifier_access' });
            }
            if (
                node.computed &&
                node.property.type === 'Literal' &&
                typeof node.property.value === 'string' &&
                FORBIDDEN_MEMBER_PROPERTIES.has(node.property.value)
            ) {
                errors.push({ keyword: node.property.value });
            }
            if (
                node.computed &&
                node.property.type === 'Literal' &&
                node.property.value === 'constructor'
            ) {
                errors.push({ keyword: 'constructor_access' });
            }
            if (node.computed && node.property.type === 'BinaryExpression') {
                errors.push({ keyword: 'computed_property_access' });
            }
            if (node.computed && node.property.type === 'TemplateLiteral') {
                errors.push({ keyword: 'computed_property_access' });
            }
            if (node.object.type === 'Identifier' && FORBIDDEN_IDENTIFIERS.has(node.object.name)) {
                errors.push({ keyword: node.object.name });
            }
            break;
        case 'WithStatement':
            errors.push({ keyword: 'with' });
            break;
        case 'CallExpression':
            if (node.callee.type === 'Identifier' && node.callee.name === 'eval') {
                errors.push({ keyword: 'eval' });
            }
            if (node.callee.type === 'SequenceExpression') {
                errors.push({ keyword: 'indirect_call' });
            }
            if (node.callee.type === 'MemberExpression' && node.callee.computed) {
                if (
                    node.callee.property.type === 'Literal' &&
                    typeof node.callee.property.value === 'string' &&
                    FORBIDDEN_IDENTIFIERS.has(node.callee.property.value)
                ) {
                    errors.push({ keyword: node.callee.property.value });
                }
            }
            break;
        case 'NewExpression':
            if (node.callee.type === 'Identifier' && node.callee.name === 'Function') {
                errors.push({ keyword: 'Function' });
            }
            break;
        case 'ImportExpression':
            errors.push({ keyword: 'import' });
            break;
    }
    for (const key in node) {
        const val = (node as unknown as Record<string, unknown>)[key];
        if (
            key === 'type' ||
            key === 'start' ||
            key === 'end' ||
            key === 'range' ||
            key === 'loc' ||
            key === 'optional' ||
            key === 'computed'
        )
            continue;
        if (key === 'sourceType' || key === 'directive') continue;
        if (Array.isArray(val)) {
            for (const item of val) {
                if (item && typeof item === 'object' && 'type' in item) {
                    walkAndValidate(item as ESTree.Node, errors);
                }
            }
        } else if (val && typeof val === 'object' && 'type' in (val as object)) {
            walkAndValidate(val as ESTree.Node, errors);
        }
    }
}

export function validateSandboxCode(code: string): string | null {
    try {
        const wrapped = `async function __sandbox__(){\n${code}\n}`;
        const ast = parseScript(wrapped, { next: true, loc: false, ranges: false });
        const fn = ast.body[0] as ESTree.FunctionDeclaration;
        const errors: ValidationError[] = [];
        for (const stmt of fn.body?.body ?? []) {
            walkAndValidate(stmt, errors);
        }
        if (errors.length > 0) {
            return `Code validation failed: Use of '${errors[0]!.keyword}' is forbidden in sandbox`;
        }
        return null;
    } catch {
        return 'Code validation failed: Unable to parse code';
    }
}

const SAFE_BUILTINS = [
    'Math',
    'Date',
    'JSON',
    'crypto',
    'URL',
    'Uint8Array',
    'Int8Array',
    'Uint8ClampedArray',
    'Int16Array',
    'Uint16Array',
    'Int32Array',
    'Uint32Array',
    'Float32Array',
    'Float64Array',
    'BigInt64Array',
    'BigUint64Array',
    'TextEncoder',
    'TextDecoder',
    'Number',
    'String',
    'Boolean',
    'Array',
    'Object',
    'Promise',
    'Symbol',
    'Error',
    'TypeError',
    'RangeError',
    'SyntaxError',
    'ReferenceError',
    'EvalError',
    'URIError',
    'RegExp',
    'Map',
    'Set',
    'WeakMap',
    'WeakSet',
    'ArrayBuffer',
    'DataView',
    'BigInt',
    'parseInt',
    'parseFloat',
    'isNaN',
    'isFinite',
    'encodeURIComponent',
    'decodeURIComponent',
    'encodeURI',
    'decodeURI',
];

interface Ctx {
    steps: number;
    maxSteps: number;
    depth: number;
    maxDepth: number;
    chainGuard: boolean;
}

type Control =
    | { type: 'normal' }
    | { type: 'return'; value: unknown }
    | { type: 'break'; label?: string }
    | { type: 'continue'; label?: string };

type MaybeAsync<T> = T | Promise<T>;

interface Binding {
    kind: 'let' | 'const' | 'var' | 'func' | 'param';
    value: unknown;
}

class Env {
    parent: Env | null;
    bindings = new Map<string, Binding>();
    isFunction: boolean;
    thisValue: unknown = undefined;

    constructor(parent: Env | null, isFunction: boolean) {
        this.parent = parent;
        this.isFunction = isFunction;
    }

    functionScope(): Env {
        if (this.isFunction) return this;
        return this.parent ? this.parent.functionScope() : this;
    }

    lookup(name: string): Binding | undefined {
        const b = this.bindings.get(name);
        if (b) return b;
        return this.parent ? this.parent.lookup(name) : undefined;
    }

    get(name: string): unknown {
        return this.lookup(name)?.value;
    }

    declare(kind: Binding['kind'], name: string, value: unknown): void {
        const scope = kind === 'var' || kind === 'func' ? this.functionScope() : this;
        const existing = scope.bindings.get(name);
        if (existing) {
            if (existing.kind === 'const')
                throw new TypeError(`Assignment to constant variable '${name}'`);
            existing.value = value;
            return;
        }
        scope.bindings.set(name, { kind, value });
    }

    declareInitializer(kind: Binding['kind'], name: string, value: unknown): void {
        const scope = kind === 'var' || kind === 'func' ? this.functionScope() : this;
        const existing = scope.bindings.get(name);
        if (existing) {
            existing.value = value;
            return;
        }
        scope.bindings.set(name, { kind, value });
    }

    assign(name: string, value: unknown): boolean {
        const b = this.lookup(name);
        if (!b) return false;
        if (b.kind === 'const') throw new TypeError(`Assignment to constant variable '${name}'`);
        b.value = value;
        return true;
    }
}

function createGlobalObject(os: SandboxOs, data: unknown): object {
    const allowed = new Map<string, unknown>([
        ['os', os],
        ['data', data],
        ['console', console],
    ]);
    for (const name of SAFE_BUILTINS)
        allowed.set(name, (globalThis as Record<string, unknown>)[name]);
    return new Proxy(Object.create(null), {
        get: (_: unknown, prop: string | symbol) => {
            if (typeof prop !== 'string') return undefined;
            return allowed.get(prop);
        },
        has: (_: unknown, prop: string | symbol) => typeof prop === 'string' && allowed.has(prop),
        set: () => false,
        deleteProperty: () => false,
        ownKeys: () => [...allowed.keys()],
        getOwnPropertyDescriptor: () => undefined,
        isExtensible: () => false,
        preventExtensions: () => true,
    });
}

function createGlobalEnv(os: SandboxOs, data: unknown): Env {
    const env = new Env(null, true);
    const globals = createGlobalObject(os, data);
    env.declare('let', 'os', os);
    env.declare('let', 'data', data);
    env.declare('let', 'console', console);
    env.declare('let', 'self', globals);
    env.declare('let', 'globalThis', globals);
    for (const name of SAFE_BUILTINS) {
        env.declare('let', name, (globalThis as Record<string, unknown>)[name]);
    }
    env.declare('let', 'undefined', undefined);
    env.declare('let', 'Infinity', Infinity);
    env.declare('let', 'NaN', NaN);
    return env;
}

function isThenable(v: unknown): v is PromiseLike<unknown> {
    return !!v && (typeof v === 'object' || typeof v === 'function') && 'then' in (v as object);
}

function isNullish(v: unknown): boolean {
    return v === null || v === undefined;
}

function tick(ctx: Ctx): void {
    ctx.steps += 1;
    if (ctx.steps > ctx.maxSteps) {
        throw new Error('Sandbox execution step limit exceeded');
    }
}

function assertMemberAccess(name: string): void {
    if (FORBIDDEN_MEMBER_PROPERTIES.has(name)) {
        throw new Error(`Forbidden member access: '${name}'`);
    }
}

function bodyHasAwait(body: ESTree.Node): boolean {
    let found = false;
    function scan(node: unknown): void {
        if (found || !node || typeof node !== 'object') return;
        const obj = node as Record<string, unknown>;
        if (typeof obj.type === 'string' && obj.type === 'AwaitExpression') {
            found = true;
            return;
        }
        if (typeof obj.type === 'string') {
            const t = obj.type as string;
            if (
                t === 'FunctionDeclaration' ||
                t === 'FunctionExpression' ||
                t === 'ArrowFunctionExpression'
            ) {
                return;
            }
        }
        for (const key in obj) {
            const val = obj[key];
            if (val && typeof val === 'object') {
                if (Array.isArray(val)) for (const item of val) scan(item);
                else scan(val);
            }
        }
    }
    scan(body);
    return found;
}

interface Interp {
    ctx: Ctx;
}

function evalNode(interp: Interp, env: Env, node: ESTree.Node): MaybeAsync<unknown>;
function evalNode(interp: Interp, env: Env, node: ESTree.Node): MaybeAsync<unknown> {
    const { ctx } = interp;
    tick(ctx);
    switch (node.type) {
        case 'Identifier':
            return env.get(node.name);
        case 'Literal':
            return literalValue(node);
        case 'TemplateLiteral':
            return evalTemplateLiteral(interp, env, node);
        case 'TaggedTemplateExpression':
            return evalTaggedTemplate(interp, env, node);
        case 'ArrayExpression':
            return evalArray(interp, env, node);
        case 'ObjectExpression':
            return evalObject(interp, env, node);
        case 'FunctionExpression':
        case 'ArrowFunctionExpression':
            return makeCallable(interp, env, node, node.type === 'ArrowFunctionExpression');
        case 'UnaryExpression':
            return evalUnary(interp, env, node);
        case 'UpdateExpression':
            return evalUpdate(interp, env, node);
        case 'BinaryExpression':
            return evalBinary(interp, env, node);
        case 'LogicalExpression':
            return evalLogical(interp, env, node);
        case 'AssignmentExpression':
            return evalAssignment(interp, env, node);
        case 'ConditionalExpression':
            return evalConditional(interp, env, node);
        case 'CallExpression':
            return evalCall(interp, env, node);
        case 'NewExpression':
            return evalNew(interp, env, node);
        case 'MemberExpression':
            return evalMember(interp, env, node);
        case 'SequenceExpression':
            return evalSequence(interp, env, node);
        case 'AwaitExpression':
            return Promise.resolve(evalNode(interp, env, node.argument)).then((v) => v);
        case 'ThisExpression':
            return env.thisValue;
        case 'ChainExpression':
            return evalChain(interp, env, node);
        case 'ParenthesizedExpression':
            return evalNode(interp, env, node.expression);
        case 'ClassExpression':
            throw new Error('Class expressions are not supported in the sandbox interpreter');
        case 'YieldExpression':
            throw new Error('Generator functions are not supported in the sandbox interpreter');
        case 'Super':
        case 'MetaProperty':
            throw new Error('This syntax is not supported in the sandbox interpreter');
        default:
            throw new Error(`Unsupported expression: ${node.type}`);
    }
    return undefined;
}

function literalValue(node: ESTree.Literal): unknown {
    if ('regex' in node && node.regex) {
        return new RegExp(node.regex.pattern, node.regex.flags);
    }
    if ('bigint' in node && node.bigint) {
        return BigInt(node.bigint);
    }
    return node.value;
}

function evalTemplateLiteral(
    interp: Interp,
    env: Env,
    node: ESTree.TemplateLiteral,
): MaybeAsync<string> {
    const queue: Array<() => MaybeAsync<unknown>> = [];
    for (const expr of node.expressions) {
        queue.push(() => evalNode(interp, env, expr));
    }
    return runQueue(queue, (vals) => {
        let s = '';
        let pos = 0;
        for (const q of node.quasis) {
            s += q.value.cooked ?? '';
            if (pos < vals.length) {
                s += String(vals[pos]);
                pos += 1;
            }
        }
        return s;
    });
}

function evalTaggedTemplate(
    interp: Interp,
    env: Env,
    node: ESTree.TaggedTemplateExpression,
): MaybeAsync<unknown> {
    const tag = evalNode(interp, env, node.tag);
    const tpl = evalTemplateLiteral(interp, env, node.quasi);
    return Promise.resolve(tag).then((tagFn) =>
        Promise.resolve(tpl).then(() => {
            if (typeof tagFn !== 'function') throw new TypeError('Tag must be a function');
            const strings = node.quasi.quasis.map((q) => q.value.cooked ?? '');
            const exprs = node.quasi.expressions.map((e) => evalNode(interp, env, e));
            return Promise.all(exprs.map((e) => Promise.resolve(e))).then((vals) => {
                const raw = node.quasi.quasis.map((q) => q.value.raw);
                (strings as unknown as { raw: string[] }).raw = raw;
                return (tagFn as (...a: unknown[]) => unknown)(strings, ...vals);
            });
        }),
    );
}

function evalArray(interp: Interp, env: Env, node: ESTree.ArrayExpression): MaybeAsync<unknown[]> {
    const items: unknown[] = [];
    const queue: Array<() => MaybeAsync<unknown>> = [];
    let cursor = 0;
    for (const el of node.elements) {
        if (el === null) {
            queue.push(() => {
                items[cursor] = undefined;
                cursor += 1;
                return undefined;
            });
            continue;
        }
        if (el.type === 'SpreadElement') {
            const arg = evalNode(interp, env, el.argument);
            queue.push(() =>
                Promise.resolve(arg).then((arr) => {
                    if (arr === null || arr === undefined) return undefined;
                    const iterable = arr as Iterable<unknown>;
                    if (typeof iterable[Symbol.iterator] !== 'function') {
                        throw new TypeError('Spread argument must be iterable');
                    }
                    for (const v of iterable) {
                        items[cursor] = v;
                        cursor += 1;
                    }
                    return undefined;
                }),
            );
        } else {
            const value = evalNode(interp, env, el);
            queue.push(() =>
                Promise.resolve(value).then((v) => {
                    items[cursor] = v;
                    cursor += 1;
                    return undefined;
                }),
            );
        }
    }
    return runQueue(queue, () => items);
}

function pushSpread(items: unknown[], spread: unknown): undefined {
    if (spread === null || spread === undefined) return undefined;
    if (typeof (spread as Iterable<unknown>)[Symbol.iterator] !== 'function') {
        throw new TypeError('Spread argument must be iterable');
    }
    for (const v of spread as Iterable<unknown>) items.push(v);
    return undefined;
}

function evalObject(interp: Interp, env: Env, node: ESTree.ObjectExpression): MaybeAsync<object> {
    const obj: Record<string, unknown> = {};
    const queue: Array<() => MaybeAsync<undefined>> = [];
    const props = node.properties;
    for (const prop of props) {
        if (prop.type === 'SpreadElement') {
            const arg = evalNode(interp, env, prop.argument);
            queue.push(() =>
                Promise.resolve(arg).then((src) => {
                    if (src && typeof src === 'object') Object.assign(obj, src);
                    return undefined;
                }),
            );
            continue;
        }
        const p = prop as ESTree.Property;
        let key: unknown;
        if (p.computed) {
            key = evalNode(interp, env, p.key);
        } else if (p.key.type === 'Identifier') {
            key = p.key.name;
        } else if (p.key.type === 'Literal') {
            key = p.key.value;
        } else {
            key = undefined;
        }
        queue.push(() =>
            Promise.resolve(key).then((k) => {
                const keyStr = String(k);
                assertMemberAccess(keyStr);
                if (p.value.type === 'FunctionExpression') {
                    const fn = makeCallable(interp, env, p.value, false);
                    if (p.kind === 'get') {
                        Object.defineProperty(obj, keyStr, {
                            get: () => (fn as (...a: unknown[]) => unknown)(),
                        });
                    } else if (p.kind === 'set') {
                        Object.defineProperty(obj, keyStr, {
                            set: (v: unknown) => {
                                (fn as (v: unknown) => unknown)(v);
                            },
                        });
                    } else {
                        obj[keyStr] = fn;
                    }
                } else {
                    obj[keyStr] = evalNode(interp, env, p.value);
                }
                return undefined;
            }),
        );
    }
    return runQueue(queue, () => obj);
}

function evalUnary(interp: Interp, env: Env, node: ESTree.UnaryExpression): MaybeAsync<unknown> {
    const arg = evalNode(interp, env, node.argument);
    if (isThenable(arg)) {
        return Promise.resolve(arg).then((v) => applyUnary(node.operator, node.argument, v));
    }
    return applyUnary(node.operator, node.argument, arg);
}

function applyUnary(op: string, argNode: ESTree.Node, value: unknown): unknown {
    switch (op) {
        case '!':
            return !value;
        case '-':
            return -(value as number);
        case '+':
            return +(value as number);
        case '~':
            return ~(value as number);
        case 'void':
            return undefined;
        case 'typeof':
            return typeof value;
        case 'delete':
            if (argNode.type === 'MemberExpression') {
                return false;
            }
            return true;
        default:
            throw new Error(`Unsupported unary operator: ${op}`);
    }
}

function evalUpdate(interp: Interp, env: Env, node: ESTree.UpdateExpression): MaybeAsync<unknown> {
    const arg = node.argument;
    if (arg.type === 'Identifier') {
        const current = env.get(arg.name);
        const next = applyUpdate(node.operator, current);
        if (!env.assign(arg.name, next)) {
            throw new ReferenceError(`${arg.name} is not defined`);
        }
        return node.prefix ? next : current;
    }
    if (arg.type === 'MemberExpression') {
        return Promise.resolve(evalMember(interp, env, arg)).then((current) => {
            const next = applyUpdate(node.operator, current);
            return Promise.resolve(setMemberTarget(interp, env, arg, next)).then(() =>
                node.prefix ? next : current,
            );
        });
    }
    throw new Error('Invalid update target');
}

function applyUpdate(op: '++' | '--', value: unknown): number {
    return op === '++' ? (value as number) + 1 : (value as number) - 1;
}

function evalBinary(interp: Interp, env: Env, node: ESTree.BinaryExpression): MaybeAsync<unknown> {
    const left = evalNode(interp, env, node.left);
    if (isThenable(left)) {
        return Promise.resolve(left).then((lv) => evalBinaryRight(interp, env, node, lv));
    }
    return evalBinaryRight(interp, env, node, left);
}

function evalBinaryRight(
    interp: Interp,
    env: Env,
    node: ESTree.BinaryExpression,
    left: unknown,
): MaybeAsync<unknown> {
    if (node.operator === 'in' || node.operator === 'instanceof') {
        const right = evalNode(interp, env, node.right);
        return Promise.resolve(right).then((rv) => applyBinary(node.operator, left, rv));
    }
    const right = evalNode(interp, env, node.right);
    if (isThenable(right)) {
        return Promise.resolve(right).then((rv) => applyBinary(node.operator, left, rv));
    }
    return applyBinary(node.operator, left, right);
}

function applyBinary(op: string, left: unknown, right: unknown): unknown {
    switch (op) {
        case '+':
            return (left as number) + (right as number);
        case '-':
            return (left as number) - (right as number);
        case '*':
            return (left as number) * (right as number);
        case '/':
            return (left as number) / (right as number);
        case '%':
            return (left as number) % (right as number);
        case '**':
            return (left as number) ** (right as number);
        case '<<':
            return (left as number) << (right as number);
        case '>>':
            return (left as number) >> (right as number);
        case '>>>':
            return (left as number) >>> (right as number);
        case '&':
            return (left as number) & (right as number);
        case '|':
            return (left as number) | (right as number);
        case '^':
            return (left as number) ^ (right as number);
        case '==':
            return left == right;
        case '!=':
            return left != right;
        case '===':
            return left === right;
        case '!==':
            return left !== right;
        case '<':
            return (left as number) < (right as number);
        case '<=':
            return (left as number) <= (right as number);
        case '>':
            return (left as number) > (right as number);
        case '>=':
            return (left as number) >= (right as number);
        case 'in':
            return typeof right === 'object' && right !== null && (left as string) in right;
        case 'instanceof':
            return (
                typeof right === 'function' &&
                (left as object) instanceof (right as new () => object)
            );
        default:
            throw new Error(`Unsupported binary operator: ${op}`);
    }
}

function evalLogical(
    interp: Interp,
    env: Env,
    node: ESTree.LogicalExpression,
): MaybeAsync<unknown> {
    const left = evalNode(interp, env, node.left);
    if (isThenable(left)) {
        return Promise.resolve(left).then((lv) => logicalStep(interp, env, node, lv));
    }
    return logicalStep(interp, env, node, left);
}

function logicalStep(
    interp: Interp,
    env: Env,
    node: ESTree.LogicalExpression,
    left: unknown,
): MaybeAsync<unknown> {
    if (node.operator === '&&') {
        if (!left) return left;
        return evalNode(interp, env, node.right);
    }
    if (node.operator === '||') {
        if (left) return left;
        return evalNode(interp, env, node.right);
    }
    if (node.operator === '??') {
        if (!isNullish(left)) return left;
        return evalNode(interp, env, node.right);
    }
    throw new Error(`Unsupported logical operator: ${node.operator}`);
}

function evalConditional(
    interp: Interp,
    env: Env,
    node: ESTree.ConditionalExpression,
): MaybeAsync<unknown> {
    const cond = evalNode(interp, env, node.test);
    const pick = (cv: unknown): MaybeAsync<unknown> =>
        cv ? evalNode(interp, env, node.consequent) : evalNode(interp, env, node.alternate);
    if (isThenable(cond)) return Promise.resolve(cond).then(pick);
    return pick(cond);
}

function evalSequence(
    interp: Interp,
    env: Env,
    node: ESTree.SequenceExpression,
): MaybeAsync<unknown> {
    let last: MaybeAsync<unknown> = undefined;
    for (const expr of node.expressions) {
        last = evalNode(interp, env, expr);
    }
    return last;
}

function evalMember(interp: Interp, env: Env, node: ESTree.MemberExpression): MaybeAsync<unknown> {
    const obj = evalNode(interp, env, node.object);
    if (isThenable(obj)) {
        return Promise.resolve(obj).then((ov) => evalMemberProp(interp, env, node, ov));
    }
    return evalMemberProp(interp, env, node, obj);
}

function evalMemberProp(
    interp: Interp,
    env: Env,
    node: ESTree.MemberExpression,
    obj: unknown,
): MaybeAsync<unknown> {
    if (isNullish(obj)) {
        if (node.optional || interp.ctx.chainGuard) return undefined;
        throw new TypeError('Cannot read properties of ' + String(obj));
    }
    if (node.computed) {
        const prop = evalNode(interp, env, node.property);
        return Promise.resolve(prop).then((pv) => {
            const name = String(pv);
            assertMemberAccess(name);
            return (obj as Record<string, unknown>)[name];
        });
    }
    const name =
        node.property.type === 'Identifier'
            ? node.property.name
            : String(literalValue(node.property as ESTree.Literal));
    assertMemberAccess(name);
    return (obj as Record<string, unknown>)[name];
}

function evalChain(interp: Interp, env: Env, node: ESTree.ChainExpression): MaybeAsync<unknown> {
    const prev = interp.ctx.chainGuard;
    interp.ctx.chainGuard = true;
    try {
        const res = evalNode(interp, env, node.expression);
        return Promise.resolve(res).then((v) => {
            interp.ctx.chainGuard = prev;
            return v;
        });
    } catch (e) {
        interp.ctx.chainGuard = prev;
        throw e;
    }
}

function evalCall(interp: Interp, env: Env, node: ESTree.CallExpression): MaybeAsync<unknown> {
    const thisArg: unknown = undefined;
    let fn: MaybeAsync<unknown>;
    if (node.callee.type === 'MemberExpression') {
        const obj = evalNode(interp, env, node.callee.object);
        if (isThenable(obj)) {
            return Promise.resolve(obj).then((ov) => evalCallMember(interp, env, node, ov));
        }
        if (isNullish(obj)) {
            if (node.optional || interp.ctx.chainGuard) return undefined;
            throw new TypeError('Cannot read properties of ' + String(obj));
        }
        const prop = node.callee.computed
            ? evalNode(interp, env, node.callee.property)
            : node.callee.property.type === 'Identifier'
              ? node.callee.property.name
              : literalValue(node.callee.property as ESTree.Literal);
        if (isThenable(prop)) {
            return Promise.resolve(prop).then((pv) => {
                const name = String(pv);
                assertMemberAccess(name);
                return callWithArgs(interp, env, node, (obj as Record<string, unknown>)[name], obj);
            });
        }
        const name = String(prop);
        assertMemberAccess(name);
        return callWithArgs(interp, env, node, (obj as Record<string, unknown>)[name], obj);
    } else {
        fn = evalNode(interp, env, node.callee);
    }
    if (isThenable(fn)) {
        return Promise.resolve(fn).then((f) => callWithArgs(interp, env, node, f, thisArg));
    }
    return callWithArgs(interp, env, node, fn, thisArg);
}

function evalCallMember(
    interp: Interp,
    env: Env,
    node: ESTree.CallExpression,
    obj: unknown,
): MaybeAsync<unknown> {
    if (isNullish(obj)) {
        if (node.optional || interp.ctx.chainGuard) return undefined;
        throw new TypeError('Cannot read properties of ' + String(obj));
    }
    const prop = node.callee.computed
        ? evalNode(interp, env, node.callee.property)
        : node.callee.property.type === 'Identifier'
          ? node.callee.property.name
          : literalValue(node.callee.property as ESTree.Literal);
    if (isThenable(prop)) {
        return Promise.resolve(prop).then((pv) => {
            const name = String(pv);
            assertMemberAccess(name);
            return callWithArgs(interp, env, node, (obj as Record<string, unknown>)[name], obj);
        });
    }
    const name = String(prop);
    assertMemberAccess(name);
    return callWithArgs(interp, env, node, (obj as Record<string, unknown>)[name], obj);
}

function callWithArgs(
    interp: Interp,
    env: Env,
    node: ESTree.CallExpression,
    fn: unknown,
    thisArg: unknown,
): MaybeAsync<unknown> {
    if (typeof fn !== 'function') throw new TypeError('The callee is not a function');
    const args = evalArgs(interp, env, node.arguments);
    if (isThenable(args)) {
        return Promise.resolve(args).then((a) =>
            (fn as (...x: unknown[]) => unknown).apply(thisArg, a),
        );
    }
    return (fn as (...x: unknown[]) => unknown).apply(thisArg, args as unknown[]);
}

function evalArgs(interp: Interp, env: Env, args: ESTree.Expression[]): MaybeAsync<unknown[]> {
    const out: unknown[] = [];
    const queue: Array<() => MaybeAsync<undefined>> = [];
    for (const arg of args) {
        if (arg.type === 'SpreadElement') {
            const v = evalNode(interp, env, arg.argument);
            queue.push(() => Promise.resolve(v).then((arr) => pushSpread(out, arr)));
        } else {
            const v = evalNode(interp, env, arg);
            queue.push(() =>
                Promise.resolve(v).then((val) => {
                    out.push(val);
                    return undefined;
                }),
            );
        }
    }
    return runQueue(queue, () => out);
}

function evalNew(interp: Interp, env: Env, node: ESTree.NewExpression): MaybeAsync<unknown> {
    const ctor = evalNode(interp, env, node.callee);
    const args = evalArgs(interp, env, node.arguments);
    const construct = (c: unknown, a: unknown[]): unknown => {
        if (typeof c !== 'function')
            throw new TypeError(`${node.callee.type} is not a constructor`);
        const marker = (c as unknown as { __sandboxUserFn?: boolean }).__sandboxUserFn;
        if (marker) {
            const instance = Object.create((c as () => object).prototype);
            const ret = (c as (...x: unknown[]) => unknown).apply(instance, a);
            return isNullish(ret) ? instance : ret;
        }
        return new (c as new (...x: unknown[]) => object)(...a);
    };
    if (isThenable(ctor)) {
        return Promise.resolve(ctor).then((c) =>
            isThenable(args)
                ? Promise.resolve(args).then((a) => construct(c, a))
                : construct(c, args as unknown[]),
        );
    }
    if (isThenable(args)) return Promise.resolve(args).then((a) => construct(ctor, a));
    return construct(ctor, args as unknown[]);
}

function evalAssignment(
    interp: Interp,
    env: Env,
    node: ESTree.AssignmentExpression,
): MaybeAsync<unknown> {
    const target = node.left;
    if (target.type === 'Identifier') {
        if (node.operator === '=') {
            const value = evalNode(interp, env, node.right);
            if (isThenable(value)) {
                return Promise.resolve(value).then((v) => {
                    if (!env.assign(target.name, v)) {
                        throw new ReferenceError(`${target.name} is not defined`);
                    }
                    return v;
                });
            }
            if (!env.assign(target.name, value)) {
                throw new ReferenceError(`${target.name} is not defined`);
            }
            return value;
        }
        const current = env.get(target.name);
        const value = evalNode(interp, env, node.right);
        const doAssign = (v: unknown): unknown => {
            const result = applyBinary(node.operator.slice(0, -1), current, v);
            if (!env.assign(target.name, result)) {
                throw new ReferenceError(`${target.name} is not defined`);
            }
            return result;
        };
        if (isThenable(value)) return Promise.resolve(value).then(doAssign);
        return doAssign(value);
    }
    if (target.type === 'MemberExpression') {
        if (node.operator === '=') {
            const value = evalNode(interp, env, node.right);
            if (isThenable(value)) {
                return Promise.resolve(value).then((v) => setMemberTarget(interp, env, target, v));
            }
            return setMemberTarget(interp, env, target, value);
        }
        const current = evalMember(interp, env, target);
        if (isThenable(current)) {
            return Promise.resolve(current).then((cv) =>
                compoundMemberAssign(interp, env, node, target, cv),
            );
        }
        return compoundMemberAssign(interp, env, node, target, current);
    }
    if (node.operator === '=') {
        const value = evalNode(interp, env, node.right);
        if (isThenable(value)) {
            return Promise.resolve(value).then((v) =>
                destructurePattern(interp, env, target, v, 'let'),
            );
        }
        return destructurePattern(interp, env, target, value, 'let');
    }
    throw new Error('Invalid assignment target');
}

function compoundMemberAssign(
    interp: Interp,
    env: Env,
    node: ESTree.AssignmentExpression,
    target: ESTree.MemberExpression,
    current: unknown,
): MaybeAsync<unknown> {
    const value = evalNode(interp, env, node.right);
    const assign = (v: unknown): MaybeAsync<unknown> =>
        setMemberTarget(interp, env, target, applyBinary(node.operator.slice(0, -1), current, v));
    if (isThenable(value)) return Promise.resolve(value).then(assign);
    return assign(value);
}

function setMemberTarget(
    interp: Interp,
    env: Env,
    node: ESTree.MemberExpression,
    value: unknown,
): MaybeAsync<unknown> {
    const obj = evalNode(interp, env, node.object);
    return Promise.resolve(obj).then((ov) => {
        if (isNullish(ov)) throw new TypeError('Cannot set property on ' + String(ov));
        if (node.computed) {
            const prop = evalNode(interp, env, node.property);
            return Promise.resolve(prop).then((pv) => {
                const name = String(pv);
                assertMemberAccess(name);
                (ov as Record<string, unknown>)[name] = value;
                return value;
            });
        }
        const name =
            node.property.type === 'Identifier'
                ? node.property.name
                : String(literalValue(node.property as ESTree.Literal));
        assertMemberAccess(name);
        (ov as Record<string, unknown>)[name] = value;
        return value;
    });
}

function runQueue<T>(
    queue: Array<() => MaybeAsync<unknown>>,
    done: (vals: unknown[]) => T,
): MaybeAsync<T> {
    const vals: unknown[] = [];
    let idx = 0;
    function next(): MaybeAsync<T> {
        if (idx >= queue.length) return done(vals);
        const res = queue[idx]!();
        idx += 1;
        if (isThenable(res)) {
            return Promise.resolve(res).then((v) => {
                vals.push(v);
                return next();
            });
        }
        vals.push(res);
        return next();
    }
    return next();
}

function destructurePattern(
    interp: Interp,
    env: Env,
    pattern: ESTree.Node,
    value: unknown,
    kind: Binding['kind'],
): MaybeAsync<unknown> {
    if (pattern.type === 'Identifier') {
        env.declareInitializer(kind, pattern.name, value);
        return value;
    }
    if (pattern.type === 'AssignmentPattern') {
        const computed = pattern.right ? evalNode(interp, env, pattern.right) : undefined;
        if (isThenable(computed)) {
            return Promise.resolve(computed).then((c) => {
                const v = isNullish(value) ? c : value;
                return destructurePattern(interp, env, pattern.left, v, kind);
            });
        }
        const v = isNullish(value) ? computed : value;
        return destructurePattern(interp, env, pattern.left, v, kind);
    }
    if (pattern.type === 'ObjectPattern') {
        const obj = (value ?? {}) as Record<string, unknown>;
        const queue: Array<() => MaybeAsync<unknown>> = [];
        for (const prop of pattern.properties) {
            if (prop.type === 'RestElement') {
                queue.push(() => {
                    const rest: Record<string, unknown> = {};
                    for (const key of Object.keys(obj)) {
                        if (
                            !pattern.properties.some(
                                (p) =>
                                    p.type === 'Property' &&
                                    !p.computed &&
                                    (p.key as ESTree.Identifier).name === key,
                            )
                        ) {
                            rest[key] = obj[key];
                        }
                    }
                    return destructurePattern(interp, env, prop.argument, rest, kind);
                });
                continue;
            }
            const p = prop as ESTree.Property;
            const key: MaybeAsync<string> = p.computed
                ? Promise.resolve(evalNode(interp, env, p.key)).then((k) => String(k))
                : p.key.type === 'Identifier'
                  ? p.key.name
                  : String(literalValue(p.key as ESTree.Literal));
            queue.push(() =>
                Promise.resolve(key).then((k) =>
                    destructurePattern(interp, env, p.value, obj[k], kind),
                ),
            );
        }
        return runQueue(queue, () => value);
    }
    if (pattern.type === 'ArrayPattern') {
        const arr = (value ?? []) as unknown[];
        const queue: Array<() => MaybeAsync<unknown>> = [];
        let idx = 0;
        for (const el of pattern.elements) {
            if (el === null) {
                idx += 1;
                continue;
            }
            if (el.type === 'RestElement') {
                queue.push(() =>
                    destructurePattern(interp, env, el.argument, arr.slice(idx), kind),
                );
                idx += 1;
                continue;
            }
            const i = idx;
            queue.push(() => destructurePattern(interp, env, el, arr[i], kind));
            idx += 1;
        }
        return runQueue(queue, () => value);
    }
    throw new Error(`Unsupported destructuring pattern: ${pattern.type}`);
}

type CallableNode =
    ESTree.FunctionDeclaration | ESTree.FunctionExpression | ESTree.ArrowFunctionExpression;

function makeCallable(
    interp: Interp,
    env: Env,
    node: CallableNode,
    isArrow: boolean,
): (...args: unknown[]) => unknown {
    const fnBody = node.body;
    const isAsync = (node.async || (fnBody ? bodyHasAwait(fnBody) : false)) as boolean;
    const invoke = (thisArg: unknown, args: unknown[]): MaybeAsync<unknown> => {
        interp.ctx.depth += 1;
        if (interp.ctx.depth > interp.ctx.maxDepth) {
            interp.ctx.depth -= 1;
            throw new Error('Sandbox call depth limit exceeded');
        }
        try {
            const callEnv = new Env(env, true);
            callEnv.thisValue = isArrow ? env.thisValue : thisArg;
            const bodyStatements: ESTree.Node[] =
                fnBody && fnBody.type === 'BlockStatement' ? fnBody.body : [];
            hoistScope(interp, callEnv, bodyStatements);
            const bindRes = bindParams(interp, callEnv, node, args);
            const runBody = (): MaybeAsync<unknown> => {
                if (fnBody && fnBody.type !== 'BlockStatement') {
                    const v = evalNode(interp, callEnv, fnBody);
                    return isThenable(v) ? Promise.resolve(v) : v;
                }
                const bodyStatements: ESTree.Node[] = (fnBody as ESTree.BlockStatement).body;
                const res = evalStmts(interp, callEnv, bodyStatements);
                const finish = (c: Control): unknown => (c.type === 'return' ? c.value : undefined);
                return isThenable(res) ? Promise.resolve(res).then(finish) : finish(res as Control);
            };
            if (isThenable(bindRes)) return Promise.resolve(bindRes).then(() => runBody());
            return runBody();
        } finally {
            interp.ctx.depth -= 1;
        }
    };
    const fn = function (this: unknown, ...args: unknown[]) {
        return invoke(this, args);
    } as (...args: unknown[]) => unknown;
    (fn as unknown as { __sandboxUserFn: boolean }).__sandboxUserFn = true;
    (fn as unknown as { __sandboxAsync: boolean }).__sandboxAsync = isAsync;
    return fn;
}

function bindParams(
    interp: Interp,
    env: Env,
    node: CallableNode,
    args: unknown[],
): MaybeAsync<unknown> {
    const params = node.params as ESTree.Pattern[];
    const queue: Array<() => MaybeAsync<unknown>> = [];
    let idx = 0;
    for (const param of params) {
        if (param.type === 'RestElement') {
            queue.push(() =>
                destructurePattern(interp, env, param.argument, args.slice(idx), 'param'),
            );
            break;
        }
        const i = idx;
        queue.push(() =>
            destructurePattern(interp, env, param, i < args.length ? args[i] : undefined, 'param'),
        );
        idx += 1;
    }
    return runQueue(queue, () => undefined);
}

function hoistScope(interp: Interp, env: Env, body: ESTree.Node[]): void {
    function collectVars(node: ESTree.Node): void {
        if (node.type === 'FunctionDeclaration') {
            if (node.id) {
                const fn = makeCallable(interp, env, node, false);
                env.declare('func', node.id.name, fn);
            }
            return;
        }
        if (
            node.type === 'FunctionExpression' ||
            node.type === 'ArrowFunctionExpression' ||
            node.type === 'ClassDeclaration' ||
            node.type === 'ClassExpression'
        ) {
            return;
        }
        if (node.type === 'VariableDeclaration') {
            if (node.kind === 'var') {
                for (const d of node.declarations) {
                    if (d.id.type === 'Identifier') env.declare('var', d.id.name, undefined);
                }
            }
            return;
        }
        for (const key in node) {
            const val = (node as unknown as Record<string, unknown>)[key];
            if (
                key === 'type' ||
                key === 'loc' ||
                key === 'start' ||
                key === 'end' ||
                key === 'range'
            )
                continue;
            if (Array.isArray(val)) {
                for (const item of val) {
                    if (item && typeof item === 'object' && 'type' in item)
                        collectVars(item as ESTree.Node);
                }
            } else if (val && typeof val === 'object' && 'type' in (val as object)) {
                collectVars(val as ESTree.Node);
            }
        }
    }
    for (const stmt of body) {
        collectVars(stmt);
    }
}

const EXPRESSION_NODE_TYPES = new Set([
    'Identifier',
    'Literal',
    'TemplateLiteral',
    'TaggedTemplateExpression',
    'ArrayExpression',
    'ObjectExpression',
    'FunctionExpression',
    'ArrowFunctionExpression',
    'UnaryExpression',
    'UpdateExpression',
    'BinaryExpression',
    'LogicalExpression',
    'AssignmentExpression',
    'ConditionalExpression',
    'CallExpression',
    'NewExpression',
    'MemberExpression',
    'SequenceExpression',
    'AwaitExpression',
    'ThisExpression',
    'ChainExpression',
    'ParenthesizedExpression',
]);

function evalStmts(interp: Interp, env: Env, stmts: ESTree.Node[]): MaybeAsync<Control> {
    for (let i = 0; i < stmts.length; i++) {
        tick(interp.ctx);
        const res = evalStmt(interp, env, stmts[i]!);
        if (isThenable(res)) {
            return Promise.resolve(res).then((r) =>
                r.type === 'normal' ? evalStmts(interp, env, stmts.slice(i + 1)) : r,
            );
        }
        const c = res as Control;
        if (c.type !== 'normal') return c;
    }
    return { type: 'normal' };
}

function evalStmt(interp: Interp, env: Env, stmt: ESTree.Node): MaybeAsync<Control> {
    switch (stmt.type) {
        case 'BlockStatement': {
            const blockEnv = new Env(env, false);
            return evalStmts(interp, blockEnv, stmt.body);
        }
        case 'EmptyStatement':
        case 'DebuggerStatement':
            return { type: 'normal' };
        case 'ExpressionStatement': {
            const v = evalNode(interp, env, stmt.expression);
            return isThenable(v)
                ? Promise.resolve(v).then(() => ({ type: 'normal' as const }))
                : { type: 'normal' };
        }
        case 'VariableDeclaration':
            return evalVarDecl(interp, env, stmt);
        case 'FunctionDeclaration': {
            if (stmt.id) {
                const fn = makeCallable(interp, env, stmt, false);
                env.declare('func', stmt.id.name, fn);
            }
            return { type: 'normal' };
        }
        case 'IfStatement':
            return evalIf(interp, env, stmt);
        case 'ReturnStatement': {
            if (!stmt.argument) return { type: 'return', value: undefined };
            const v = evalNode(interp, env, stmt.argument);
            return isThenable(v)
                ? Promise.resolve(v).then((val) => ({ type: 'return', value: val }))
                : { type: 'return', value: v };
        }
        case 'ThrowStatement': {
            const v = evalNode(interp, env, stmt.argument);
            return Promise.resolve(v).then((val) => {
                throw val;
            });
        }
        case 'TryStatement':
            return evalTry(interp, env, stmt);
        case 'WhileStatement':
            return evalWhile(interp, env, stmt);
        case 'DoWhileStatement':
            return evalDoWhile(interp, env, stmt);
        case 'ForStatement':
            return evalFor(interp, env, stmt);
        case 'ForInStatement':
            return evalForInOf(interp, env, stmt);
        case 'ForOfStatement':
            return evalForInOf(interp, env, stmt);
        case 'BreakStatement':
            return { type: 'break', label: stmt.label?.name };
        case 'ContinueStatement':
            return { type: 'continue', label: stmt.label?.name };
        case 'LabeledStatement':
            return evalLabeled(interp, env, stmt);
        case 'SwitchStatement':
            return evalSwitch(interp, env, stmt);
        case 'WithStatement':
            throw new Error('with statements are forbidden in the sandbox');
        case 'ClassDeclaration':
            throw new Error('Class declarations are not supported in the sandbox interpreter');
        default: {
            if (EXPRESSION_NODE_TYPES.has(stmt.type)) {
                const v = evalNode(interp, env, stmt);
                return isThenable(v)
                    ? Promise.resolve(v).then(() => ({ type: 'normal' as const }))
                    : { type: 'normal' };
            }
            throw new Error(`Unsupported statement: ${stmt.type}`);
        }
    }
}

function evalVarDecl(
    interp: Interp,
    env: Env,
    node: ESTree.VariableDeclaration,
): MaybeAsync<Control> {
    const queue: Array<() => MaybeAsync<unknown>> = [];
    for (const d of node.declarations) {
        const kind = node.kind as Binding['kind'];
        if (d.id.type === 'Identifier') {
            env.declare(kind, d.id.name, undefined);
        }
    }
    for (const d of node.declarations) {
        if (!d.init) continue;
        const target = d.id;
        const kind = node.kind as Binding['kind'];
        const init = evalNode(interp, env, d.init);
        if (isThenable(init)) {
            queue.push(() =>
                Promise.resolve(init).then((v) => destructurePattern(interp, env, target, v, kind)),
            );
        } else {
            const bindRes = destructurePattern(interp, env, target, init, kind);
            if (isThenable(bindRes)) {
                queue.push(() => Promise.resolve(bindRes).then(() => undefined));
            }
        }
    }
    if (queue.length === 0) return { type: 'normal' };
    return runQueue(queue, () => ({ type: 'normal' })) as MaybeAsync<Control>;
}

function evalIf(interp: Interp, env: Env, node: ESTree.IfStatement): MaybeAsync<Control> {
    const cond = evalNode(interp, env, node.test);
    const pick = (c: unknown): MaybeAsync<Control> =>
        c
            ? evalStmt(interp, env, node.consequent)
            : node.alternate
              ? evalStmt(interp, env, node.alternate)
              : { type: 'normal' };
    if (isThenable(cond)) return Promise.resolve(cond).then(pick);
    return pick(cond);
}

function evalLabeled(interp: Interp, env: Env, node: ESTree.LabeledStatement): MaybeAsync<Control> {
    const label = node.label.name;
    const res = evalStmt(interp, env, node.body);
    return Promise.resolve(res).then((r) => {
        if (r.type === 'break' && r.label === label) return { type: 'normal' };
        if (r.type === 'continue' && r.label === label) return { type: 'continue' };
        return r;
    });
}

type LoopAction = 'stop' | 'continue' | { propagate: Control };

function loopControl(r: Control): LoopAction {
    if (r.type === 'return') return { propagate: r };
    if (r.type === 'break') {
        if (r.label) return { propagate: r };
        return 'stop';
    }
    if (r.type === 'continue' && r.label) return { propagate: r };
    return 'continue';
}

function evalWhile(interp: Interp, env: Env, node: ESTree.WhileStatement): MaybeAsync<Control> {
    const loopEnv = new Env(env, false);
    while (true) {
        tick(interp.ctx);
        const test = evalNode(interp, env, node.test);
        if (isThenable(test)) {
            return Promise.resolve(test).then((t) =>
                t ? asyncWhileBody(interp, loopEnv, node) : ({ type: 'normal' } as Control),
            );
        }
        if (!test) return { type: 'normal' };
        const res = evalStmts(
            interp,
            loopEnv,
            node.body.type === 'BlockStatement' ? node.body.body : [node.body],
        );
        if (isThenable(res)) {
            return Promise.resolve(res).then((r) => continueWhile(interp, loopEnv, node, r));
        }
        const c = res as Control;
        const action = loopControl(c);
        if (action === 'stop') return { type: 'normal' };
        if (typeof action === 'object') return action.propagate;
    }
}

function asyncWhileBody(
    interp: Interp,
    loopEnv: Env,
    node: ESTree.WhileStatement,
): MaybeAsync<Control> {
    const res = evalStmts(
        interp,
        loopEnv,
        node.body.type === 'BlockStatement' ? node.body.body : [node.body],
    );
    return Promise.resolve(res).then((r) => continueWhile(interp, loopEnv, node, r));
}

function continueWhile(
    interp: Interp,
    loopEnv: Env,
    node: ESTree.WhileStatement,
    r: Control,
): MaybeAsync<Control> {
    const action = loopControl(r);
    if (action === 'stop') return { type: 'normal' };
    if (typeof action === 'object') return action.propagate;
    return evalWhile(interp, loopEnv, node);
}

function evalDoWhile(interp: Interp, env: Env, node: ESTree.DoWhileStatement): MaybeAsync<Control> {
    const loopEnv = new Env(env, false);
    while (true) {
        tick(interp.ctx);
        const res = evalStmts(
            interp,
            loopEnv,
            node.body.type === 'BlockStatement' ? node.body.body : [node.body],
        );
        if (isThenable(res)) {
            return Promise.resolve(res).then((r) => continueDoWhile(interp, loopEnv, node, r));
        }
        const c = res as Control;
        const action = loopControl(c);
        if (action === 'stop') return { type: 'normal' };
        if (typeof action === 'object') return action.propagate;
        const test = evalNode(interp, env, node.test);
        if (isThenable(test)) {
            return Promise.resolve(test).then((t) =>
                t ? evalDoWhile(interp, loopEnv, node) : ({ type: 'normal' } as Control),
            );
        }
        if (!test) return { type: 'normal' };
    }
}

function continueDoWhile(
    interp: Interp,
    loopEnv: Env,
    node: ESTree.DoWhileStatement,
    r: Control,
): MaybeAsync<Control> {
    const action = loopControl(r);
    if (action === 'stop') return { type: 'normal' };
    if (typeof action === 'object') return action.propagate;
    const test = evalNode(interp, loopEnv, node.test);
    return Promise.resolve(test).then((t) =>
        t ? evalDoWhile(interp, loopEnv, node) : ({ type: 'normal' } as Control),
    );
}

function evalFor(interp: Interp, env: Env, node: ESTree.ForStatement): MaybeAsync<Control> {
    const loopEnv = new Env(env, false);
    const initRes = node.init
        ? evalForInit(interp, loopEnv, node.init)
        : ({ type: 'normal' } as Control);
    return Promise.resolve(initRes).then(() => forLoop(interp, loopEnv, node));
}

function evalForInit(interp: Interp, env: Env, init: ESTree.Node): MaybeAsync<Control> {
    if (init.type === 'VariableDeclaration') return evalVarDecl(interp, env, init);
    const v = evalNode(interp, env, init);
    return isThenable(v)
        ? Promise.resolve(v).then(() => ({ type: 'normal' }) as Control)
        : ({ type: 'normal' } as Control);
}

function forLoop(interp: Interp, loopEnv: Env, node: ESTree.ForStatement): MaybeAsync<Control> {
    while (true) {
        tick(interp.ctx);
        if (node.test) {
            const t = evalNode(interp, loopEnv, node.test);
            if (isThenable(t)) {
                return Promise.resolve(t).then((tv) =>
                    tv ? forBodyThenUpdate(interp, loopEnv, node) : ({ type: 'normal' } as Control),
                );
            }
            if (!t) return { type: 'normal' };
        }
        const res = evalStmts(
            interp,
            loopEnv,
            node.body.type === 'BlockStatement' ? node.body.body : [node.body],
        );
        if (isThenable(res)) {
            return Promise.resolve(res).then((r) => forContinue(interp, loopEnv, node, r));
        }
        const c = res as Control;
        const action = loopControl(c);
        if (action === 'stop') return { type: 'normal' };
        if (typeof action === 'object') return action.propagate;
        const updateRes = node.update ? evalNode(interp, loopEnv, node.update) : undefined;
        if (isThenable(updateRes)) {
            return Promise.resolve(updateRes).then(() => forLoop(interp, loopEnv, node));
        }
    }
}

function forBodyThenUpdate(
    interp: Interp,
    loopEnv: Env,
    node: ESTree.ForStatement,
): MaybeAsync<Control> {
    const res = evalStmts(
        interp,
        loopEnv,
        node.body.type === 'BlockStatement' ? node.body.body : [node.body],
    );
    return Promise.resolve(res).then((r) => forContinue(interp, loopEnv, node, r));
}

function forContinue(
    interp: Interp,
    loopEnv: Env,
    node: ESTree.ForStatement,
    r: Control,
): MaybeAsync<Control> {
    const action = loopControl(r);
    if (action === 'stop') return { type: 'normal' };
    if (typeof action === 'object') return action.propagate;
    const updateRes = node.update ? evalNode(interp, loopEnv, node.update) : undefined;
    return Promise.resolve(updateRes).then(() => forLoop(interp, loopEnv, node));
}

function evalForInOf(
    interp: Interp,
    env: Env,
    node: ESTree.ForInStatement | ESTree.ForOfStatement,
): MaybeAsync<Control> {
    const loopEnv = new Env(env, false);
    const isIn = node.type === 'ForInStatement';
    const iterable = evalNode(interp, env, node.right);
    return Promise.resolve(iterable).then((it) => {
        const items: unknown[] = [];
        if (isIn) {
            if (it === null || it === undefined) return { type: 'normal' } as Control;
            for (const key of Object.keys(it)) items.push(key);
        } else {
            if (it === null || it === undefined) return { type: 'normal' } as Control;
            if (typeof (it as Iterable<unknown>)[Symbol.iterator] !== 'function') {
                throw new TypeError('Right-hand side of for-of is not iterable');
            }
            for (const v of it as Iterable<unknown>) items.push(v);
        }
        return forEachItem(interp, loopEnv, node, items);
    });
}

function forEachItem(
    interp: Interp,
    loopEnv: Env,
    node: ESTree.ForInStatement | ESTree.ForOfStatement,
    items: unknown[],
): MaybeAsync<Control> {
    for (let i = 0; i < items.length; i++) {
        tick(interp.ctx);
        const leftRaw = node.left;
        const bindTarget: ESTree.Node =
            leftRaw.type === 'VariableDeclaration'
                ? (leftRaw.declarations[0]?.id ?? leftRaw)
                : leftRaw;
        const bindKind: Binding['kind'] =
            leftRaw.type === 'VariableDeclaration' ? (leftRaw.kind as Binding['kind']) : 'let';
        const iterEnv = new Env(loopEnv, false);
        const bindRes = destructurePattern(interp, iterEnv, bindTarget, items[i], bindKind);
        const res = isThenable(bindRes)
            ? Promise.resolve(bindRes).then(() =>
                  evalStmts(
                      interp,
                      iterEnv,
                      node.body.type === 'BlockStatement' ? node.body.body : [node.body],
                  ),
              )
            : evalStmts(
                  interp,
                  iterEnv,
                  node.body.type === 'BlockStatement' ? node.body.body : [node.body],
              );
        const finalRes = isThenable(res)
            ? Promise.resolve(res).then((r) => checkLoopControl(r))
            : checkLoopControl(res as Control);
        if (isThenable(finalRes)) {
            return Promise.resolve(finalRes).then((c) => {
                if (c === null) return { type: 'normal' };
                if (c.type !== 'normal') return c;
                return forEachItem(interp, loopEnv, node, items.slice(i + 1));
            });
        }
        const c = finalRes as Control | null;
        if (c === null) return { type: 'normal' };
        if (c.type !== 'normal') return c;
    }
    return { type: 'normal' };
}

function checkLoopControl(r: Control): Control | null {
    if (r.type === 'break') return r.label ? r : null;
    if (r.type === 'continue' && r.label) return r;
    return r;
}

function evalSwitch(interp: Interp, env: Env, node: ESTree.SwitchStatement): MaybeAsync<Control> {
    const discriminant = evalNode(interp, env, node.discriminant);
    return Promise.resolve(discriminant).then((d) => {
        const switchEnv = new Env(env, false);
        const cases = node.cases;
        const checks: Array<MaybeAsync<boolean>> = [];
        let defaultIdx = -1;
        for (let i = 0; i < cases.length; i++) {
            const c = cases[i]!;
            if (!c.test) {
                if (defaultIdx === -1) defaultIdx = i;
                checks.push(false);
                continue;
            }
            checks.push(
                Promise.resolve(evalNode(interp, switchEnv, c.test)).then((tv) => tv === d),
            );
        }
        return Promise.all(checks.map((c) => Promise.resolve(c))).then((matches) => {
            let startIdx = matches.indexOf(true);
            if (startIdx === -1) {
                if (defaultIdx === -1) return { type: 'normal' };
                startIdx = defaultIdx;
            }
            return evalSwitchCases(interp, switchEnv, cases, startIdx);
        });
    });
}

function evalSwitchCases(
    interp: Interp,
    env: Env,
    cases: ESTree.SwitchCase[],
    startIdx: number,
): MaybeAsync<Control> {
    const stmts: ESTree.Node[] = [];
    for (let i = startIdx; i < cases.length; i++) {
        for (const c of cases[i]!.consequent) stmts.push(c);
    }
    const res = evalStmts(interp, env, stmts);
    return Promise.resolve(res).then((r) =>
        r.type === 'break' ? ({ type: 'normal' } as Control) : r,
    );
}

function evalTry(interp: Interp, env: Env, node: ESTree.TryStatement): MaybeAsync<Control> {
    let bodyRes: MaybeAsync<Control>;
    try {
        bodyRes = evalStmts(interp, env, node.block.body);
    } catch (e) {
        bodyRes = Promise.reject(e);
    }

    const runFinalizer = (
        bodyControl: Control | null,
        pendingError: unknown,
        hasError: boolean,
    ): MaybeAsync<Control> => {
        if (!node.finalizer) {
            if (hasError) throw pendingError;
            return bodyControl as Control;
        }
        const merge = (finalRes: Control): Control => {
            if (finalRes.type !== 'normal') return finalRes;
            if (hasError) throw pendingError;
            return bodyControl as Control;
        };
        const f = evalStmts(interp, env, node.finalizer.body);
        if (isThenable(f)) return Promise.resolve(f).then(merge);
        return merge(f as Control);
    };

    const settleBody = (c: Control): MaybeAsync<Control> => runFinalizer(c, undefined, false);

    const settleError = (e: unknown): MaybeAsync<Control> => {
        const handler = node.handler;
        if (!handler) return runFinalizer(null, e, true);
        const catchEnv = new Env(env, false);
        const param = handler.param
            ? destructurePattern(interp, catchEnv, handler.param, e, 'let')
            : undefined;
        return Promise.resolve(param).then(() => {
            let cres: MaybeAsync<Control>;
            try {
                cres = evalStmts(interp, catchEnv, handler.body.body);
            } catch (ce) {
                cres = Promise.reject(ce);
            }
            return Promise.resolve(cres).then(
                (c) => runFinalizer(c, undefined, false),
                (ce) => runFinalizer(null, ce, true),
            );
        });
    };

    return Promise.resolve(bodyRes).then(settleBody, settleError);
}

export async function runSandboxCode(
    code: string,
    data: unknown,
    os: SandboxOs,
    options: SandboxRunOptions = {},
): Promise<unknown> {
    const validationError = validateSandboxCode(code);
    if (validationError) throw new Error(validationError);

    let ast: ESTree.Program;
    try {
        const wrapped = `async function __sandbox__(){\n${code}\n}`;
        ast = parseScript(wrapped, { next: true, loc: false, ranges: false });
    } catch (e) {
        throw new Error(`Unable to parse code: ${(e as Error).message}`, { cause: e });
    }

    const fn = ast.body[0] as ESTree.FunctionDeclaration;
    const interp: Interp = {
        ctx: {
            steps: 0,
            maxSteps: options.maxSteps ?? MAX_STEPS_DEFAULT,
            depth: 0,
            maxDepth: options.maxDepth ?? MAX_DEPTH_DEFAULT,
            chainGuard: false,
        },
    };
    const env = createGlobalEnv(os, data);
    const body = fn.body?.body ?? [];
    hoistScope(interp, env, body);
    const result = evalStmts(interp, env, body);
    const control = (await Promise.resolve(result)) as Control;
    return control.type === 'return' ? control.value : undefined;
}
