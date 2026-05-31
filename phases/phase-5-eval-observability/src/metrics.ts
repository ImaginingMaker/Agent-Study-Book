/**
 * 评测指标 — Agent 性能度量
 *
 * 提供准确率、召回率、F1 分数、耗时等基础指标的计算。
 */

export interface EvalMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  totalCases: number;
  passedCases: number;
  failedCases: number;
  avgLatencyMs: number;
  totalLatencyMs: number;
}

export interface ConfusionMatrix {
  tp: number;
  fp: number;
  tn: number;
  fn: number;
}

export function calculateMetrics(
  matrix: ConfusionMatrix,
  latenciesMs: number[],
): EvalMetrics {
  const { tp, fp, tn, fn } = matrix;
  const total = tp + fp + tn + fn;

  const accuracy = total > 0 ? (tp + tn) / total : 0;
  const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
  const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
  const f1Score = precision + recall > 0
    ? 2 * (precision * recall) / (precision + recall)
    : 0;

  const totalLatencyMs = latenciesMs.reduce((sum, l) => sum + l, 0);
  const avgLatencyMs = latenciesMs.length > 0 ? totalLatencyMs / latenciesMs.length : 0;

  return {
    accuracy: Number(accuracy.toFixed(4)),
    precision: Number(precision.toFixed(4)),
    recall: Number(recall.toFixed(4)),
    f1Score: Number(f1Score.toFixed(4)),
    totalCases: total,
    passedCases: tp + tn,
    failedCases: fp + fn,
    avgLatencyMs: Number(avgLatencyMs.toFixed(2)),
    totalLatencyMs,
  };
}

export function formatMetricsTable(metrics: EvalMetrics): string {
  return [
    "📊 评测指标",
    "─".repeat(40),
    `  准确率 (Accuracy):    ${(metrics.accuracy * 100).toFixed(2)}%`,
    `  精确率 (Precision):   ${(metrics.precision * 100).toFixed(2)}%`,
    `  召回率 (Recall):      ${(metrics.recall * 100).toFixed(2)}%`,
    `  F1 分数:              ${metrics.f1Score.toFixed(4)}`,
    `  总用例:               ${metrics.totalCases}`,
    `  通过:                 ${metrics.passedCases}`,
    `  失败:                 ${metrics.failedCases}`,
    `  平均延迟:             ${metrics.avgLatencyMs}ms`,
    `  总延迟:               ${metrics.totalLatencyMs}ms`,
    "─".repeat(40),
  ].join("\n");
}
