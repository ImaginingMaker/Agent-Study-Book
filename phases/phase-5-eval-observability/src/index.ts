/**
 * Phase 5 — 评测 & 可观测性
 *
 * 演示 Eval Case 定义、评测执行、指标计算、Trajectory 日志。
 */

import chalk from "chalk";
import { EvalRunner, type EvalCase } from "./eval_runner.js";
import { type EvalMetrics } from "./metrics.js";
import { TrajectoryLogger } from "./trajectory.js";

async function demoEvalRunner(): Promise<void> {
  console.log(chalk.bold("\n📊 Eval Runner 演示\n"));

  const logger = new TrajectoryLogger("eval_trajectories.json");
  await logger.load();

  const runner = new EvalRunner(logger);

  const cases: EvalCase<string, string>[] = [
    {
      name: "简单加法",
      description: "测试基本计算能力",
      input: "1 + 2 = ?",
      expectedOutput: "3",
      tags: ["math", "basic"],
    },
    {
      name: "字符串拼接",
      description: "测试字符串处理",
      input: "hello world",
      expectedOutput: "hello world",
      tags: ["string"],
    },
    {
      name: "空输入处理",
      description: "测试边界情况",
      input: "",
      expectedOutput: "",
      tags: ["edge"],
    },
    {
      name: "数字比较",
      description: "测试逻辑判断",
      input: "10 > 5",
      expectedOutput: "true",
      tags: ["logic"],
    },
  ];

  const mockFn = async (input: string): Promise<string> => {
    await new Promise((r) => setTimeout(r, Math.random() * 50 + 10));

    if (input === "1 + 2 = ?") return "3";
    if (input === "hello world") return "hello world";
    if (input === "") return "";
    if (input === "10 > 5") return "true";
    return "unknown";
  };

  const report = await runner.run("Agent 基础能力评测", cases, mockFn, {
    trajectoryId: "eval-demo-1",
  });

  console.log(chalk.cyan("评测结果摘要："));
  console.log(`  总用例: ${chalk.yellow(report.totalCases)}`);
  console.log(`  通过: ${chalk.green(report.passed)}`);
  console.log(`  失败: ${chalk.red(report.failed)}`);
  console.log(`  准确率: ${chalk.yellow((report.metrics.accuracy * 100).toFixed(2) + "%")}`);
  console.log(`  平均延迟: ${chalk.yellow(report.metrics.avgLatencyMs + "ms")}`);

  console.log(chalk.cyan("\n详细指标："));
  console.log(chalk.gray(formatMetricsColored(report.metrics)));
}

async function demoTrajectory(): Promise<void> {
  console.log(chalk.bold("\n👣 Trajectory 日志演示\n"));

  const logger = new TrajectoryLogger("trajectory_demo.json");

  logger.start("traj-demo-1", "session-001", ["demo", "test"]);

  logger.addStep("thought", "用户问：什么是 Agent？");
  logger.addStep("action", "搜索相关知识库", { tool: "search", query: "Agent 定义" });
  logger.addStep("observation", "找到 3 篇相关文档");
  logger.addStep("result", "Agent 是具有自主决策能力的程序");

  const trajectory = logger.end(true);

  console.log(chalk.cyan(logger.formatTrajectory(trajectory)));
}

function formatMetricsColored(metrics: EvalMetrics): string {
  return `${metrics.accuracy}\n${metrics.precision}\n${metrics.recall}`;
}

async function main(): Promise<void> {
  console.log(chalk.bold("📐 Phase 5：评测 & 可观测性"));

  await demoEvalRunner();
  await demoTrajectory();

  console.log(chalk.green("\n✅ 所有演示完成！\n"));
}

main().catch(console.error);
