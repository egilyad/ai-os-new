# Исследование: Eval-платформы и оценка мультиагентных систем

Источники: Promptfoo, DeepEval, OpenAI Evals, LangSmith, AgentBench, τ-bench.

## (а) Сравнение платформ

| Критерий | Promptfoo                                                          | DeepEval                             | OpenAI Evals                           | LangSmith/LangChain                 |
| -------- | ------------------------------------------------------------------ | ------------------------------------ | -------------------------------------- | ----------------------------------- |
| Тип      | CLI + Web UI, OSS                                                  | Python/TS библиотека                 | Python фреймворк + реестр              | Платформа (SDK+UI+мониторинг)       |
| Формат   | promptfooconfig.yaml (prompts/providers/tests+assert)              | EvaluationDataset (Golden/JSONL/CSV) | YAML+JSON, Git-LFS                     | Dataset (Example: inputs+reference) |
| Метрики  | contains/icontains/llm-rubric/javascript/cost/latency/trajectory:* | 50+: G-Eval, trajectory, RAG, safety | basic/model_graded/match/fact/tool_use | Human/Code/LLM-as-judge/pairwise    |
| CI       | GitHub Action/GitLab/Azure                                         | pytest/vitest, CI-гейты              | CLI                                    | pytest/vitest, Rules                |
| Звёзды   | ~26.7k                                                             | ~15k                                 | ~19.7k                                 | —                                   |

## (б) Оценка агентов (отличия от single-LLM)

- Недетерминизм накапливается (температура на каждый вы; повторные прогоны обязательны `--repeat 3`).
- Промежуточные шаги важнее финального ответа (два агента могут дать одинаковый ответ, но разный путь).
- Оценивается система, а не модель (harness, tools, runtime).
- Нужна трассировка (plans, calls, tools, handoffs).

Метрики: Task Completion, Step Efficiency, Plan Adherence, Plan Quality, Tool Correctness, Argument Correctness, Cost/Latency, Safety, LLM-as-judge (G-Eval rubric).
Для дебатов: task success rate, agent trajectory accuracy, step-level, reward per step, cost/latency/safety.

## (в) Формат датасета (рекомендуемый, Promptfoo+DeepEval+LangSmith)

```yaml
description: 'Дебаты двух агентов'
tasks:
  - name: purchase_debate
    prompt: |
      Разреши спор...
    agents: [buyer, advisor, arbiter]
    vars: { product: 'washing_machine', budget: 300 }
    expected:
      final_state: 'purchased'
      must: ['агент-arbiter вынес решение', 'tool:search_price вызван']
      must_not: ['покупка без согласия арбитра']
      expected_tools: [search_price, calc_budget]
    metrics:
      [
        task_completion,
        step_efficiency,
        tool_correctness,
        argument_correctness,
        llm_rubric,
      ]
    thresholds: { cost_max_usd: 0.10, latency_max_ms: 30000 }
    repeat: 3
```

JSON-версия для реестра; файлы JSONL/YAML, версионировать.

## (г) CI-интеграция

GitHub Action (по Promptfoo `promptfoo-action@v1`): PR-триггер на путях evals/**, src/agents/**; кэш LLM-вызовов; `--threshold` на регрессии; `--repeat 3`; песочница/изолированный воркспейс; ночной полный прогон.

## (д) Рекомендации для хаба

1. Три уровня: end-to-end, trajectory-based, component-level.
2. Трассировка — фундамент (OTel/JSON).
3. Мини-набор метрик (≤5): task completion, step efficiency, tool correctness, llm_rubric.
4. Golden-first (10–20 вручную), затем синтетика.
5. Reference-free для production, reference-based для офлайна.
6. Оценивать систему, а не модель (включать baseline plain LLM).
7. Детерминизм: temperature=0 для ступдей, повторные прогоны.
8. Версионирование датасетов/экспериментов.
9. Монорепо `evals/` + CI-гейт.
10. Оценка агентов: траектории, tool-use, handoffs.

Источники: promptfoo.dev, docs.confident-ai.com, github.com/openai/evals, docs.langchain.com/langsmith, github.com/THUDM/AgentBench, github.com/sierra-research/tau-bench.
