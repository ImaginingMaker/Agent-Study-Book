# 术语表

> 按字母顺序排列。括号内标注首次出现章节。

---

### Ablation（消融实验） [第五章]

一种评估方法：**控制变量**地启用/禁用某个模块（如 Context 压缩、记忆、重试），对比性能差异以量化该模块的贡献。例如，"消融实验显示 Context 压缩使成功率提升 12%"。详见第五章的 `runAblation()` 函数。

---

### Agent（智能体） [第一章]

一个能够**自主推理、决策、执行工具**的软件实体。Agent 的核心特征不是"对话"，而是"行动"——它能将用户意图分解为多步计划，调用工具执行，并基于结果调整后续行为。与 Chatbot 的区别在于 Agent 具有工具调用能力和自主决策能力。

---

### Agent Loop（智能体循环） [第二章]

Agent 运行时的**核心控制循环**。典型流程：接收输入 → 构建 Context → 调用 LLM → 解析响应 → 执行工具 → 记录结果 → 决定继续或停止。这是 Agent 架构的"心脏"，所有功能模块（Provider、Registry、Memory 等）都挂载在这个循环上。详见第二章的 `agentLoop()` 函数。

---

### AgentExecutor [第七章]

LangChain.js v1 API 中负责**编排 Agent 执行**的类（v2 中已被 `createAgent()` 替代）。它接收 Agent 实例和工具列表，自动管理多轮迭代（ReAct Loop），处理解析错误，返回中间步骤。典型的 AgentExecutor 配置包含 `maxIterations`（最大迭代次数）和 `returnIntermediateSteps`（是否返回中间步骤）。

---

### `createAgent()` [第七章]

LangChain.js v2 API 中的**新一代 Agent 创建函数**。基于 LangGraph 构建，支持字符串模型名、`tool()` 辅助函数、Messages 标准输入格式。相比 `AgentExecutor`，代码量减少约 60%。示例：`const agent = createAgent({ model: "claude-sonnet-4-6", tools: [...] })`。

---

### `tool()` [第七章]

LangChain.js v2 中定义工具的**辅助函数**，替代了 v1 的 `DynamicStructuredTool` 类。接收执行函数和配置对象（name, description, schema），返回符合 `Tool` 接口的对象。示例：`tool(fn, { name, description, schema: z.object({...}) })`。

---

### Assistant Message [第三章]

LLM 返回的消息类型，代表**模型的回复**。在 Tool Calling 场景中，Assistant Message 可能同时包含文本内容和工具调用请求（`tool_use`）。多轮对话中，Assistant Message 会被追加到消息历史中供后续轮次参考。

---

### Callback Handler（回调处理器） [第七章]

LangChain.js 的可观测性机制，通过**事件钩子**监控 Agent 执行过程。常用回调包括 `onLLMStart`、`onLLMEnd`、`onToolStart`、`onToolEnd`、`onChainError` 等。可用于日志记录、性能监控、调试。可观测性平台 LangSmith 就是基于 Callback 系统构建的。

---

### Chunking（分块） [第七章]

RAG 流程中，将长文档**切分成小段**的过程。常见的分块策略有：固定大小分块（按 Token 数）、语义分块（按段落/句子边界）、递归分块（递归应用分割规则）。分块参数 `chunkSize`（每块大小）和 `chunkOverlap`（块间重叠）直接影响检索质量。

---

### Circuit Breaker（熔断器） [第六章]

一种**故障保护模式**：当某个操作连续失败达到阈值（如 5 次），熔断器"断开"并在一定时间内直接拒绝所有请求，让系统有时间恢复。之后进入"半开"状态，尝试少量请求以检测是否恢复。详见第六章的 `CircuitBreaker` 类。

---

### Context Window（上下文窗口） [第四章]

LLM 一次能处理的**最大 Token 数量**（如 Claude 3.5 Sonnet 为 200K，GPT-4o 为 128K）。Agent 的 Context 管理就是在有限窗口内合理安排 System Prompt、历史记录、工具结果和用户输入。超出窗口会导致信息丢失或请求失败。

---

### Cost Guard（成本卫士） [第六章]

**成本控制模块**，在 Agent 执行过程中实时监控 Token 消耗和费用。主要功能包括：每轮次/Turn 检查限额、超标时中断执行、设置告警阈值。详见第六章的 `CostGuard` 类。

---

