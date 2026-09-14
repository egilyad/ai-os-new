/**
 * Python runtime types (roadmapp.md §P7).
 */

export interface PythonProject {
    id: string;
    name: string;
    projectId: string; // link to main project
    pythonVersion: '3.11' | '3.12';
    requirements: string[];
    entryPoint: string; // e.g. 'main.py'
    createdAt: number;
    updatedAt: number;
}

export interface PythonRun {
    id: string;
    projectId: string;
    command: string; // e.g. 'python main.py --flag'
    exitCode: number | null;
    stdout: string;
    stderr: string;
    durationMs: number;
    startedAt: number;
    completedAt: number;
}

export interface PythonSandboxConfig {
    maxMemoryMb: number;
    maxCpuSeconds: number;
    maxOutputBytes: number;
    allowedModules: string[];
    blockedModules: string[];
}

export const DEFAULT_SANDBOX_CONFIG: PythonSandboxConfig = {
    maxMemoryMb: 256,
    maxCpuSeconds: 30,
    maxOutputBytes: 1024 * 1024,
    allowedModules: ['math', 'json', 'os', 'sys', 're', 'collections', 'itertools', 'functools', 'datetime', 'pathlib', 'typing'],
    blockedModules: ['subprocess', 'shutil', 'ctypes', 'socket', 'http', 'asyncio'],
};
