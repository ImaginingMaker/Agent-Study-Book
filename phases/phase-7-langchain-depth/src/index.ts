/**
 * Phase 7 — LangChain.js 深度实战
 *
 * 使用真实的 LangChain.js API 演示五大核心模式：
 * Agent、Memory、RAG、LCEL、Callbacks。
 *
 * 所有示例使用 FakeListChatModel，无需 API Key 即可运行。
 */

import chalk from "chalk";
import { createAgent, runAgent } from "./agent.js";
import { ConversationMemory, createMemoryChain } from "./memory.js";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { RAGPipeline } from "./rag.js";
import { LCELDemo } from "./lcel.js";
import { runWithCallbacks } from "./callbacks.js";
import { ConsoleCallbackHandler } from "@langchain/core/tracers/console";

async function demoAgent(): Promise<void> {
  console.log(chalk.bold("\n🤖 Agent — createReactAgent\n"));

  const { agent, tools } = await createAgent();
  console.log(chalk.cyan("已注册工具："));
  for (const t of tools) {
    console.log(`  • ${chalk.yellow(t.name)} — ${t.description}`);
  }

  const result = await runAgent(agent, "计算 3 * 4 并搜索 LangChain 相关资料");
  console.log(chalk.cyan("\nAgent 输出："));
  console.log(chalk.green(`  ${result.slice(0, 120)}`));
}

async function demoMemory(): Promise<void> {
  console.log(chalk.bold("\n💾 Memory — 对话记忆\n"));

  const memory = new ConversationMemory();
  const chain = createMemoryChain();

  for (const msg of ["你好", "什么是 Agent？", "你能记住之前的对话吗？"]) {
    await memory.addMessage(new HumanMessage(msg));
    const history = await memory.formatContext();
    const response = await chain.call(msg, history);
    await memory.addMessage(new AIMessage(response));

    console.log(chalk.gray(`  用户: ${msg}`));
    console.log(chalk.green(`  AI: ${response}`));
  }

  console.log(chalk.gray(`\n总消息数: ${await memory.getMessageCount()}`));
}

async function demoRAG(): Promise<void> {
  console.log(chalk.bold("\n📚 RAG — 检索增强生成\n"));

  const rag = new RAGPipeline();

  await rag.index([
    "Agent 是能自主决策和行动的程序，通过感知、规划、执行完成任务。",
    "ReAct 模式结合推理和行动，让 Agent 边思考边执行。",
    "Tool Calling 让 Agent 能调用搜索、计算等外部工具。",
    "LangChain.js 是构建 LLM 应用的 TypeScript 框架。",
    "RAG 通过检索文档增强 LLM 生成质量，减少幻觉。",
  ], "agent-docs.md");

  console.log(chalk.gray(`已索引 ${rag.documentCount} 个文档块\n`));

  for (const q of ["什么是 Agent？", "什么是 RAG？"]) {
    const result = await rag.query(q);
    console.log(chalk.cyan(`问题: ${q}`));
    console.log(chalk.green(`  回答: ${result.answer.slice(0, 80)}...`));
    console.log(chalk.gray(`  来源: ${result.sources.join(", ")}`));
  }
}

async function demoLCEL(): Promise<void> {
  console.log(chalk.bold("\n🔗 LCEL — 链式组合\n"));

  const basic = LCELDemo.createBasicChain();
  const result = await basic.run("Hello World");
  console.log(chalk.cyan("RunnableSequence（基础链）："));
  console.log(chalk.green(`  输出: ${result}`));

  const parallel = LCELDemo.createParallelChain();
  const parallelResult = await parallel.run("Agent 是基于 LLM 的自主程序");
  console.log(chalk.cyan("\nRunnableParallel（并行链）："));
  for (const [key, value] of Object.entries(parallelResult)) {
    console.log(chalk.green(`  ${key}: ${String(value).slice(0, 60)}`));
  }

  const passthrough = LCELDemo.createPassthroughChain();
  const ptResult = await passthrough.run("Hello");
  console.log(chalk.cyan("\nRunnablePassthrough（透传链）："));
  console.log(chalk.green(`  输出: ${ptResult}`));
}

async function demoCallbacks(): Promise<void> {
  console.log(chalk.bold("\n📡 Callbacks — 回调系统\n"));

  console.log(chalk.gray("以下是用 ConsoleCallbackHandler 监控 LLM 调用的输出："));
  await runWithCallbacks();
}

async function main(): Promise<void> {
  console.log(chalk.bold("🔗 Phase 7：LangChain.js 深度实战"));
  console.log(chalk.gray("使用真实 LangChain API，FakeListChatModel 无需 API Key\n"));

  await demoAgent();
  await demoMemory();
  await demoRAG();
  await demoLCEL();
  await demoCallbacks();

  console.log(chalk.green("\n✅ 所有演示完成！\n"));
}

main().catch(console.error);