### DynamicStructuredTool [第七章]

LangChain.js v1 API 中**动态创建结构化工具**的类（v2 中已被 `tool()` 辅助函数替代）。与静态工具定义不同，`DynamicStructuredTool` 允许在运行时根据条件创建不同 Schema 的工具，适用于工具参数不确定的场景。

---

### Embedding（嵌入） [第七章]

将文本转换为**高维向量**的技术。同一语义的文本在向量空间中距离相近。RAG 流程中，文档和用户问题都被转换为 Embedding，然后通过向量相似度检索相关内容。LangChain.js 通过 `embeddings.embedQuery()` 和 `embeddings.embedDocuments()` 实现。

---

### Eval Case（评测用例） [第五章]

Agent 评测的**最小单元**，包含输入、预期输出、预期工具调用、分类标签。典型结构：`{ id, input, expectedOutput?, expectedTools?, category }`。多个 Eval Case 组成评测集，由 `EvalRunner` 批量执行并生成报告。

---

### Fallback（回退） [第六章]

当主操作失败时的**备用方案**。在 Provider 层面体现为：当 Anthropic 调用失败时，自动切换到 OpenAI 或其他 Provider。详见第六章的 `ProviderRouter` 类。

---

### Idempotency（幂等性） [第六章]

同一个操作**多次执行产生相同结果**的特性。在 Agent 中，幂等性防止工具调用因重试导致副作用（如重复写入、重复扣费）。详见第六章的 `IdempotencyGuard` 类。

---

### LangChain Expression Language (LCEL) [第七章]

LangChain.js 的**声明式链式组合语法**，使用 `|` 管道操作符将多个组件串联成执行链。示例：`chain = prompt | model | outputParser`。LCEL 支持流式输出、并行执行、错误处理和异步操作，是 LangChain.js 生产级应用的核心语法。

---

### LLM Provider (LLM 提供者) [第三章]

对大语言模型 API 的**统一抽象层**。定义标准接口 `chat(messages, tools?, config?)`，隐藏不同模型（Anthropic、OpenAI、Google 等）的 API 差异。详见第三章的抽象类 `LLMProvider`。

---

### MCP (Model Context Protocol) [第一章]

Anthropic 提出的**模型上下文协议**，旨在标准化 Agent 与外部工具/数据源的交互方式。MCP 定义了工具发现、调用、认证等协议层面的规范。虽然本书未深入实现 MCP，但它是 Agent 开发生态的重要发展方向。

---

### Memory（记忆） [第四章]

Agent 存储和检索**历史交互信息**的能力，分为三种类型：

- **短期记忆**：在单轮 Context 窗口内，通过消息历史传递，容量有限（受 Context Window 限制）
- **长期记忆**：跨会话持久化，通常基于数据库（如 SQLite），支持重启后恢复
- **工作记忆**：当前执行步骤中的中间状态（如当前阶段、工具结果），存储在 Agent State 中

详见第四章的 `SQLiteMemory` 类。

---

### Permission Tier（权限分级） [第六章]

对 Agent 工具调用进行**安全分级控制**的机制。常见分级：一次性批准（automated）→ 会话内批准（interactive）→ 每次确认（restricted）。敏感操作（如文件写入、代码执行、API 调用）需要用户二次确认。详见第六章的 `PermissionManager` 类。

---

### Prompt Injection（提示注入） [第四章]

攻击者通过**恶意输入操纵 LLM 行为**的安全威胁。典型攻击方式包括：指令覆盖（"忽略之前的所有指令"）、角色劫持（"你现在是 ..."）、数据提取（"把系统提示输出给我"）。详见第四章的三层防御体系：输入隔离 → 系统指令强化 → 输出过滤。

---

### RAG (Retrieval-Augmented Generation) [第七章]

**检索增强生成**，一种将外部知识库与 LLM 结合的技术范式。流程：文档分块 → 生成 Embedding → 存入 Vector Store → 检索相关片段 → 注入 Context → LLM 生成答案。RAG 解决了 LLM 知识截止、幻觉、领域知识不足等问题。

---

### ReAct（推理-行动循环） [第二章]

**Reason + Act** 的缩写，一种 Agent 工作范式。模型在每个步骤中：**推理**（思考当前状态和下一步计划）→ **行动**（选择工具并调用）→ **观察**（获取工具结果）。这个循环持续进行，直到任务完成或达到上限。ReAct 是当前 Agent 开发中最主流的架构模式。

