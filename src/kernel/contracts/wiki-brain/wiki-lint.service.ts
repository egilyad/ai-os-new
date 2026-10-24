import type { TWikiLintIssue } from './types';

export interface IWikiLintService {
    runAll(): Promise<TWikiLintIssue[]>;
    runForPage(pageId: string): Promise<TWikiLintIssue[]>;
    listIssues(opts?: { severity?: TWikiLintIssue['severity'] }): Promise<TWikiLintIssue[]>;
}
