import type { IEvalService } from '../../contracts/frontier';
import type { EvalRun } from '../../types/frontier-types';

/**
 * Demo seed for Fleet Frontier: one benchmark with a single self-passing
 * case (echo executor returns the task text, so expectContains matches)
 * plus its run.
 *
 * Idempotent: benchmarks named DEMO_BENCHMARK_NAME are reused (existing
 * runs are left untouched).
 */
export const DEMO_BENCHMARK_NAME = 'Демо: вежливость';

export async function seedFrontierDemo(
    service: Pick<IEvalService, 'createBenchmark' | 'listBenchmarks' | 'runBenchmark' | 'listRuns'>,
): Promise<EvalRun> {
    const existingBench = (await service.listBenchmarks()).find(
        (b) => b.name === DEMO_BENCHMARK_NAME,
    );
    const benchmark =
        existingBench ??
        (await service.createBenchmark({
            name: DEMO_BENCHMARK_NAME,
            description: 'Демо-бенчмарк: бот отвечает вежливо и по делу.',
            cases: [
                {
                    task: 'Ответь вежливо: пожалуйста, напомни о дедлайне',
                    expectContains: 'пожалуйста',
                },
            ],
        }));
    const existingRun = (await service.listRuns(benchmark.id))[0];
    if (existingRun) return existingRun;
    return service.runBenchmark(benchmark.id, 'fleet');
}
