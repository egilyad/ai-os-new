import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';
import { mandatoryLifecycleRule } from './eslint/rule-mandatory-lifecycle.mjs';
import { noRawStyleColorRule } from './eslint/rule-no-raw-style-color.mjs';

export default defineConfig([
    globalIgnores(['dist', 'audit', 'docs', 'e2e', 'coverage', 'prompt-vault']),
    {
        files: ['**/*.{ts,tsx}'],
        extends: [
            js.configs.recommended,
            tseslint.configs.recommended,
            reactHooks.configs.flat.recommended,
            reactRefresh.configs.vite,
        ],
        languageOptions: {
            globals: globals.browser,
        },
        rules: {
            '@typescript-eslint/no-explicit-any': 'error',
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
            'react-hooks/exhaustive-deps': 'error',
            'react-refresh/only-export-components': 'warn',
            'react-hooks/set-state-in-effect': 'warn',
            'react-hooks/refs': 'warn',
            'react-hooks/purity': 'warn',
            'react-hooks/immutability': 'warn',
            'no-restricted-imports': [
                'warn',
                {
                    patterns: [
                        {
                            group: ['**/database-service'],
                            importNames: ['dexieDb'],
                            message:
                                'Direct dexieDb access is reserved for DAL (src/kernel/dal/), storage layer (src/kernel/services/storage/), and database-service.ts itself. Use DataAccessLayer (DAL) repository instead.',
                        },
                    ],
                    paths: [
                        {
                            name: '..',
                            importNames: ['eventBus', 'EVENTS'],
                            message:
                                'Import EventBus from kernel/events/event-bus, not from parent modules.',
                        },
                    ],
                },
            ],
        },
    },
    {
        files: [
            'src/kernel/dal/**',
            'src/kernel/services/storage/**',
            'src/kernel/services/database-service.ts',
        ],
        rules: {
            'no-restricted-imports': 'off',
        },
    },
    {
        files: ['src/components/**', 'src/stores/**'],
        rules: {
            'no-restricted-imports': [
                'warn',
                {
                    patterns: [
                        {
                            group: ['**/kernel/services/**'],
                            message:
                                'Components/stores must not import directly from kernel/services/. Use kernel/instances (lazyService) or kernel/contracts/ instead.',
                        },
                    ],
                },
            ],
        },
    },
    {
        // FA-02 guard: forbid raw color literals in JSX inline styles.
        files: ['src/components/**', 'src/styles/**'],
        plugins: {
            'fa-02': {
                rules: {
                    'no-raw-style-color': noRawStyleColorRule,
                },
            },
        },
        rules: {
            'fa-02/no-raw-style-color': 'warn',
        },
    },
    {
        files: ['src/kernel/services/**/*.ts'],
        plugins: {
            'kernel-lifecycle': {
                rules: {
                    'mandatory-lifecycle': mandatoryLifecycleRule,
                },
            },
        },
        rules: {
            'kernel-lifecycle/mandatory-lifecycle': 'error',
        },
    },
    {
        files: ['src/kernel/**'],
        rules: {
            'no-restricted-imports': [
                'warn',
                {
                    patterns: [
                        {
                            group: [
                                'react',
                                'react-dom',
                                'react-router-dom',
                                'zustand',
                                'lucide-react',
                                'framer-motion',
                            ],
                            message:
                                'UI/React dependencies are forbidden in kernel (src/kernel/) — kernel is platform-agnostic.',
                        },
                        {
                            group: ['**/components/**', '**/stores/**', '**/llm/**'],
                            message: 'UI/store/LLM layers must not be imported by kernel.',
                        },
                    ],
                },
            ],
        },
    },
]);
