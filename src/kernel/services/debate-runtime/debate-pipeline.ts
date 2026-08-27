import { rootLogger } from '../logger-service';

const LOGGER = rootLogger.child('DebatePipeline');

export type StageResult = { ok: true; earlyExit?: boolean } | { ok: false; error: string };

export interface PipelineStage {
    name: string;
    run(sessionId: string): Promise<StageResult>;
}

export class DebatePipeline {
    private stages: PipelineStage[] = [];

    addStage(stage: PipelineStage): this {
        this.stages.push(stage);
        return this;
    }

    async run(sessionId: string): Promise<StageResult> {
        for (const stage of this.stages) {
            try {
                const result = await stage.run(sessionId);
                if (!result.ok) {
                    LOGGER.warn('DebatePipeline', `Stage "${stage.name}" failed`, {
                        sessionId,
                        error: result.error,
                    });
                    return result;
                }
                if (result.earlyExit) {
                    LOGGER.debug('DebatePipeline', `Stage "${stage.name}" requested early exit`, {
                        sessionId,
                    });
                    return result;
                }
            } catch (e) {
                LOGGER.error('DebatePipeline', `Stage "${stage.name}" threw unexpectedly`, {
                    sessionId,
                    error: String(e),
                });
                throw e;
            }
        }
        return { ok: true };
    }
}
