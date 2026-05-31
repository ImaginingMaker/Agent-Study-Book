/**
 * Context Builder — Agent 上下文组装
 *
 * 将系统提示、消息历史、工具定义等信息组装为 LLM 调用所需的完整上下文。
 */

import { Message, MemoryStore } from "./memory_store.js";
import { SessionMeta } from "./session_manager.js";

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface ContextConfig {
  systemPrompt: string;
  maxMessages: number;
  includeTimestamps: boolean;
}

export interface BuiltContext {
  systemPrompt: string;
  messages: Array<{ role: string; content: string }>;
  toolDefinitions: ToolDefinition[];
  metadata: {
    sessionId: string;
    messageCount: number;
    timestamp: string;
  };
}

export class ContextBuilder {
  private config: ContextConfig;

  constructor(config?: Partial<ContextConfig>) {
    this.config = {
      systemPrompt: "你是一个 Agent 开发助手。",
      maxMessages: 20,
      includeTimestamps: false,
      ...config,
    };
  }

  setConfig(config: Partial<ContextConfig>): void {
    this.config = { ...this.config, ...config };
  }

  async build(
    session: SessionMeta,
    memory: MemoryStore,
    tools: ToolDefinition[] = [],
    userInput?: string,
  ): Promise<BuiltContext> {
    const messages = await memory.getMessages(session.sessionId, this.config.maxMessages);

    const formattedMessages = messages.map((msg) => ({
      role: msg.role,
      content: this.config.includeTimestamps
        ? `[${msg.timestamp.toISOString()}] ${msg.content}`
        : msg.content,
    }));

    if (userInput) {
      formattedMessages.push({ role: "user", content: userInput });
    }

    return {
      systemPrompt: this.config.systemPrompt,
      messages: formattedMessages,
      toolDefinitions: tools,
      metadata: {
        sessionId: session.sessionId,
        messageCount: formattedMessages.length,
        timestamp: new Date().toISOString(),
      },
    };
  }

  static formatForLLM(context: BuiltContext): string {
    const parts: string[] = [];

    parts.push(`[SYSTEM]\n${context.systemPrompt}\n`);

    if (context.toolDefinitions.length > 0) {
      parts.push("[TOOLS]");
      for (const tool of context.toolDefinitions) {
        parts.push(`  ${tool.name}: ${tool.description}`);
      }
      parts.push("");
    }

    parts.push("[CONVERSATION]");
    for (const msg of context.messages) {
      parts.push(`  ${msg.role}: ${msg.content}`);
    }

    return parts.join("\n");
  }
}
