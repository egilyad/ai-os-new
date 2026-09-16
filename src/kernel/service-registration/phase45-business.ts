import type { Phase } from './helpers';
import type { IContainer } from '../container';
import type { DataAccessLayer } from '../dal/types';
import type { IEventBus } from '../types/interfaces';
import { OrgChartService, BizTicketService, MeetingService, HITLLevelsService, PlaybookService, ComposeService } from '../services/rivals13/paperclip-agents';
import { DataSourceService, BulkService, ScraperService, RelayService } from '../services/rivals13/dust-bulk';
import { SeoPackService, OutreachPackService, FinancePackService, SiteAuditService, CalendarService } from '../services/rivals13/bizpacks';

export const registerPhase45: Phase = ({ register }) => {
    register('orgChartService', (c: IContainer) => new OrgChartService(c.get<DataAccessLayer>('dal'), c.get<IEventBus>('eventBus')));
    register('bizTicketService', (c: IContainer) => new BizTicketService(c.get<DataAccessLayer>('dal'), c.get<IEventBus>('eventBus')));
    register('meetingService', (c: IContainer) => new MeetingService(c.get<DataAccessLayer>('dal'), c.get<IEventBus>('eventBus')));
    register('hitlLevelsService', (c: IContainer) => new HITLLevelsService(c.get<DataAccessLayer>('dal')));
    register('playbookService', (c: IContainer) => new PlaybookService(c.get<DataAccessLayer>('dal'), c.get<IEventBus>('eventBus')));
    register('composeService', (c: IContainer) => new ComposeService(c.get<DataAccessLayer>('dal')));
    register('dataSourceService', (c: IContainer) => new DataSourceService(c.get<DataAccessLayer>('dal'), c.get<IEventBus>('eventBus')));
    register('bulkService', (c: IContainer) => new BulkService(c.get<DataAccessLayer>('dal'), c.get<IEventBus>('eventBus')));
    register('scraperService', (c: IContainer) => new ScraperService(c.get<DataAccessLayer>('dal')));
    register('relayService', (c: IContainer) => new RelayService(c.get<DataAccessLayer>('dal')));
    register('seoPackService', (c: IContainer) => new SeoPackService(c.get<DataAccessLayer>('dal'), c.get<IEventBus>('eventBus')));
    register('outreachPackService', (c: IContainer) => new OutreachPackService(c.get<DataAccessLayer>('dal')));
    register('financePackService', (c: IContainer) => new FinancePackService(c.get<DataAccessLayer>('dal'), c.get<IEventBus>('eventBus')));
    register('siteAuditService', (c: IContainer) => new SiteAuditService(c.get<DataAccessLayer>('dal')));
    register('calendarService', (c: IContainer) => new CalendarService(c.get<DataAccessLayer>('dal')));
};
