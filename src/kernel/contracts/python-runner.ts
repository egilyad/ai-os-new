/**
 * Python runner contract (roadmapp.md §P7).
 */
import type { PythonProject, PythonRun } from '../types/python-runtime-types';

export interface IPythonRunnerService {
    createPythonProject(projectId: string, config?: Partial<PythonProject>): Promise<PythonProject>;
    getPythonProject(projectId: string): Promise<PythonProject | undefined>;
    addRequirement(projectId: string, requirement: string): Promise<void>;
    removeRequirement(projectId: string, requirement: string): Promise<void>;
    validateFile(projectId: string, filePath: string): Promise<{ valid: boolean; errors: string[] }>;
    run(projectId: string, command?: string): Promise<PythonRun>;
    getRunHistory(projectId: string): PythonRun[];
}
