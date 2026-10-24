import type { TWikiPage } from './types';

export interface IWikiIndexService {
    refresh(): Promise<void>;
    getIndexPage(): Promise<TWikiPage>;
    rebuildOverview(): Promise<TWikiPage>;
}
