/**
 * Phase 70 — Browser Use executor (ro2 §7, изменение 2).
 *
 * Замыкает исполнение browser-автоматизации БЕЗ нового контура:
 *   - `browserUseService` (новый) — тонкий executor: direct sidecar
 *     или gateway `/api/runs/:id/execute` с adapter 'browser-use';
 *   - tool `browser.act` — регистрируется в ToolRunnerService через
 *     штатный `addTool()` (тот же паттерн, что memory.append в phase33);
 *     виден LLM в `runWithTools`-loop автоматически;
 *   - валидация sensitive-паттернов — переиспользует политику
 *     BrowserHarnessService (не дублирует regex);
 *   - HITL — через AgemsApprovalService + ApprovalExecutionBridge
 *     (tool сам approval НЕ запрашивает: bridge уже делает callTool
 *     после APPROVED, иначе был бы двойной вызов).
 *
 * Additive — остальные фазы не тронуты. Имя phase70 свободно
 * (phase60 занят mcp-harness, phase66-69 заняты).
 */
import type { Phase } from './helpers';
import type { IContainer } from '../container';
import type { IEventBus } from '../types/interfaces';
import type { IToolRunnerService } from '../contracts/parity';
import type { IBrowserHarnessService } from '../contracts/browser-harness';
import { BrowserUseService } from '../services/browser/browser-use-service';

function str(v: unknown): string {
    return typeof v === 'string' ? v : '';
}

export const registerPhase70: Phase = ({ register }) => {
    register('browserUseService', (c: IContainer) => {
        const svc = new BrowserUseService({
            events: c.get<IEventBus>('eventBus'),
            blockedPatterns: c.has('browserHarnessService')
                ? c.get<IBrowserHarnessService>('browserHarnessService').getPolicy().blockedPatterns
                : undefined,
        });

        // Регистрируем LLM-tool здесь же (как memory.append в phase33):
        // фабрика выполняется при первом get('browserUseService') на boot
        // (INIT_TIERS tier '*' резолвит все сервисы), tool появляется в
        // runWithTools автоматически через toolDefs.
        try {
            if (c.has('toolRunnerService')) {
                const runner = c.get<IToolRunnerService>('toolRunnerService');
                runner.addTool({
                    name: 'browser.act',
                    description:
                        'Run a browser automation task (navigate, click, type, screenshot) via the browser-use sidecar. ' +
                        'Requires HITL approval (AgemsApprovalService, risk=high). ' +
                        'Returns JSON with screenshot/actions/finalState. ' +
                        'Without explicit config it tries the local sidecar at http://localhost:3100/execute.',
                    parameters: {
                        type: 'object',
                        properties: {
                            task: {
                                type: 'string',
                                description: 'Natural-language browser task, e.g. "open https://example.com and screenshot"',
                            },
                            ticketId: {
                                type: 'string',
                                description: 'Optional sandbox/approval ticket id for audit trail',
                            },
                            maxSteps: {
                                type: 'number',
                                description: 'Max browser steps (1..50, default 15)',
                            },
                        },
                        required: ['task'],
                    },
                    run: async (args) => {
                        const task = str(args['task']);
                        const ticketId = str(args['ticketId']) || undefined;
                        const maxSteps =
                            typeof args['maxSteps'] === 'number'
                                ? (args['maxSteps'] as number)
                                : undefined;
                        const res = await svc.execute(task, { ticketId, maxSteps });
                        // callTool режет до 8000 — укладываемся.
                        // Скриншот base64 в ТЕКСТовый результат LLM не кладём:
                        // модель картинку из текста не увидит, а токены сгорят
                        // (именно такой обрезанный blob и смущал в UI).
                        // Визуальный путь — computer-loop (image-блоки).
                        return JSON.stringify({
                            via: res.via,
                            hasScreenshot: Boolean(res.screenshot),
                            actions: res.actions,
                            finalState: res.finalState,
                            stdout: res.stdout.slice(0, 4000),
                        }).slice(0, 6000);
                    },
                });
            }
        } catch {
            // offline / partial container — browser.act просто недоступен
        }

        return svc;
    });
};
