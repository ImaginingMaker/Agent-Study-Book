/**
 * Agent — LangChain.js 真实 Agent
 *
 * 使用 createReactAgent 创建 ReAct Agent，配合 DynamicTool 实现工具调用。
 */

import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { DynamicTool } from "@langchain/core/tools";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { FakeListChatModel } from "@langchain/core/utils/testing";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";

export type AgentMode = "mock" | "real";

export async function createAgent(
  llm?: BaseChatModel,
): Promise<{
  agent: ReturnType<typeof createReactAgent>;
  tools: DynamicTool[];
}> {
  const model = llm ?? new FakeListChatModel({
    responses: [
      `{"action": "calculator", "action_input": "3,4"}`,
      `{"action": "search", "action_input": "LangChain agents"}`,
      "最终答案: 3 * 4 = 12，LangChain 提供了强大的 Agent 支持。",
    ],
  });

  const tools = [
    new DynamicTool({
      name: "calculator",
      description: "计算两个数字的乘积，输入格式: a,b",
      func: async (input: string) => {
        const [a, b] = input.split(",").map(Number);
        return String(a * b);
      },
    }),
    new DynamicTool({
      name: "search",
      description: "搜索知识库获取信息",
      func: async (query: string) => {
        return `关于 "${query}" 的搜索结果：LangChain 是一个用于构建 LLM 应用的框架。`;
      },
    }),
  ];

  const agent = await createReactAgent({
    llm: model,
    tools,
  });

  return { agent, tools };
}

export async function runAgent(
  agent: ReturnType<typeof createReactAgent>,
  input: string,
): Promise<string> {
  const result = await agent.invoke({ messages: [new HumanMessage(input)] });

  const lastMsg = result.messages[result.messages.length - 1];
  if (lastMsg && lastMsg.content) {
    return typeof lastMsg.content === "string"
      ? lastMsg.content
      : JSON.stringify(lastMsg.content);
  }

  return "Agent 未返回有效输出";
}
