/**
 * ESLint rule: mandatory-lifecycle
 *
 * Ensures that exported kernel service classes which use managed
 * resources (EventBus subscriptions, timers, AbortControllers)
 * implement a destroy() method (ILifecycle).
 *
 * Container.clear() and LifecycleManager.shutdown() call destroy()
 * on every registered service. A class that subscribes to events
 * or starts timers but lacks destroy() will leak on shutdown.
 *
 * Exceptions:
 *   - Abstract classes
 *   - Class name starts with "Base" or "I"
 *   - Classes with no EventBus subscriptions, timers, or controllers
 */

const KERNEL_SERVICES_PATTERN = /src[\\/]kernel[\\/]services[\\/]/;

/**
 * Check if a class body uses managed resources that need cleanup.
 */
function usesManagedResources(body) {
    let usesResources = false;
    for (const member of body) {
        if (member.type !== 'MethodDefinition' && member.type !== 'PropertyDefinition') continue;

        const value = member.type === 'PropertyDefinition' ? member.value : member.value;

        if (!value) continue;

        const sourceCode =
            value.type === 'FunctionExpression'
                ? (value.body?.body ?? [])
                : (value.body?.body ?? []);

        function findCallee(node) {
            if (!node || node.type !== 'CallExpression') return false;
            const callee = node.callee;
            // Check for: this.eventBus.on(, this.deps.eventBus.on(, .onSafe(, setTimeout(, setInterval(, new AbortController(
            if (callee.type === 'MemberExpression') {
                const propName = callee.property?.name;
                if (['on', 'onSafe', 'subscribeAll'].includes(propName)) return true;
                if (propName === 'on' || propName === 'onSafe') return true;
            }
            if (callee.type === 'Identifier') {
                if (['setTimeout', 'setInterval'].includes(callee.name)) return true;
            }
            if (
                node.type === 'NewExpression' &&
                callee.type === 'Identifier' &&
                callee.name === 'AbortController'
            ) {
                return true;
            }
            return false;
        }

        function walk(node) {
            if (!node || typeof node !== 'object') return;
            if (findCallee(node)) {
                usesResources = true;
                return;
            }
            if (usesResources) return;
            for (const key of Object.keys(node)) {
                if (key === 'parent') continue;
                const child = node[key];
                if (Array.isArray(child)) {
                    for (const c of child) walk(c);
                } else if (child && typeof child.type === 'string') {
                    walk(child);
                }
            }
        }

        walk(sourceCode);
    }
    return usesResources;
}

export const mandatoryLifecycleRule = {
    meta: {
        type: 'suggestion',
        docs: {
            description:
                'Enforce that exported kernel service classes using managed resources implement destroy() (ILifecycle)',
        },
        schema: [],
    },
    create(context) {
        const filename = context.filename ?? context.getFilename();
        if (!KERNEL_SERVICES_PATTERN.test(filename)) return {};

        return {
            ExportNamedDeclaration(node) {
                if (node.declaration?.type !== 'ClassDeclaration' || !node.declaration.id?.name)
                    return;

                const classNode = node.declaration;
                const className = classNode.id.name;

                // Skip exceptions
                if (
                    className === 'ILifecycle' ||
                    className.startsWith('Base') ||
                    className === 'I' + className.slice(1) ||
                    classNode.abstract
                )
                    return;

                // Check if already has destroy()
                const hasDestroy = classNode.body.body.some(
                    (member) =>
                        member.type === 'MethodDefinition' &&
                        member.key.type === 'Identifier' &&
                        member.key.name === 'destroy',
                );
                if (hasDestroy) return;

                // Only flag if class uses managed resources
                if (!usesManagedResources(classNode.body.body)) return;

                context.report({
                    node: classNode.id,
                    message: `Class '${className}' in kernel/services/ uses EventBus/timers/AbortController but has no destroy() method. Add destroy() to clean up subscriptions and prevent leaks on shutdown (ILifecycle).`,
                });
            },
        };
    },
};
