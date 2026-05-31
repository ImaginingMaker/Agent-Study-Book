# 附录：速查表与简历指南

---

## A. 各阶段速查表

| 阶段 | 核心概念 | 关键代码 | 安全要点 | 难度 |
|------|---------|---------|---------|------|
| 第一章：Workflow | 生命周期、设计模式全景、输入/输出契约 | （认知） | 安全是红线 | ⭐ |
| 第二章：Agent Loop | ReAct、意图分类、状态管理、三种 Loop 模式 | `agent_loop.ts` | — | ⭐⭐ |
| 第三章：LLM + Tool Calling | Provider 抽象、Tool Calling 协议、Registry、沙箱执行、LangChain.js 集成 | `llm_provider.ts`, `tool_registry.ts` | Sandbox 隔离 | ⭐⭐⭐ |
| 第四章：Context + 安全 | Context 组装、SQLite 记忆、Session 管理、Injection 防御 | `context_builder.ts`, `memory/`, `session.ts` | Injection 三层防御 | ⭐⭐⭐ |
| 第五章：Eval & Obs | Eval Case、消融实验、Trajectory 日志 | `eval_runner.ts` | 安全 Eval Case | ⭐⭐⭐⭐ |
| 第六章：可靠性 | Guardrails、幂等、熔断、限流、成本控制、审计日志 | `reliability/*.ts` | 完整安全层 | ⭐⭐⭐⭐⭐ |
| 第七章：LangChain.js | ChatModel、PromptTemplate、AgentExecutor、Memory、RAG、LCEL、Callbacks | `langchain/*.ts` | 框架安全注意事项 | ⭐⭐⭐⭐⭐ |

### 核心 API 速查

```typescript
// Provider 抽象
interface Message { role: 'system' | 'user' | 'assistant' | 'tool'; content: string }
abstract class LLMProvider { abstract chat(messages, tools?, config?): Promise<LLMResponse> }

// Tool 系统
interface ToolSpec { name, description, parameters: z.ZodObject, fn, timeout?, permission? }
class ToolRegistry { register(spec), get(name), listTools(), call(name, params) }

// Context
class ContextBuilder { build(phase, history, toolResults, userInput): Context }

// 记忆
class SQLiteMemory { saveTurn(turn), getSessionHistory(sessionId), close() }

// 安全
class InjectionDefense { static isolateUserInput(input), static addSystemGuard(systemPrompt), static sanitizeOutput(content) }

// Eval
interface EvalCase { id, input, expectedOutput?, expectedTools?, category }
class EvalRunner { runCase(case), runAll(cases), report() }

// 可靠性
class IdempotencyGuard { tryExecute(key, fn) }
class CircuitBreaker { call(fn) }
function retryWithBackoff(fn, maxRetries, baseDelay)
class ProviderRouter { callWithFallback(messages, tools) }
class CostGuard { checkBeforeTurn(), recordUsage(cost) }
class PermissionManager { checkPermission(toolName, level) }

// LangChain.js v1（旧 API）
const agent = createToolCallingAgent({ llm, tools, prompt })
const executor = new AgentExecutor({ agent, tools, maxIterations })

// LangChain.js v2（新 API，推荐）
import { createAgent, tool } from "langchain";
const agent = createAgent({ model: "claude-sonnet-4-6", tools: [...] })
const result = await agent.invoke({ messages: [{ role: "user", content: "..." }] })

// Vercel AI SDK v6
const agent = new ToolLoopAgent({ model: "anthropic/claude-sonnet-4.5", tools: {...} })
const result = await agent.generate({ prompt: "..." })
```

---

## B. 推荐阅读清单

### 入门级（第一、二章前置阅读）

