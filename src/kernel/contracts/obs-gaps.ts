export interface ServiceObsInfo {
  name: string;
  hasEvents: boolean;
  hasLogger: boolean;
  hasLifecycle: boolean;
  hasHealthCheck: boolean;
  hasTracing: boolean;
  notes?: string;
}

export interface DocEvent {
  name: string;
  source: string;
}

export interface DocEventCoverage extends DocEvent {
  covered: boolean;
}

export interface ObsCoverage {
  total: number;
  withEvents: number;
  withLogger: number;
  withLifecycle: number;
  withHealth: number;
  withTracing: number;
  gaps: number;
  eventScore: number;
  loggerScore: number;
  lifecycleScore: number;
  healthScore: number;
  tracingScore: number;
  overall: number;
}

export interface ObsGapsReport {
  timestamp: number;
  coverage: ObsCoverage;
  services: ServiceObsInfo[];
  documentedEvents: DocEvent[];
  recommendations: string[];
}

export type ObsReadFile = (path: string) => Promise<string>;

export interface IObsGapsService {
  getStaticInventory(): ServiceObsInfo[];
  getServiceCount(): number;
  parseEventsDocumentation(content: string): DocEvent[];
  analyzeServiceContent(name: string, content: string): ServiceObsInfo;
  scanServices(readFile?: ObsReadFile): Promise<ServiceObsInfo[]>;
  computeCoverage(services: ServiceObsInfo[]): ObsCoverage;
  crossReferenceEvents(docEvents: DocEvent[], services: ServiceObsInfo[]): DocEventCoverage[];
  buildReport(services: ServiceObsInfo[], docEvents?: DocEvent[]): ObsGapsReport;
}
