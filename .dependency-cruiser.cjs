/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
    forbidden: [
        {
            name: 'no-circular',
            severity: 'error',
            from: {},
            to: { circular: true },
        },
        {
            name: 'no-react-in-kernel',
            severity: 'error',
            comment: 'Kernel must not import React/UI libraries',
            from: { path: '^src/kernel/' },
            module: {
                path: '^(react|react-dom|react-router-dom|zustand|lucide-react|framer-motion)$',
            },
        },
        {
            name: 'no-ui-in-kernel',
            severity: 'error',
            comment:
                'Kernel must not import UI components or stores. UI-backed adapters are registered into the DI container by the UI composition root.',
            from: { path: '^src/kernel/' },
            to: { path: '^src/(components|stores)/' },
        },
        {
            name: 'no-kernel-business-services-in-llm',
            severity: 'warn',
            comment: 'LLM adapters should not import kernel business services directly',
            from: { path: '^src/llm/' },
            to: {
                path: '^src/kernel/services/(?!(logger-service|config-registry|cross-tab-state)\\.)',
            },
        },
    ],
    options: {
        doNotFollow: {
            path: 'node_modules',
        },
        tsPreCompilationDeps: true,
        tsConfig: {
            fileName: 'tsconfig.json',
        },
        enhancedResolveOptions: {
            exportsFields: ['exports'],
            conditionNames: ['import', 'require', 'default'],
        },
        exclude: {
            path: ['node_modules', 'dist', '\\.test\\.', '\\.spec\\.', '\\.worker\\.'],
        },
    },
};
