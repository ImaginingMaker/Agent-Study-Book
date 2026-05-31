# Phase 7 学习笔记：LangChain.js 深度实战

> 🎯 **毕业篇**——从手写 Agent 到框架加速。
> 用 LangChain.js 把你前面 6 个阶段学到的模式，以最流行的 TS Agent 框架重新实现。

---

## 我学到了什么？

### 1. LangChain.js 生态全景 (7.1)

LangChain.js 的核心组件的关系：

```
┌─────────────────────────────────────────────────┐
│              LangChain.js 组件全景               │
│                                                   │
│  ChatModel ──→ PromptTemplate ──→ Chain ──→ Output│
│      │                                  ↑        │
│      ↓                                  │        │
│   Tools ──→ Agent ──→ AgentExecutor ────┘        │
│                    │                              │
│                    ↓                              │
│                Memory ─── 上下文保持              │
│                    │                              │
│                    ↓                              │
│             VectorStore ─── RAG 检索               │
└─────────────────────────────────────────────────┘
```

**核心认知**：所有组件都实现了 `Runnable` 接口，所以才能用 `|` 运算符任意组合。

### 2. ChatModel vs 手写 Provider (7.2)

| 对比维度 | 手写 (Phase 3) | LangChain.js |
|---------|---------------|-------------|
| 初始化 | `new AnthropicProvider(apiKey)` | `new ChatAnthropic({ apiKey })` |
| 消息格式 | 自定义 `Message` 接口 | `SystemMessage` / `HumanMessage` / `AIMessage` |
| 工具绑定 | 手动拼接 `tools` 参数 | 构造函数传入或在 Agent 中自动绑定 |
| 流式 | 需要手写 SSE 解析 | `.stream()` 原生支持 |
| 批量 | 手写并发 | `.batch()` 原生支持 |

### 3. AgentExecutor vs 手写 Loop (7.5)

```
手写 (Phase 2-3)：
  while (step < maxSteps) {
    classifyIntent() → dispatch() → execute() → observe()
  }

LangChain.js：
  const executor = new AgentExecutor({ agent, tools, maxIterations: 5 })
  const result = await executor.invoke({ input })
  // ↑ 内部自动处理循环、工具调用、结果回传
```

### 4. 概念对照总表 (7.10)

```
你手写的概念              →  LangChain.js 对应
──────────────────────────┼─────────────────────────────
LLMProvider               →  ChatAnthropic / ChatOpenAI
Message                   →  BaseMessage (4 个子类)
Agent Loop (while)        →  AgentExecutor
classifyIntent            →  Agent 自动 tool_selection
ToolSpec + ToolRegistry   →  DynamicStructuredTool[] + Agent
ContextBuilder            →  ChatPromptTemplate + MessagesPlaceholder
SQLiteMemory              →  BufferMemory / RunnableWithMessageHistory
SessionManager            →  RunnableWithMessageHistory
TrajectoryLogger          →  intermediateSteps + Callbacks
StructuredLogger          →  BaseCallbackHandler
InjectionDefense          →  PromptTemplate 硬编码 + Guardrails
CircuitBreaker            →  需要手写（在 Callback 中实现）
CostGuard                 →  需要手写（在 Callback 中实现）
```

### 5. 我完成了哪些练习？

| 练习 | 完成度 | 感受/收获 |
|------|--------|----------|
| 1. ChatModel 基础 | ⬜ | |
| 2. PromptTemplate 重构 | ⬜ | |
| 3. AgentExecutor 替换 Loop | ⬜ | |
| 4. Memory 集成 | ⬜ | |
| 5. 简单 RAG | ⬜ | |
| 6. CallbackHandler | ⬜ | |

---

## 🚀 速查：最简 LangChain Agent

```typescript
import { ChatAnthropic } from "@langchain/anthropic";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { createToolCallingAgent, AgentExecutor } from "langchain/agents";
import { ChatPromptTemplate } from "@langchain/core/prompts";

// 1. 定义工具
const echo = new DynamicStructuredTool({
  name: "echo", description: "echo 工具",
  schema: z.object({ text: z.string() }),
  func: async ({ text }) => `你说: ${text}`,
});

// 2. 初始化模型
const llm = new ChatAnthropic({ model: "claude-3-haiku", apiKey: process.env.ANTHROPIC_API_KEY });

// 3. 创建 Agent
const agent = createToolCallingAgent({
  llm, tools: [echo],
  prompt: ChatPromptTemplate.fromMessages([
    ["system", "你是助手"],
    ["human", "{input}"],
    ["placeholder", "{agent_scratchpad}"],
  ]),
});

// 4. 运行
const result = await new AgentExecutor({ agent, tools: [echo] }).invoke({ input: "你好" });
console.log(result.output);
```

---

## 测试结果

```
即将添加：npx vitest run phases/phase-7-langchain-depth/tests/
```

---

## 自测清单

- [ ] 我能用 ChatModel 调 LLM API（.invoke / .stream / .batch）
- [ ] 我会用 ChatPromptTemplate 组装 prompt
- [ ] 我能用 DynamicStructuredTool 定义工具
- [ ] 我能用 AgentExecutor 构建完整 Agent
- [ ] 我能给 Agent 加 Memory（BufferMemory）
- [ ] 我能实现简单的 RAG
- [ ] 我会用 `|` 运算符组装 LCEL 链
- [ ] 我能写自定义 CallbackHandler
- [ ] 我知道什么时候该手写、什么时候用 LangChain

---

## 疑问/困惑

```

```

---

## 下一步

Phase 7 完成后 → 整个学习旅程收官！
你可以：

1. 深入 LangChain.js 高级功能（多 Agent、并行执行、图数据库 RAG）
2. 学习 LangSmith 做生产级监控
3. 用 Vercel AI SDK 做 Web Agent（+ 前端界面）
4. 把学到的模式应用到自己的项目中
