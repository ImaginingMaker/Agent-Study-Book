# Phase 3 学习笔记：LLM 调用 + Tool Calling + 沙箱

> 把 LLM 接入 Agent，定义工具让模型调用，用沙箱安全执行。
> **技术栈**：TypeScript / Node.js

---

## 我学到了什么？

### 1. LLM Provider 抽象

为什么要抽象 Provider？因为 Agent **不应绑定到某个特定模型**。今天用 Claude，明天换 GPT-4o：

```typescript
abstract class LLMProvider {
  abstract chat(messages: Message[], tools?: Record<string, any>[]): Promise<LLMResponse>;
}

class AnthropicProvider extends LLMProvider { /* ... */ }
class OpenAIProvider extends LLMProvider { /* ... */ }
```

**核心认知**：消息列表是所有 LLM API 的统一数据结构，toolCalls 是模型返回的"调用请求"而非执行结果。

### 2. Tool Calling 协议

完整流程：

```
① 发消息 + 传 Schema → ② 模型返回 tool_use → ③ 解析并执行工具 → ④ 结果回送模型
```

**关键类型**：

| 概念 | 代码表示 |
|------|---------|
| Tool Spec | `{ name, description, parameters, fn, timeout, permission }` |
| Tool Registry | `Map<string, ToolSpec>` + `register()` + `call()` |
| Tool Schema (给 LLM) | `{ name, description, input_schema: { type, properties, required } }` |

### 3. 工具选择四策略

| 策略 | 优点 | 缺点 | 适合阶段 |
|------|------|------|---------|
| 关键词匹配 | 极快 | 不灵活 | Phase 2 |
| LLM 选择 | 灵活、可靠 | 成本高 | **Phase 3** |
| 向量相似度 | 发现隐含工具 | 部署复杂 | 后续可加 |
| 规则映射 | 可控 | 死板 | 兜底策略 |

### 4. 错误处理体系

```typescript
ToolNotFoundError    → "工具不存在"
ToolTimeoutError     → "执行超时"
ToolParameterError   → "参数有误"
ToolPermissionError  → "权限不足"
ToolExecutionError   → "执行异常"
```

### 5. 沙箱隔离

Sandbox 的核心原则：

| 原则 | 实现 |
|------|------|
| 最小权限 | 工具只访问需要的最小资源 |
| 路径白名单 | 只允许读/写指定目录 |
| 资源限制 | 输出大小、内存、CPU 有上限 |
| 超时控制 | 每个工具有超时，超时即终止 |

### 6. LangChain.js 概念对照

| 手写概念 | LangChain.js |
|---------|-------------|
| `LLMProvider` | `ChatAnthropic` / `ChatOpenAI` |
| `Message` | `SystemMessage` / `HumanMessage` / `AIMessage` / `ToolMessage` |
| `ToolSpec` + `ToolRegistry` | `DynamicStructuredTool[]` |
| Agent Loop | `AgentExecutor` |
| `ContextBuilder` | `ChatPromptTemplate` + `MessagesPlaceholder` |

---

## 动手练习记录

### 练习 1：调通 LLM API

```
我使用的 Provider：_________
API Key 来源：_________
第一次调通的模型：_________
```

### 练习 2：Tool Calling 体验

```
我定义了哪些工具？
1. _________
2. _________
模型选对了工具吗？_________
工具结果回送后模型能总结吗？_________
```

### 练习 3：注册 Tool Registry

```
我把哪些 Phase 2 的 handler 改成了 ToolSpec？
- [ ] query_phase → _________
- [ ] next_step → _________
- [ ] execute → _________
```

---

## 代码快照

```
phases/phase-3-tools-sandbox/
├── src/
│   ├── index.ts              # 入口
│   ├── tool_registry.ts      # 注册表
│   ├── tool_errors.ts        # 错误类型
│   ├── tool_selector.ts      # 选择策略
│   └── sandbox.ts            # 沙箱
└── tests/
    └── test_registry.test.ts # 注册表测试
```

---

## 自测清单

- [ ] 我能用 Provider 抽象调通 LLM API
- [ ] 我理解消息列表的 4 种 role
- [ ] 我能写出 Tool JSON Schema
- [ ] 我能解析 LLM 返回的 tool_calls
- [ ] 我能把工具结果回送给模型
- [ ] 我能手写 Tool Registry
- [ ] 我知道 4 种工具选择策略的优劣
- [ ] 我能实现工具错误的统一处理
- [ ] 我理解沙箱的核心原则
- [ ] 我知道手写概念和 LangChain.js 的对应关系

---

## 疑问/困惑

```

```

---

## 下一步

Phase 3 完成后 → 进入 Phase 4：上下文 + 记忆 + 安全（给 Agent 加上"记忆"）