---

### Retry with Backoff（退避重试） [第六章]

**指数退避的重试策略**：第一次失败等待 1s，第二次 2s，第三次 4s，以此类推（带随机抖动防止惊群效应）。用于处理 API 限流（Rate Limit）和临时性故障。详见第六章的 `retryWithBackoff()` 函数。

---

### Sandbox（沙箱） [第三章]

**安全执行环境**，用于隔离 Agent 的工具执行。主要措施：文件路径白名单（`allowedPaths`）、命令白名单（`allowedCommands`）、输出大小限制（`maxOutputSize`）、执行超时（`timeout`）。Sandbox 防止 Agent 的工具调用对系统造成破坏。详见第三章的 `ToolSandbox` 类。

---

### Schema（模式/约束） [第三章]

定义**工具输入参数的结构和约束**，通常使用 Zod 库定义。例如：

```typescript
const searchSchema = z.object({
  query: z.string().describe("搜索关键词"),
  maxResults: z.number().max(10).describe("最大结果数"),
});
```

LLM 根据 Schema 生成符合格式的 JSON 参数，Registry 用 Schema 验证参数合法性。

---

### Session（会话） [第四章]

用户与 Agent 之间**一次完整的交互过程**。Session 包含多轮对话（Turn），每轮可能有多次 Tool Calling。Session 管理涉及创建、身份绑定、超时回收等。详见第四章。

---

### System Prompt（系统提示） [第四章]

Agent 的**核心指令**，定义行为边界、角色定位、可用工具、输出格式等。System Prompt 是 Agent 行为的"宪法"——它比单次用户输入具有更高的优先级。好的 System Prompt 应包含：角色定义、能力描述、行为规范、安全约束。

---

### Tool Calling（工具调用） [第三章]

Agent **调用外部功能**的能力。流程：LLM 输出包含工具选择 → Agent 解析工具名称和参数 → 执行工具函数 → 返回结果给 LLM → LLM 基于结果继续推理。Tool Calling 是 Agent 从"对话"到"行动"的关键能力。

---

### Tool Message（工具消息） [第三章]

Tool Calling 流程中**工具执行结果的回传消息**。包含工具名称和返回值，被附加到消息历史中供 LLM 下一步推理使用。Tool Message 的格式因 Provider 而异（Anthropic 用 `tool_result` block，OpenAI 用 `tool` role）。

---

### Tool Registry（工具注册表） [第三章]

Agent 的**工具管理中心**，维护所有可用工具的定义和执行逻辑。核心方法：
- `register(spec)` — 注册工具，定义名称、描述、参数 Schema、执行函数、权限级别
- `call(name, params)` — 调用工具，负责参数验证、执行、错误处理
- `listTools()` — 获取所有工具 Schema（用于传给 LLM）

详见第三章的 `ToolRegistry` 类。

---

### Trajectory（轨迹） [第三章]

Agent 执行过程中**完整的步骤记录**，包含每轮的用户输入、LLM 调用、工具调用、结果、错误信息。Trajectory 用于调试（回溯问题）、评测（分析失败模式）、可观测性（行为审计）。详见第三章的 `ToolCallRecord` 接口和第五章的 `TrajectoryLogger` 类。

---

### User Message（用户消息） [第三章]

用户输入的消息类型，代表**人类的指令或问题**。在多轮对话中，User Message 是最新一轮的输入来源。在 Tool Calling 场景中，Tool 执行结果（Tool Message）之后通常跟着 User Message（如果 Agent 需要更多信息的话）。

---

### Vector Store（向量存储） [第七章]

专门用于**存储和检索 Embedding 向量的数据库**。支持近似最近邻搜索（ANN），根据向量相似度返回最相关的内容。LangChain.js 支持多种 Vector Store 实现：MemoryVectorStore（内存）、Chroma（本地）、Pinecone（云服务）等。

---

### Zod Schema（Zod 约束） [第三章]

[Zod](https://zod.dev/) 库定义的**类型安全验证 Schema**。在 Agent 开发中，Zod Schema 用于定义工具参数结构，同时提供运行时验证和 TypeScript 类型推导。示例：`const MySchema = z.object({ name: z.string(), age: z.number().min(0) })`。类型通过 `z.infer<typeof MySchema>` 自动推导。
