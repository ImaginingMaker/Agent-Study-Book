# Agent 开发入门教程

> 从零到一，系统掌握 Agent 开发——面向前端开发者的 TypeScript 教程。
> 7 个章节，每章一个可运行产出，安全贯穿始终。
>
> 📗 **完整教程 → [docs/book/SUMMARY.md](docs/book/SUMMARY.md)**

---

## 📚 教程结构（7 章）

| 章 | 内容 | 产出代码 | 难度 |
|----|------|---------|------|
| ① **理解 Workflow** | 生命周期、设计模式全景、I/O 契约 | (认知) | ⭐ |
| ② **Agent Loop** | ReAct 循环、意图分类、状态管理 | `agent_loop.ts` | ⭐⭐ |
| ③ **LLM + Tool Calling + 沙箱** | Provider 抽象、Tool Calling 协议、Registry、LangChain.js 入门 | `sandbox.ts`, `tool_registry.ts`, `tool_selector.ts` | ⭐⭐⭐ |
| ④ **上下文 + 记忆 + 安全** | Context 组装、Session 管理、记忆存储、Injection 防御 | `context_builder.ts`, `memory_store.ts`, `injection_defense.ts` | ⭐⭐⭐ |
| ⑤ **评测 & 可观测** | Eval Case、指标计算、Trajectory | `eval_runner.ts`, `metrics.ts`, `trajectory.ts` | ⭐⭐⭐⭐ |
| ⑥ **生产级可靠性** | 幂等、熔断、限流、成本控制、权限分级 | `reliability/*.ts` | ⭐⭐⭐⭐⭐ |
| ⑦ **LangChain.js 深度实战** | AgentExecutor、Memory、RAG、LCEL、Callbacks | `agent.ts`, `memory.ts`, `rag.ts`, `lcel.ts`, `callbacks.ts` | ⭐⭐⭐⭐⭐ |

### 安全贯穿路径

| Phase | 安全主题 |
|-------|---------|
| Phase 3 | Sandbox 工具隔离 |
| Phase 4 | Prompt Injection 防御 |
| Phase 5 | 安全测试验证 |
| Phase 6 | Guardrails + 审计兜底 |

---

## 🚀 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 运行 Phase 2（当前阶段 - 关键词匹配版 Agent Loop）
npm run phase2

# 3. 跑测试
npm run test:phase2
```

---

## 📊 进度

| # | 阶段 | 文件夹 | 代码状态 | 学习笔记 |
|---|------|--------|---------|---------|
| 1 | Workflow | `phases/phase-1-understand-workflow/` | ✅ 认知完成 | ✅ |
| 2 | Agent Loop | `phases/phase-2-agent-loop/` | ✅ 可运行 | ✅ |
| 3 | LLM + Tool Calling + 沙箱 | `phases/phase-3-tools-sandbox/` | ✅ 代码完成 | ✅ |
| 4 | 上下文 + 记忆 + 安全 | `phases/phase-4-context-security/` | ✅ 代码完成 | ✅ |
| 5 | 评测 & 可观测 | `phases/phase-5-eval-observability/` | ✅ 代码完成 | ✅ |
| 6 | 生产级可靠性 | `phases/phase-6-security-reliability/` | ✅ 代码完成 | ✅ |
| 7 | LangChain.js 深度实战 | `phases/phase-7-langchain-depth/` | ✅ 代码完成 | ✅ |

---

## 📖 使用本书

**两种阅读方式**：

1. **从头到尾（推荐）** → 从 [引言](docs/book/intro.md) 开始，按章节顺序阅读
2. **按需查阅** → 在 [术语表](docs/book/glossary.md) 查概念，在 [附录](docs/book/appendix.md) 查速查表和简历指南

每章结构：🎯 学习目标 → 📖 核心概念 → 🛠️ 动手练习 → 📊 自测清单 → 🔗 延伸阅读

---

## 项目结构

```
agentDev/
├── README.md                 # 本文件：项目入口 + 导航
├── docs/
│   ├── book/                 # 📗 完整教程（7 章 + 附录 + 术语表）
│   │   ├── SUMMARY.md        #    目录
│   │   ├── intro.md          #    引言
│   │   ├── chapter-01*.md    #    第一章：Workflow
│   │   ├── chapter-02*.md    #    第二章：Agent Loop
│   │   ├── chapter-03*.md    #    第三章：LLM + Tool Calling
│   │   ├── chapter-04*.md    #    第四章：上下文 + 安全
│   │   ├── chapter-05*.md    #    第五章：评测
│   │   ├── chapter-06*.md    #    第六章：可靠性
│   │   ├── chapter-07*.md    #    第七章：LangChain.js
│   │   ├── glossary.md       #    术语表
│   │   └── appendix.md       #    附录
│   ├── handbook.md           # 原始手册（已迁移至 book/）
│   └── roadmaps/             # 学习路径图
├── phases/                   # 各阶段代码 + 学习笔记
│   ├── phase-1-understand-workflow/
│   ├── phase-2-agent-loop/
│   ├── phase-3-tools-sandbox/
│   ├── phase-4-context-security/
│   ├── phase-5-eval-observability/
│   ├── phase-6-security-reliability/
│   └── phase-7-langchain-depth/
├── package.json
└── tsconfig.json
```

---

## 先决条件

- **Node.js >= 18**（推荐 20+）
- 一个 **API Key**（Phase 3+ 需要，推荐 Anthropic Claude 或 OpenAI）
- 基本的 **TypeScript** 语法（interface、type、async/await）

---

## 关于技术栈

本教程使用 **TypeScript**，原因：

| 理由 | 说明 |
|------|------|
| 前端友好 | 前端开发者零门槛上手 |
| 企业级 | LangChain.js、Vercel AI SDK、Anthropic SDK 全部支持 TS |
| 类型安全 | Agent 开发涉及大量 Schema 定义，TS 天然适合 |
| 生态成熟 | 所有主流 LLM Provider 都有官方 TS SDK |

> 全部是纯 Node.js 终端应用，不涉及 React/Vue/Next.js。
> 但你学到的 Agent 模式可以直接迁移到 Web 应用中。
