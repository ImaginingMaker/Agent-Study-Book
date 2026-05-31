# 📖 引言

## 什么是 Agent 开发？

Agent 开发是构建"智能体"（Agent）的工程实践——这些智能体能够感知环境、做出决策、调用工具，并独立完成多步骤任务。与传统程序不同，Agent 不是执行固定的指令序列，而是通过**推理—行动—观察**的循环（ReAct Loop）动态决定下一步做什么。

用一个比喻理解：传统程序像一张精确的乐谱，每个音符都被事先写好；Agent 则像一个爵士乐手，他知道旋律的大致方向，但每个音符都是即兴选择的。这种"概率性的行为"带来了极大的灵活性，也带来了全新的工程挑战。

2025-2026 年是 Agent 开发的爆发期。Anthropic 的 Claude（Opus 4/Sonnet 4 系列）、OpenAI 的 GPT 系列、Google Gemini 等大模型，都提供了越来越成熟的 Tool Calling 能力。同时，LangChain.js v2 的 `createAgent` 新 API、Vercel AI SDK v6 的 `ToolLoopAgent` 等 TypeScript 原生框架极大降低了 Agent 开发门槛，让前端开发者能够以熟悉的语言进入 Agent 开发领域。

## 为什么前端开发者（TypeScript）最适合 Agent 开发？

这并非巧合——TypeScript 与 Agent 开发有着天然的契合点：

1. **类型安全是 Agent 的基石**：Tool Calling 的核心是 Schema 定义。TypeScript 的类型系统和 Zod 等验证库，让工具输入/输出契约变得可靠而自文档化。你用 `interface` 定义 Agent 状态，用 `z.object()` 定义工具参数——这正是你每天在做的事。

2. **异步与事件驱动**：Agent Loop 本质上是异步的事件循环——发送 LLM 请求、等待工具返回、处理结果。Node.js 的 `async/await` 和事件模型完美适配这种模式。

3. **同构开发体验**：你可以在本地终端开发 Agent，然后无缝迁移到 Next.js API Route、Cloudflare Worker、或者 AWS Lambda。一套 TypeScript 技能栈通吃。

4. **生态系统丰富**：Anthropic SDK、OpenAI SDK、Vercel AI SDK、LangChain.js——所有这些 Agent 开发工具都有一流的 TypeScript 支持。

5. **前端架构思维**：Component 组合、状态管理、Hook 抽象——这些前端设计模式在 Agent 开发中有着直接的映射（Tool Registry 就像组件注册表，Context Builder 就像 Redux Store）。

> 这不是一次"跨行"，而是一次"延伸"。你的 TypeScript 技能是 Agent 开发的最佳起点。

## 你会学到什么？

本书共 7 章，覆盖从入门到生产的完整路径：

| 章节 | 内容 | 产出代码 |
|------|------|----------|
| 第一章：理解 Agent 开发 Workflow | Agent 生命周期、设计模式、输入/输出契约 | `workflow.md`（认知） |
| 第二章：实现 Agent Loop | ReAct 循环、意图分类、状态管理 | `agent_loop.ts` |
| 第三章：LLM 调用 + Tool Calling + 沙箱 | Provider 抽象、Tool Registry、沙箱执行 | `llm_provider.ts`, `tool_registry.ts` |
| 第四章：上下文 + 记忆 + 安全 | Context 组装、SQLite 记忆、Injection 防御 | `context_builder.ts`, `memory/` |
| 第五章：评测与可观测性 | Eval Framework、消融实验、Trajectory 日志 | `eval_runner.ts` |
| 第六章：生产级可靠性 | 幂等、熔断、限流、成本控制、权限分级 | `reliability/*.ts` |
| 第七章：LangChain.js 深度实战 | AgentExecutor、Memory、RAG、LCEL、Callbacks | `langchain/*.ts` |

每一章都以**动手编码**为核心——你会在终端运行真实的 Agent，观察它的行为，然后逐步完善它。

## 前置要求

- **Node.js 18+**（推荐 20 LTS）
- **TypeScript 基础知识**（interface、type、generic、async/await）
- **至少一个 LLM API Key**（推荐 Anthropic Claude API Key 或 OpenAI API Key）
- **终端基础**（npm/pnpm 命令、文件操作）
- **npm 或 pnpm** 包管理器

不需要任何 Agent 开发经验。不需要 Python。不需要机器学习背景。

## 如何使用本书

1. **按顺序阅读**：每一章建立在前一章的基础上。从第一章开始，不要在中间跳跃。
2. **边读边写代码**：每章的"动手练习"部分包含了可供运行的代码骨架。打开编辑器，跟着写。
3. **完成练习**：每章末尾有 1-3 个练习。它们不复杂，但能加深理解。
4. **参考附录**：遇到不熟悉的术语时，查阅[术语表](glossary.md)；写简历时参考[速查表与简历指南](appendix.md)。

本书的所有代码都是**终端应用**（CLI），不涉及 React/Vue 等前端框架。这样做是为了让你专注于 Agent 开发的核心概念，不被 UI 层分散注意力。在掌握这些核心概念后，你可以轻松地将 Agent 能力集成到任何 Web 框架中。

## 关于本书

本书的内容源自一份 Agent 开发学习手册，经过系统化重组和扩展，形成了现在的教程结构。在编写过程中，我们参考了以下权威资源以确保持续性与准确性：

- **Anthropic 官方文档** — Building effective agents、Tool Use、Eval 方法论
- **Vercel AI SDK 文档** — Tool Calling 模式、Streaming 实现
- **LangChain.js 官方文档** — AgentExecutor、LCEL、Memory、Callbacks 等 API 参考
- **LangSmith 文档** — 可观测性与生产化指南
- **OpenAI Platform 文档** — Function Calling 与 Assistants API

这些资源在每章的"延伸阅读"中都有具体链接。

---

准备好了吗？让我们从[第一章](chapter-01-workflow.md)开始——理解什么是 Agent 开发 Workflow。
