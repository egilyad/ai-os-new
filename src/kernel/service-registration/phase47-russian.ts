import type { Phase } from './helpers';
import type { IContainer } from '../container';
import type { DataAccessLayer } from '../dal/types';
import type { IEventBus } from '../types/interfaces';
import type { ILLMClientService } from '../contracts/provider-adapter';
import type { IToolRunnerService } from '../contracts/parity';
import type { IKnowledgeService } from '../contracts/parity';
import type { ISkillMarketService } from '../contracts/ops';
import type { ICrewService } from '../contracts/crew';
import { MetabolicService } from '../services/rivals15/metabolic-service';
import { MaestroService } from '../services/rivals15/maestro-service';
import { LocalTripleService } from '../services/rivals15/localtriple-service';
import { ChemistService } from '../services/rivals15/chemist-service';
import { AnalitikService } from '../services/rivals15/analitik-service';
import { RuslanService } from '../services/rivals15/ruslan-service';
import { HeisenbergService } from '../services/rivals15/heisenberg-service';
import { AgencyRuService } from '../services/rivals15/agencyru-service';
import { EvoLabService } from '../services/rivals15/evolab-service';
import { GigaStudioService } from '../services/rivals15/gigastudio-service';

function llmOf(c: IContainer): ILLMClientService | undefined { return c.has('llmClientService') ? c.get<ILLMClientService>('llmClientService') : undefined; }
function dalOf(c: IContainer): DataAccessLayer { return c.get<DataAccessLayer>('dal'); }
function eventsOf(c: IContainer): IEventBus { return c.get<IEventBus>('eventBus'); }

export const registerPhase47: Phase = ({ register }) => {
    register('metabolicService', (c: IContainer) => new MetabolicService(dalOf(c), eventsOf(c)));
    register('maestroService', (c: IContainer) => new MaestroService(dalOf(c), eventsOf(c)));
    register('localTripleService', (c: IContainer) => new LocalTripleService(eventsOf(c), llmOf(c), c.has('toolRunnerService') ? c.get<IToolRunnerService>('toolRunnerService') : undefined));
    register('chemistService', (c: IContainer) => new ChemistService(eventsOf(c), llmOf(c), c.has('knowledgeService') ? c.get<IKnowledgeService>('knowledgeService') : undefined));
    register('analitikService', (c: IContainer) => new AnalitikService(dalOf(c), llmOf(c), eventsOf(c)));
    register('ruslanService', (c: IContainer) => new RuslanService(dalOf(c), eventsOf(c), llmOf(c), c.has('skillMarketService') ? c.get<ISkillMarketService>('skillMarketService') : undefined));
    register('heisenbergService', (c: IContainer) => new HeisenbergService(dalOf(c), eventsOf(c)));
    register('agencyRuService', (c: IContainer) => new AgencyRuService(dalOf(c), c.has('crewService') ? c.get<ICrewService>('crewService') : undefined, eventsOf(c)));
    register('evoLabService', (c: IContainer) => new EvoLabService(dalOf(c), eventsOf(c)));
    register('gigaStudioService', (c: IContainer) => new GigaStudioService(eventsOf(c), llmOf(c)));

    // RU warehouse top-up (idempotent, best-effort) — tools/skills для лёгкой навигации до сильного ПК
    void (async () => {
        try {
            if (typeof (globalThis as unknown as { requestAnimationFrame?: unknown }).requestAnimationFrame !== 'undefined') return; // avoid seeding in browser boot twice
        } catch { /* seed guard */ }
        try {
            const c2 = { has: (globalThis as unknown as { __c?: IContainer }).__c?.has?.bind((globalThis as unknown as { __c: IContainer }).__c) } as unknown as IContainer;
            void c2;
        } catch { /* seed guard */ }
        // Seed via lazy after first toolRunner/skillMarket resolve (fire-and-forget, never throws)
        setTimeout(async () => {
            try {
                const m = await import('../services/parity/tool-runner-service');
                void m;
            } catch { /* seed guard */ }
            try {
                // Tools: yadisk/vk/wb/yandex — mock, безопасно (только имена, без секретов)
                const { toolRunnerService } = await import('../instances/services-extras');
                const runner = toolRunnerService as unknown as { listTools(): Array<{name:string}>; addTool(d: {name:string;description:string;parameters?:unknown;run:(a:Record<string,unknown>)=>Promise<string>}): void };
                const existing = new Set(runner.listTools().map(t=>t.name));
                const add = (name:string, desc:string) => {
                    if (existing.has(name)) return;
                    runner.addTool({ name, description: desc, parameters: { type:'object', properties: {} }, run: async (args)=> `${name} → ${JSON.stringify(args).slice(0,300)} (RU mock)` });
                };
                add('yadisk.read', 'Yandex.Disk read (mock, RU)');
                add('yadisk.write', 'Yandex.Disk write (mock, RU)');
                add('mail.send', 'Send email (mock, RU)');
                add('mail.list', 'List mailbox (mock, RU)');
                add('vk.post', 'VK post (mock)');
                add('wb.price', 'Wildberries price check (mock)');
                add('yandex.metrica', 'Yandex Metrica stats (mock)');
            } catch { /* seed guard */ }
            try {
                const { skillMarketService } = await import('../instances/services-extras');
                const market = skillMarketService as unknown as { list(): Promise<Array<{name:string}>>; publish(p:{name:string;version:string;description:string;permissions?:string[];entry?:string;author?:string}): Promise<unknown> };
                const existing = new Set((await market.list()).map(s=>s.name));
                const seed = [
                    { name: 'VK SMM', description: 'VK SMM: посты, комменты, таргет.', permissions: ['vk.post'] },
                    { name: 'WB Manager', description: 'Wildberries: цены, остатки, карточки.', permissions: ['wb.price'] },
                    { name: 'Yandex SEO', description: 'SEO для Яндекса: кластеры, Турбо, Метрика.', permissions: ['yandex.metrica'] },
                    { name: 'GigaChat Analyst', description: 'Аналитик на GigaChat (Analitik Lab).', permissions: [] },
                ];
                for (const s of seed) if (!existing.has(s.name)) await market.publish({ name: s.name, version: '1.0.0', description: s.description, permissions: s.permissions, entry: 'ru.ts', author: 'warehouse-ru' });
            } catch { /* seed guard */ }
        }, 0);
    })();
};