| 资源 | 类型 | 链接 |
|------|------|------|
| Anthropic: Building effective agents | 官方指南 | [阅读](https://docs.anthropic.com/en/docs/build-with-claude/agentic) |
| ReAct 论文（摘要 + 后记） | 学术论文 | [阅读](https://arxiv.org/abs/2210.03629) |
| Anthropic: Tool Use 入门 | 官方教程 | [阅读](https://docs.anthropic.com/en/docs/build-with-claude/tool-use) |
| OpenAI: Function Calling 入门 | 官方教程 | [阅读](https://platform.openai.com/docs/guides/function-calling) |
| Vercel AI SDK: Tool Calling 模式 | 框架文档 | [阅读](https://sdk.vercel.ai/docs/ai-sdk-ui/tools-and-tool-calling) |

### 进阶级（第三、四章前置阅读）

| 资源 | 类型 | 链接 |
|------|------|------|
| MCP: Model Context Protocol | 协议规范 | [阅读](https://modelcontextprotocol.io/) |
| LangChain.js: Tool 设计模式 | 框架文档 | [阅读](https://js.langchain.com/docs/modules/tools/) |
| LangChain.js: Agent Types | 框架文档 | [阅读](https://js.langchain.com/docs/modules/agents/agent_types/) |
| better-sqlite3 文档 | 库文档 | [阅读](https://github.com/WiseLibs/better-sqlite3) |
| Prompt Injection 综述 | 社区资源 | [阅读](https://github.com/takumib/awesome-prompt-injection) |
| OWASP: LLM Top 10 | 安全标准 | [阅读](https://genai.owasp.org/) |

### 框架篇（第七章前置阅读）

| 资源 | 类型 | 链接 |
|------|------|------|
| LangChain.js 官方文档 | 完整 API 参考 | [阅读](https://js.langchain.com/) |
| LangChain Academy | 免费官方课程 | [访问](https://academy.langchain.com/) |
| LCEL 文档 | 链式组合语法 | [阅读](https://js.langchain.com/docs/expression_language/) |
| LangSmith | 生产级可观测性平台 | [访问](https://smith.langchain.com/) |
| Zod 文档 | Schema 验证库 | [阅读](https://zod.dev/) |
| LangChain.js `createAgent` 新 API | 新一代 Agent 创建方式 | [阅读](https://js.langchain.com/docs/modules/agents/) |

### 高级（第五、六章前置阅读）

| 资源 | 类型 | 链接 |
|------|------|------|
| Anthropic: Eval 方法论 | 官方指南 | [阅读](https://docs.anthropic.com/en/docs/build-with-claude/eval) |
| LangSmith: Walkthrough | 平台教程 | [阅读](https://docs.smith.langchain.com/) |
| 12 Factor App | 架构原则 | [阅读](https://12factor.net/) |
| AWS: Circuit Breaker Pattern | 架构模式 | [阅读](https://docs.aws.amazon.com/whitepapers/latest/software-architecture-patterns/circuit-breaker-pattern.html) |
| Stripe: Idempotency | 工程实践 | [阅读](https://stripe.com/docs/api/idempotent_requests) |
| LangChain.js: Production | 生产化指南 | [阅读](https://js.langchain.com/docs/expression_language/) |
| Vercel AI SDK: Streaming Text | 流式响应模式 | [阅读](https://sdk.vercel.ai/docs/ai-sdk-ui/streaming-text) |

---

## C. 调试速查表

### Agent Loop 问题

| 症状 | 可能原因 | 对策 |
|------|---------|------|
| Agent 一直调用同一个工具 | 上下文窗口满了，模型缺乏足够信息做出不同决策 | 检查 Context 压缩策略；添加更多区分度到工具描述 |
| Agent 选择错误工具 | ToolSpec.description 不清晰或冲突 | 对比 LLM 选择 vs 关键词匹配的准确率；简化描述中的歧义 |
| 多步骤后 Agent 表现下降 | Context 被污染（前面的错误结果被带到后续轮次） | 加 Context 压缩或定期重置上下文；检查 Trajectory 日志 |
| Agent 不调用任何工具 | System Prompt 未强调工具使用；模型不支持 Tool Calling | 确认 Provider 实现正确；检查 Tool Schema 是否合法 |

### Tool 执行问题

| 症状 | 可能原因 | 对策 |
|------|---------|------|
| Tool 调用返回慢 | 网络延迟；外部 API 响应慢 | 加 Circuit Breaker 防止慢工具拖垮整体；设合理 timeout |
| Tool 返回错误 | 参数验证失败；外部服务故障 | 检查 Tool Parameter Schema；加重试逻辑 |
| Tool 返回结果过大 | 未设 maxOutputSize | 截断返回值；使用流式处理 |
| Sandbox 拒绝执行 | 文件路径不在白名单内；命令被禁止 | 检查 Sandbox 配置中的 allowedPaths/allowedCommands |

### 成本与性能问题

| 症状 | 可能原因 | 对策 |
|------|---------|------|
| 成本失控 | maxSteps 未设置；工具被反复调用 | 检查 maxSteps；加 Cost Guard 兜底 |
| Token 消耗过高 | Context 未压缩；历史记录无限累积 | 启用 Context 压缩；限制 history length |
| LLM 响应变慢 | 使用了超大模型；Prompt 过长 | 考虑使用更小模型；优化 Context 结构 |

### 可靠性问题

| 症状 | 可能原因 | 对策 |
|------|---------|------|
| 重复执行导致副作用 | 未实现幂等性 | 加 IdempotencyGuard |
| 连续失败拖垮系统 | 无熔断机制 | 加 Circuit Breaker |
| 单 Provider 不可用 | 无 Fallback | 配 ProviderRouter 多 Provider 切换 |
| 达到 API Rate Limit | 无重试策略 | 加 retryWithBackoff |

### 常用调试命令

```bash
# 查看 Trajectory 日志
cat trajectories/<session-id>.json | jq '.summary'

# 运行 Eval 并查看报告
npx ts-node src/eval/run.ts

# 测试单个 Tool
npx ts-node -e "const { ToolRegistry } = require('./src/tool_registry'); ..."

# 检查 SQLite 记忆存储
npx ts-node -e "const { SQLiteMemory } = require('./src/memory'); ..."

# 查看结构化日志
cat logs/structured.log | jq '.'
```

---

## D. 简历对应指南

### 技能映射表

```
你学到的                    →  简历可以写
────────────────────────────────────────────────────────────────
LLM Provider 抽象           → "设计统一 LLM Provider 接口，支持 Anthropic/OpenAI 一键切换"
Tool Calling 协议           → "实现完整 Tool Calling 协议：Schema 定义 → tool_use 解析 → 结果回传"
ReAct Loop                  → "设计并实现 ReAct Agent Loop，支持多轮工具调用与动态意图分类"
Tool Registry               → "构建基于 Registry 的灵活工具注册系统，新增工具零侵入"
Context 管理                → "实现 5 层 Context 管理体系：system/history/retrieved/tool/user"
SQLite 记忆                 → "基于 SQLite 的会话持久化，支持跨会话状态恢复与历史检索"
Session 管理                → "实现 Session 管理，支持多用户隔离与超时自动回收"
Injection 防御              → "实现 3 层 Prompt Injection 防御：边界隔离 + 对抗指令 + 输出过滤"
Sandbox                     → "设计工具沙箱：child_process 进程隔离 + 路径白名单 + 资源限制"
LangChain.js                → "熟练使用 LangChain.js，基于 AgentExecutor 搭建生产级 Agent 应用"
RAG 实现                    → "实现完整 RAG 链路：文档分割 → Embedding → 向量检索 → 生成"
LCEL                        → "使用 LangChain Expression Language 构建可组合、可流式的 AI Chain"
Agent Memory                → "集成 BufferMemory 与 RunnableWithMessageHistory，实现多轮上下文保持"
Eval Framework              → "构建 20+ 条 Eval Case，端到端通过率 80%+，定位 5 类失败模式"
消融实验（Ablation）         → "消融实验显示 Context 压缩使成功率提升 12%"
幂等性                      → "实现 Idempotency Guard，确保工具重复调用不会产生副作用"
熔断器                      → "实现 Circuit Breaker 模式，故障自动降级，保障系统稳定性"
限流重试                    → "实现 Retry with Backoff + Provider Fallback，API 可用性达 99.9%"
成本控制                    → "设计 Cost Guard 系统，按 Session/Turn 级别控制 Token 与费用消耗"
权限分级                    → "实现 Permission Tier 系统，敏感操作需用户二次确认"
MCP 协议                    → "了解 Model Context Protocol，具备标准化工具协议认知"
Vercel AI SDK               → "熟悉 Vercel AI SDK 的 Tool Calling 与 Streaming 模式"
```

### 简历项目描述模板

**Agent 开发框架（个人项目）**

> 使用 TypeScript + Node.js 从零实现了一套完整 Agent 开发框架，涵盖 LLM Provider 抽象、Tool Calling 协议、ReAct Loop、Context 管理、SQLite 记忆持久化等核心模块。框架支持 Anthropic/OpenAI 双 Provider 一键切换，内置 3 层 Prompt Injection 防御机制和工具沙箱隔离。通过 Eval Framework 对 20+ 测试用例进行评测，端到端通过率 85%+。消融实验表明 Context 压缩机制使任务成功率提升 12%。

**LangChain.js Agent 应用（个人项目）**

> 基于 LangChain.js 搭建生产级 Agent 应用，使用 AgentExecutor 管理多轮 Tool Calling 流程，集成 BufferMemory 实现多轮对话上下文保持。通过 LCEL 构建可组合的 RAG 链路，使用 LangSmith Callbacks 实现全链路可观测性。项目在 15 个业务场景中通过率 80%+。

### 面试常见问答

| 问题 | 要点 |
|------|------|
| "什么是 ReAct？" | Reason + Act 循环：模型推理 → 决定行动 → 执行工具 → 观察结果 → 继续推理 |
| "Tool Calling 和 Function Calling 有什么区别？" | Tool Calling 是通用概念（模型选择工具），Function Calling 是 OpenAI 的特定实现 |
| "如何处理 Prompt Injection？" | 三层防御：输入隔离（分隔符标记） + 系统指令强化 + 输出过滤（正则匹配敏感模式） |
| "Agent 和 Chatbot 有什么不同？" | Agent 有工具调用能力、自主决策、多步规划；Chatbot 通常是单轮对话 |
| "Context 窗口满了怎么办？" | 压缩历史（摘要化）、截断早期记录、优先保留最近的交互 |
| "如何评测 Agent 质量？" | Eval Case（预期输出/工具）+ 消融实验（控制变量对比）+ 人工 Review |
