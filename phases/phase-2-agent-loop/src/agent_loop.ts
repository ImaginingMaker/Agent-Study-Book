/**
 * Agent 开发引导器 — Phase 2：关键词匹配版 Agent Loop
 */

import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import chalk from "chalk";
import { classifyIntent, getIntentDescription } from "./intent_classifier.js";
import { AgentState, StateStore } from "./state.js";

const WORKFLOW_MAP: Record<string, string> = {
  "需求分析": "PRD 生成",
  "PRD 生成": "技术规格",
  "技术规格": "架构设计",
  "架构设计": "组件设计",
  "组件设计": "代码实现",
  "代码实现": "代码审查",
  "代码审查": "评测",
};

const PHASE_DESCRIPTIONS: Record<string, string> = {
  "需求分析": "澄清用户需求，定义问题边界",
  "PRD 生成": "编写产品需求文档，定义功能清单",
  "技术规格": "编写技术规格文档，定义 API 和数据模型",
  "架构设计": "设计系统架构，划分模块边界",
  "组件设计": "设计 React 组件树和状态方案",
  "代码实现": "编写实际代码",
  "代码审查": "审查代码质量",
};

function handleQueryPhase(state: AgentState): string {
  const desc = PHASE_DESCRIPTIONS[state.phase] ?? "";
  return `📌 当前阶段：**${state.phase}**\n   └─ ${desc}`;
}

function handleNextStep(state: AgentState): string {
  const nextPhase = WORKFLOW_MAP[state.phase];
  if (nextPhase) {
    const desc = PHASE_DESCRIPTIONS[nextPhase] ?? "";
    return (
      `➡️ 下一步：**${nextPhase}**\n` +
      `   └─ ${desc}\n\n` +
      `💡 当前阶段 '${state.phase}' 完成后，自动进入 ${nextPhase}`
    );
  }
  return "🚀 所有阶段已完成！项目交付。";
}

function handleExecutePhase(state: AgentState): string {
  const phaseSkills: Record<string, string> = {
    "需求分析": "pi-requirement-analyzer",
    "PRD 生成": "pi-prd-generator",
    "技术规格": "pi-spec-generator",
    "架构设计": "pi-architecture-designer",
    "组件设计": "pi-component-designer",
    "代码实现": "pi-code-implementer",
    "代码审查": "pi-code-reviewer",
  };
  const skill = phaseSkills[state.phase];
  if (skill) {
    return (
      `🔧 开始执行：**${state.phase}**\n` +
      `   └─ 推荐使用技能：\`${skill}\`\n` +
      `\n完成后输入 '继续' 进入下一阶段。`
    );
  }
  return `⏳ 当前阶段 '${state.phase}' 需要人工完成。`;
}

function handleHelp(state: AgentState): string {
  return (
    "🤖 **Agent 开发引导器**\n\n" +
    "我帮你管理 Agent 开发的 6 个阶段流程。\n\n" +
    `📌 当前阶段：${state.phase}\n\n` +
    `${getIntentDescription()}`
  );
}

export async function runAgentLoop(): Promise<void> {
  const store = new StateStore();
  const rl = createInterface({ input, output });

  let state: AgentState;

  const savedState = await store.load();
  if (savedState) {
    state = savedState;
    console.log(chalk.yellow("🔄 检测到上次未完成的工作流"));
    console.log(chalk.blue(`📌 恢复阶段：${state.phase}`));
    console.log(chalk.gray(`📊 进度：第 ${state.currentStep} 步\n`));
  } else {
    state = new AgentState();
    console.log(chalk.green("🤖 **Agent 开发引导器** 已启动"));
    console.log(chalk.blue(`📌 起始阶段：${state.phase}`));
    console.log(chalk.gray("💡 输入 '帮助' 查看可用命令\n"));
  }

  while (state.currentStep < state.maxSteps) {
    const userInput = await rl.question(chalk.cyan("> "));
    const trimmed = userInput.trim();

    if (!trimmed) {
      continue;
    }

    state.userInput = trimmed;
    state.currentStep += 1;
    state.history.push(["user", trimmed]);

    const intent = classifyIntent(trimmed);
    let response: string;

    if (intent === "query_phase") {
      response = handleQueryPhase(state);
    } else if (intent === "next_step") {
      response = handleNextStep(state);
    } else if (intent === "execute_phase") {
      response = handleExecutePhase(state);
    } else if (intent === "help") {
      response = handleHelp(state);
    } else if (intent === "exit") {
      console.log(chalk.green("👋 再见！期待下次继续你的 Agent 开发之旅。"));
      await store.save(state);
      rl.close();
      return;
    } else {
      response =
        "🤔 我不太理解你的意思。\n\n" +
        "试试说：\n" +
        "  · '我在哪' → 查看当前阶段\n" +
        "  · '下一步' → 查看下一步\n" +
        "  · '帮我'    → 执行当前阶段\n" +
        "  · '帮助'    → 显示帮助";
    }

    console.log(response);
    state.history.push(["agent", response]);
    console.log();
    await store.save(state);
  }

  console.log(chalk.yellow(`\n⚠️ 已达到最大步数限制 (${state.maxSteps})`));
  await store.save(state);
  rl.close();
}
