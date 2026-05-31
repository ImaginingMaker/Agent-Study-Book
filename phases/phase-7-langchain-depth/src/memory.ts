/**
 * Memory — LangChain.js 对话记忆
 *
 * 使用 InMemoryChatMessageHistory 管理对话历史，配合 RunnableWithMessageHistory
 * 实现带记忆的对话链。
 */

import { InMemoryChatMessageHistory } from "@langchain/core/chat_history";
import { BaseMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import { RunnableWithMessageHistory } from "@langchain/core/runnables";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { FakeListChatModel } from "@langchain/core/utils/testing";

export class ConversationMemory {
  private history: InMemoryChatMessageHistory;

  constructor() {
    this.history = new InMemoryChatMessageHistory();
  }

  async addMessage(msg: BaseMessage): Promise<void> {
    await this.history.addMessage(msg);
  }

  async getMessages(): Promise<BaseMessage[]> {
    return this.history.getMessages();
  }

  async clear(): Promise<void> {
    await this.history.clear();
  }

  async getMessageCount(): Promise<number> {
    const msgs = await this.history.getMessages();
    return msgs.length;
  }

  async formatContext(): Promise<string> {
    const msgs = await this.history.getMessages();
    return msgs
      .map((m) => `${m._getType()}: ${m.content}`)
      .join("\n");
  }
}

export function createMemoryChain() {
  const model = new FakeListChatModel({
    responses: [
      "你好！我是 AI 助手。",
      "Agent 是基于 LLM 的自主程序。",
      "记忆功能让我能记住之前的对话。",
    ],
  });

  const prompt = ChatPromptTemplate.fromMessages([
    ["system", "你是一个 AI 助手。对话历史：\n{history}"],
    ["human", "{input}"],
  ]);

  const chain = prompt.pipe(model);

  return {
    chain,
    async call(input: string, history: string): Promise<string> {
      const result = await chain.invoke({ input, history });
      return typeof result.content === "string" ? result.content : JSON.stringify(result.content);
    },
  };
}
