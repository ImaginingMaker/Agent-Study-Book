# Phase 2 学习笔记：实现 Agent Loop

> 从"知道"到"做到"——写第一个 Agent Loop。
> **技术栈**：TypeScript / Node.js

---

## 我学到了什么？

### 1. Agent Loop 的 4 步结构

```
1. 输入   → 从用户获取消息
2. 理解   → 分类意图（关键词匹配 / LLM）
3. 行动   → 根据意图执行对应处理函数
4. 输出   → 返回结果给用户，回到步骤 1
```

**Phase 2 实现中，这 4 步分别在哪个文件/函数里？**

| 步骤 | 代码位置 | 关键函数 |
|------|---------|---------|
| 输入 | `agent_loop.ts` | `rl.question()` (readline/promises) |
| 理解 | `intent_classifier.ts` | `classifyIntent()` |
| 行动 | `agent_loop.ts` | `handleQueryPhase()` / `handleNextStep()` 等 |
| 输出 | `agent_loop.ts` | `console.log()` |

### 2. 意图分类

我的 Agent 目前支持哪些意图？

```
query_phase    → 用户说 "我在哪"、"阶段"、"进度"
next_step      → 用户说 "下一步"、"然后"、"接下来"
execute_phase  → 用户说 "帮我"、"开始"、"执行"
help           → 用户说 "帮助"、"怎么用"
exit           → 用户说 "退出"、"结束"
unknown        → 其他无法理解的输入
```

### 3. 状态管理

`AgentState` 包含了哪些字段？

| 字段 | 类型 | 用途 |
|------|------|------|
| `phase` | `string` | 当前 workflow 阶段 |
| `userInput` | `string` | 用户最新输入 |
| `history` | `Array<[string, string]>` | 对话历史 |
| `toolResults` | `Record<string, unknown>` | 工具调用结果 |
| `maxSteps` | `number` | 最大步数限制 |
| `currentStep` | `number` | 当前步数 |

状态持久化是怎么实现的？
```
存储方式：JSON 文件（agent_state.json）
存储位置：项目根目录
重启恢复：StateStore.load() → 检查文件存在 → JSON.parse → AgentState.fromJSON()
```

### 4. Agent Loop vs 三种模式对比

我现在的实现属于哪种模式？

```
✅ 模式A: 硬编码路由（关键词匹配 + 固定响应）
□ 模式B: 模型路由（LLM 分类）
□ 模式C: ReAct（推理+行动交替）

理由：用 `classifyIntent()` 做关键词匹配，根据意图分发到不同 handler
```

---

## 动手练习记录

### 练习 1：跑通 Agent

> 运行 `npx tsx src/agent_loop.ts`，测试各种输入

我测试了哪些输入？结果如何？

| 输入 | 期望意图 | 实际结果 | 通过？ |
|------|---------|---------|-------|
| 我在哪 | query_phase | | |
| 下一步 | next_step | | |
| 帮我 | execute_phase | | |
| 帮助 | help | | |
| 退出 | exit | | |
| 随便说点啥 | unknown | | |

### 练习 2：扩展意图分类

> 我新增了哪个意图？怎么实现的？

```
新增意图名：________
触发关键词：________
处理函数做了什么：________
```

### 练习 3：状态持久化

> 验证：启动 Agent → 说几句话 → 退出 → 重启

重启后状态恢复了吗？_________
恢复到了哪个阶段？_________

---

## 测试结果

```
npx vitest run phases/phase-2-agent-loop/tests/

测试全部通过？_____
哪个测试失败了？_____
为什么？_____
```

---

## 自测清单

- [ ] 我能手写一个最简 Agent Loop
- [ ] 我知道 `while` 循环的终止条件有哪些
- [ ] 我能解释 ReAct 模式的含义
- [ ] 我理解意图分类的作用
- [ ] 我知道三种 Agent Loop 模式的区别
- [ ] 我知道 Agent 状态管理包含什么
- [ ] 我能扩展意图分类器
- [ ] 我完成了练习 1-3

---

## 疑问/困惑

```

```

## 下一步

Phase 2 完成后 → 进入 Phase 3：Tool Registry + LLM Calling + LangChain.js
