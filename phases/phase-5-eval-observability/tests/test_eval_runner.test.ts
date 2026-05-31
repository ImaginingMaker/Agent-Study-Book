/**
 * 测试 Phase 5 评测与可观测性模块
 */

import { describe, it, expect } from "vitest";
import { EvalRunner, type EvalCase } from "../src/eval_runner.js";
import { TrajectoryLogger } from "../src/trajectory.js";
import { calculateMetrics, formatMetricsTable } from "../src/metrics.js";

describe("calculateMetrics", () => {
  it("should calculate perfect metrics", () => {
    const metrics = calculateMetrics({ tp: 10, fp: 0, tn: 10, fn: 0 }, [100, 200]);
    expect(metrics.accuracy).toBe(1);
    expect(metrics.precision).toBe(1);
    expect(metrics.recall).toBe(1);
    expect(metrics.f1Score).toBe(1);
    expect(metrics.totalCases).toBe(20);
    expect(metrics.avgLatencyMs).toBe(150);
  });

  it("should handle zero cases", () => {
    const metrics = calculateMetrics({ tp: 0, fp: 0, tn: 0, fn: 0 }, []);
    expect(metrics.accuracy).toBe(0);
    expect(metrics.precision).toBe(0);
    expect(metrics.recall).toBe(0);
    expect(metrics.f1Score).toBe(0);
    expect(metrics.totalCases).toBe(0);
  });

  it("should calculate non-perfect metrics", () => {
    const metrics = calculateMetrics({ tp: 8, fp: 2, tn: 7, fn: 3 }, [100]);
    expect(metrics.accuracy).toBeCloseTo(0.75, 2);
    expect(metrics.precision).toBeCloseTo(0.8, 2);
    expect(metrics.recall).toBeCloseTo(0.727, 2);
  });
});

describe("formatMetricsTable", () => {
  it("should return formatted string", () => {
    const result = formatMetricsTable({
      accuracy: 0.95, precision: 0.9, recall: 0.85, f1Score: 0.874,
      totalCases: 20, passedCases: 18, failedCases: 2,
      avgLatencyMs: 150, totalLatencyMs: 3000,
    });
    expect(result).toContain("95.00%");
    expect(result).toContain("20");
    expect(result).toContain("150ms");
  });
});

describe("EvalRunner", () => {
  it("should run eval cases and return report", async () => {
    const runner = new EvalRunner();

    const cases: EvalCase<string, string>[] = [
      { name: "test-1", description: "first", input: "a", expectedOutput: "a" },
      { name: "test-2", description: "second", input: "b", expectedOutput: "b" },
    ];

    const fn = async (input: string): Promise<string> => input;

    const report = await runner.run("test", cases, fn);

    expect(report.totalCases).toBe(2);
    expect(report.passed).toBe(2);
    expect(report.failed).toBe(0);
    expect(report.metrics.accuracy).toBe(1);
  });

  it("should handle failures", async () => {
    const runner = new EvalRunner();

    const cases: EvalCase<string, string>[] = [
      { name: "fail-case", description: "will fail", input: "x", expectedOutput: "y" },
    ];

    const fn = async (input: string): Promise<string> => input;

    const report = await runner.run("fail-test", cases, fn);

    expect(report.totalCases).toBe(1);
    expect(report.passed).toBe(0);
    expect(report.failed).toBe(1);
  });

  it("should handle errors in eval function", async () => {
    const runner = new EvalRunner();

    const cases: EvalCase<string, string>[] = [
      { name: "error-case", description: "will error", input: "x", expectedOutput: "y" },
    ];

    const fn = async (): Promise<string> => {
      throw new Error("runtime error");
    };

    const report = await runner.run("error-test", cases, fn);

    expect(report.results[0].error).toBe("runtime error");
    expect(report.passed).toBe(0);
  });

  it("should check threshold", async () => {
    const runner = new EvalRunner();

    const cases: EvalCase<string, string>[] = [
      { name: "test", description: "test", input: "a", expectedOutput: "a" },
    ];

    const fn = async (input: string): Promise<string> => input;

    await expect(
      runner.run("threshold-test", cases, fn, { threshold: 0.9 }),
    ).resolves.toBeDefined();

    const badCases: EvalCase<string, string>[] = [
      { name: "bad", description: "bad", input: "a", expectedOutput: "b" },
    ];

    await expect(
      runner.run("threshold-fail", badCases, fn, { threshold: 0.9 }),
    ).rejects.toThrow("评测未通过阈值检查");
  });
});

describe("TrajectoryLogger", () => {
  it("should log steps in order", () => {
    const logger = new TrajectoryLogger("test_traj.json");

    logger.start("traj-1", "session-1");
    logger.addStep("thought", "thinking");
    logger.addStep("action", "doing");
    logger.addStep("result", "done");

    const trajectory = logger.end(true);

    expect(trajectory.steps).toHaveLength(3);
    expect(trajectory.steps[0].type).toBe("thought");
    expect(trajectory.steps[1].type).toBe("action");
    expect(trajectory.steps[2].type).toBe("result");
    expect(trajectory.success).toBe(true);
  });

  it("should track step numbers", () => {
    const logger = new TrajectoryLogger("test_traj_num.json");

    logger.start("traj-2", "session-1");
    logger.addStep("thought", "step 1");
    logger.addStep("action", "step 2");

    const trajectory = logger.end(true);

    expect(trajectory.steps[0].step).toBe(1);
    expect(trajectory.steps[1].step).toBe(2);
  });

  it("should start with error without active trajectory", () => {
    const logger = new TrajectoryLogger("test_err.json");
    expect(() => logger.addStep("thought", "test")).toThrow("没有活跃的 trajectory");
  });

  it("should return recent trajectories", () => {
    const logger = new TrajectoryLogger("test_recent.json");

    for (let i = 0; i < 3; i++) {
      logger.start(`traj-${i}`, "session-1");
      logger.addStep("result", `step ${i}`);
      logger.end(true);
    }

    expect(logger.getRecent(2)).toHaveLength(2);
  });
});
