/**
 * QA browser inspector contract (roadmapp.md §P5).
 */
import type { QAReport, LinkCheck, VisualCheck, TextCheck, FunctionalityCheck } from '../types/qa-types';

export interface IQABrowserInspector {
    inspect(projectId: string): Promise<QAReport>;
    checkLinks(projectId: string): Promise<LinkCheck[]>;
    checkVisual(projectId: string): Promise<VisualCheck>;
    checkText(projectId: string): Promise<TextCheck>;
    checkFunctionality(projectId: string): Promise<FunctionalityCheck>;
}
