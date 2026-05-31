# AGENTS.md — agentDev 仓库指南

## 项目性质

TypeScript Agent 开发渐进式教程（7 章），每章一个 `phases/phase-N-*/` 目录。
纯 Node.js 终端应用，不涉及 React/Vue/Next.js。

## 目录结构

```
phases/
├── phase-1-understand-workflow/     # 仅学习笔记
│   └── learning-notes.md
├── phase-2-agent-loop/              # 可运行 + 测试
│   ├── src/
│   │   ├── agent_loop.ts           # 入口
│   │   ├── intent_classifier.ts
│   │   └── state.ts
│   ├── tests/test_agent_loop.test.ts
│   └── learning-notes.md
├── phase-3-tools-sandbox/           # 可运行 + 测试
│   ├── src/
│   │   ├── index.ts                # 入口
│   │   ├── sandbox.ts
│   │   ├── tool_errors.ts
│   │   ├── tool_registry.ts
│   │   └── tool_selector.ts
│   ├── tests/test_registry.test.ts
│   └── learning-notes.md
├── phase-4-context-security/        # 仅学习笔记
│   └── learning-notes.md
├── phase-5-eval-observability/      # 仅学习笔记
│   └── learning-notes.md
├── phase-6-security-reliability/    # 可运行（无测试）
│   ├── src/
│   │   ├── index.ts                # 入口
│   │   └── reliability/
│   │       ├── circuit_breaker.ts
│   │       ├── cost_guard.ts
│   │       ├── idempotency.ts
│   │       ├── logger.ts
│   │       ├── permission.ts
│   │       └── rate_limiter.ts
│   ├── tests/                      # 空
│   └── learning-notes.md
├── phase-7-langchain-depth/         # 仅学习笔记
│   └── learning-notes.md
docs/
├── book/                            # 教程正文章节（12 个 markdown）
│   ├── SUMMARY.md
│   ├── intro.md
│   ├── chapter-01-workflow.md
│   ├── chapter-02-agent-loop.md
│   ├── chapter-03-llm-tools.md
│   ├── chapter-04-context.md
│   ├── chapter-05-eval.md
│   ├── chapter-06-reliability.md
│   ├── chapter-07-langchain.md
│   ├── glossary.md
│   └── appendix.md
├── handbook.md                      # 完整教程手册
└── roadmaps/
    └── roadmap.md
src/                                 # 空（占位）
```

只有 phases 2/3/6 有代码。phases 1/4/5/7 仅 `learning-notes.md`。

## 命令

```bash
npm run phase2          # 运行 Phase 2 主入口
npm run test            # 运行全部测试（vitest）
npm run test:phase2     # 仅跑 Phase 2 测试
npm run typecheck       # tsc --noEmit 类型检查
```

运行其他 phase：`npx tsx phases/phase-N-*/src/index.ts`

运行单个测试文件：`npx vitest run phases/phase-3-tools-sandbox/tests/test_registry.test.ts`

## 技术栈注意事项

- **模块系统**: ESM (`"type": "module"`)，所有 import 必须带 `.js` 后缀（TypeScript 编译目标为 ESM 时的惯例）
- **运行时**: `tsx`（直接跑 TypeScript，不经过 tsc 编译）
- **测试**: Vitest v2，测试文件命名 `*.test.ts`
- **TypeScript**: strict 模式，ES2022 目标，`moduleResolution: "bundler"`

## API 密钥

Phase 3+ 需要 LLM API Key（Anthropic Claude 或 OpenAI）。存放方式：
- 创建 `.env` 文件（已 gitignored），不会被提交
- 当前代码没有自动加载 `.env`，需要自己实现或手动传入

## 已忽略的文件（gitignored）

- `agent_state.json` — Phase 2 状态持久化文件（运行后自动生成）
- `*.db` / `*.sqlite*` — Phase 4 记忆存储
- `logs/` / `trajectories/` — 日志和轨迹
- `.env` / `.env.local` / `.env.*.local` — API 密钥
- `coverage/` — vitest 覆盖率报告
