/**
 * Eval Runner — Agent 评测执行器
 *
 * 定义评测用例、运行评测、计算指标、生成评测报告。
 */

import { EvalMetrics, ConfusionMatrix, calculateMetrics, formatMetricsTable } from "./metrics.js";
import { TrajectoryLogger, Trajectory, TrajectoryStep } from "./trajectory.js";

export interface EvalCase<I = unknown, O = unknown> {
  name: string;
  description: string;
  input: I;
  expectedOutput: O;
  tags?: string[];
}

export interface EvalResult<I = unknown, O = unknown> {
  case: EvalCase<I, O>;
  actualOutput: O | null;
  passed: boolean;
  latencyMs: number;
  error?: string;
}

export type EvalRunnerFn<I, O> = (input: I) => Promise<O>;

export interface EvalReport {
  name: string;
  timestamp: Date;
  totalCases: number;
  passed: number;
  failed: number;
  metrics: EvalMetrics;
  results: EvalResult[];
  trajectory?: Trajectory;
}

export class EvalRunner {
  private logger: TrajectoryLogger;
  private latenciesMs: number[] = [];
  private results: EvalResult[] = [];

  constructor(logger?: TrajectoryLogger) {
    this.logger = logger ?? new TrajectoryLogger();
  }

  async run<I, O>(
    name: string,
    cases: EvalCase<I, O>[],
    fn: EvalRunnerFn<I, O>,
    options?: { trajectoryId?: string; threshold?: number },
  ): Promise<EvalReport> {
    this.latenciesMs = [];
    this.results = [];

    const trajectoryId = options?.trajectoryId ?? `eval-${Date.now()}`;
    this.logger.start(trajectoryId, "eval-session", ["eval", name]);

    for (const evalCase of cases) {
      const start = Date.now();
      let actualOutput: O | null = null;
      let error: string | undefined;
      let passed = false;

      this.logger.addStep("thought", `处理评测: ${evalCase.name}`, { input: evalCase.input });

      try {
        actualOutput = await fn(evalCase.input);
        const end = Date.now();
        const latency = end - start;
        this.latenciesMs.push(latency);

        passed = this.matchesExpected(actualOutput, evalCase.expectedOutput);
        this.logger.addStep("result", `输出: ${JSON.stringify(actualOutput)}`, { latency, passed });
      } catch (err) {
        const end = Date.now();
        this.latenciesMs.push(end - start);
        error = err instanceof Error ? err.message : String(err);
        this.logger.addStep("result", `错误: ${error}`, { error });
      }

      this.results.push({
        case: evalCase,
        actualOutput,
        passed,
        latencyMs: this.latenciesMs[this.latenciesMs.length - 1],
        error,
      });
    }

    const tp = this.results.filter((r) => r.passed && !r.error).length;
    const fp = this.results.filter((r) => !r.passed && !r.error).length;
    const tn = 0; // 当前简化：无负例评测
    const fnCount = this.results.filter((r) => r.error).length;

    const matrix: ConfusionMatrix = { tp, fp, tn, fn: fnCount };
    const metrics = calculateMetrics(matrix, this.latenciesMs);

    const trajectory = this.logger.end(tp > 0);

    const report: EvalReport = {
      name,
      timestamp: new Date(),
      totalCases: cases.length,
      passed: tp,
      failed: fp + fnCount,
      metrics,
      results: this.results,
      trajectory,
    };

    if (options?.threshold !== undefined) {
      this.checkThreshold(report, options.threshold);
    }

    return report;
  }

  private matchesExpected<I, O>(actual: O, expected: O): boolean {
    return JSON.stringify(actual) === JSON.stringify(expected);
  }

  private checkThreshold(report: EvalReport, threshold: number): void {
    if (report.metrics.accuracy < threshold) {
      throw new Error(
        `评测未通过阈值检查：准确率 ${(report.metrics.accuracy * 100).toFixed(2)}% < ${(threshold * 100).toFixed(2)}%`,
      );
    }
  }

  static formatReport(report: EvalReport): string {
    const lines: string[] = [
      `📋 评测报告: ${report.name}`,
      `   时间: ${report.timestamp.toISOString()}`,
      `   总用例: ${report.totalCases} | 通过: ${report.passed} | 失败: ${report.failed}`,
      "",
    ];

    lines.push(formatMetricsTable(report.metrics));
    lines.push("");

    for (const result of report.results) {
      const icon = result.passed ? "✅" : result.error ? "❌" : "⚠️";
      lines.push(`  ${icon} ${result.case.name}`);
      lines.push(`     输入: ${JSON.stringify(result.case.input)}`);
      lines.push(`     期望: ${JSON.stringify(result.case.expectedOutput)}`);
      if (result.error) {
        lines.push(`     错误: ${result.error}`);
      }
      lines.push(`     延迟: ${result.latencyMs}ms`);
      lines.push("");
    }

    return lines.join("\n");
  }
}
