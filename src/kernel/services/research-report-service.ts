import type { IResearchEngine } from '../contracts/research-engine';
import type {
    IResearchReportService,
    ResearchReport,
    ReportFormat,
} from '../contracts/research-report';

export class ResearchReportService implements IResearchReportService {
    destroy(): void {
        /* no-op — all resources are method-scoped */
    }

    private reports: ResearchReport[] = [];

    constructor(private researchEngine: IResearchEngine) {}

    getReports(): ResearchReport[] {
        return [...this.reports];
    }

    getReport(id: string): ResearchReport | undefined {
        return this.reports.find((r) => r.id === id);
    }

    createReport(title: string, topic: string, format: ReportFormat): ResearchReport {
        const report: ResearchReport = {
            id: crypto.randomUUID(),
            title,
            topic,
            format,
            content: '',
            status: 'draft',
            sections: [],
            sources: 0,
            tokens: 0,
            createdAt: Date.now(),
        };
        this.reports.push(report);
        return report;
    }

    async createFromSession(
        sessionId: string,
        title: string,
        format: ReportFormat,
    ): Promise<ResearchReport> {
        const engineReport = await this.researchEngine.generateResearchReport(sessionId, format);
        const content = engineReport.sections
            .map((s) => `## ${s.title}\n\n${s.content}`)
            .join('\n\n');
        const report: ResearchReport = {
            id: crypto.randomUUID(),
            sessionId,
            title,
            format,
            content,
            status: 'ready',
            sections: engineReport.sections.map((s) => ({
                id: s.id,
                title: s.title,
                content: s.content,
                wordCount: s.wordCount,
                status: 'written' as const,
            })),
            sources: engineReport.sources,
            tokens: engineReport.tokens,
            citations: engineReport.citations,
            peerReview: engineReport.peerReview,
            createdAt: Date.now(),
            completedAt: Date.now(),
        };
        this.reports.push(report);
        return report;
    }

    async generateReport(id: string): Promise<ResearchReport> {
        const report = this.reports.find((r) => r.id === id);
        if (!report) throw new Error(`Report ${id} not found`);

        if (report.sessionId) {
            const engineReport = await this.researchEngine.generateResearchReport(
                report.sessionId,
                report.format,
            );
            report.content = engineReport.sections
                .map((s) => `## ${s.title}\n\n${s.content}`)
                .join('\n\n');
            report.sections = engineReport.sections.map((s) => ({
                id: s.id,
                title: s.title,
                content: s.content,
                wordCount: s.wordCount,
                status: 'written' as const,
            }));
            report.sources = engineReport.sources;
            report.tokens = engineReport.tokens;
            report.citations = engineReport.citations;
            report.peerReview = engineReport.peerReview;
            report.status = 'ready';
            report.completedAt = Date.now();
            return { ...report };
        }

        report.status = 'generating';
        await new Promise((r) => setTimeout(r, 100));
        report.content = `# ${report.title}\n\n_Generated research report._`;
        report.sections = [];
        report.status = 'ready';
        report.sources = 0;
        report.tokens = report.content.split(/\s+/).length;
        report.completedAt = Date.now();
        return { ...report };
    }

    deleteReport(id: string): void {
        this.reports = this.reports.filter((r) => r.id !== id);
    }
}
