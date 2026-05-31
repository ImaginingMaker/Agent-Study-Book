/**
 * Phase 1 — 理解 Agent 开发 Workflow
 *
 * 演示工作流生命周期管理：阶段定义、状态转换、生命周期钩子、I/O 契约。
 */

import chalk from "chalk";
import { WorkflowEngine, createDefaultWorkflow } from "./workflow.js";

async function main(): Promise<void> {
  console.log(chalk.bold("📋 Phase 1：理解 Agent 开发 Workflow\n"));

  const workflow = new WorkflowEngine(createDefaultWorkflow());

  console.log(chalk.cyan("工作流定义："));
  console.log(chalk.yellow(`  名称：${workflow.definition.name}`));
  console.log(chalk.yellow(`  描述：${workflow.definition.description}`));
  console.log(chalk.yellow(`  阶段数：${workflow.definition.stages.length}\n`));

  console.log(chalk.cyan("各阶段："));
  for (const stage of workflow.definition.stages) {
    console.log(`  ${chalk.gray("•")} ${stage.name} — ${stage.description}`);
  }

  console.log(chalk.cyan("\nI/O 契约："));
  const io = workflow.ioContract;
  console.log(chalk.yellow("  输入："));
  for (const [key, desc] of Object.entries(io.input)) {
    console.log(`    ${key}: ${desc}`);
  }
  console.log(chalk.yellow("  输出："));
  for (const [key, desc] of Object.entries(io.output)) {
    console.log(`    ${key}: ${desc}`);
  }

  workflow.on((event) => {
    switch (event.type) {
      case "workflow:start":
        console.log(chalk.green("\n🚀 工作流启动"));
        break;
      case "stage:before":
        console.log(chalk.blue(`  ▶ 进入阶段：${event.stageName}`));
        break;
      case "stage:after":
        console.log(chalk.green(`  ✓ 完成阶段：${event.stageName}（${event.status}）`));
        break;
      case "stage:error":
        console.log(chalk.red(`  ✗ 阶段失败：${event.stageName} — ${event.error}`));
        break;
      case "workflow:complete":
        console.log(chalk.green(`\n✅ 工作流完成，状态：${event.status}`));
        break;
    }
  });

  await workflow.start();

  console.log(chalk.cyan("\n最终状态："));
  for (const stage of workflow.definition.stages) {
    const icon =
      stage.status === "completed" ? chalk.green("✓") :
      stage.status === "failed" ? chalk.red("✗") :
      stage.status === "skipped" ? chalk.gray("−") :
      chalk.gray("○");
    console.log(`  ${icon} ${stage.name}（${stage.status}）`);
  }

  console.log(chalk.cyan(`\n进度：${workflow.progress}`));
  console.log();
}

main().catch(console.error);
