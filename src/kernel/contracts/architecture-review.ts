import type { FileNode } from './workspace';

export interface ArchFinding {
  type: 'warning' | 'error' | 'info';
  category: string;
  message: string;
  file?: string;
  value?: string;
  items?: string[];
}

export interface ArchDebtItem {
  id: string;
  title: string;
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  effort: string;
  description: string;
  status: 'open' | 'resolved';
  files: string[];
}

export interface DepGraphNode {
  path: string;
  imports: string[];
}

export type ArchReadFile = (path: string) => Promise<string>;

export interface IArchitectureReviewService {
  parseDebtReport(content: string): ArchDebtItem[];
  checkProjectStructure(tree: FileNode[]): ArchFinding[];
  findDuplicates(fileSizes: { path: string; size: number }[]): ArchFinding[];
  reportDependencies(
    tsFilePaths: string[],
    readFile: ArchReadFile,
    maxFiles?: number,
  ): Promise<ArchFinding[]>;
  runFullAnalysis(tree: FileNode[], readFile: ArchReadFile): Promise<ArchFinding[]>;
}
