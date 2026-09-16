import '../../tests/setup-runtime';
import { describe, it, expect } from 'vitest';
import { runtime } from '../runtime';
import type { OrgChartService, BizTicketService, MeetingService } from '../services/rivals13/paperclip-agents';
import type { BulkService } from '../services/rivals13/dust-bulk';
import type { SeoPackService, SiteAuditService } from '../services/rivals13/bizpacks';

const get = <T>(token: string): T => runtime.getService<T>(token);

describe('Phase45 e2e chain (S)', () => {
    it('org → ticket → meeting → bulk → seo → siteAudit', async () => {
        const org = get<OrgChartService>('orgChartService');
        const nodeId = await org.createNode('SEO Dept');
        expect((await org.tree()).some((n) => n.id === nodeId)).toBe(true);

        const tickets = get<BizTicketService>('bizTicketService');
        const created = await tickets.createFromGoal('Launch SEO audit. Fix noindex.');
        expect(created.length).toBe(2);
        expect((await tickets.listTickets()).some((t) => t.title.includes('SEO audit'))).toBe(true);

        const meeting = get<MeetingService>('meetingService');
        const meetingId = await meeting.startMeeting('SEO audit', ['noindex', 'schema']);
        await meeting.vote(meetingId, 'ceo', 'fix');
        await meeting.vote(meetingId, 'cto', 'fix');
        expect(await meeting.minutes(meetingId)).toContain('fix');

        const bulk = get<BulkService>('bulkService');
        const jobId = await bulk.runBulk('url1\nurl2', 'check noindex');
        expect(await bulk.result(jobId)).toContain('result_0');

        const seo = get<SeoPackService>('seoPackService');
        expect(await seo.keywordCluster(['seo audit', 'seo fix'])).toEqual({ seo: ['seo audit', 'seo fix'] });
        expect(await seo.contentBrief('seo audit')).toContain('# Brief: seo audit');

        const audit = get<SiteAuditService>('siteAuditService');
        await audit.baseline('https://acme.test', ['noindex', 'schema']);
        const diff = await audit.diff('https://acme.test', {
            noindex: 'true',
            schema: 'true',
            canonical: 'https://acme.test',
        });
        expect(diff.some((d) => d.check === 'noindex' && d.severity === 'Critical')).toBe(true);
    }, 60000);
});
