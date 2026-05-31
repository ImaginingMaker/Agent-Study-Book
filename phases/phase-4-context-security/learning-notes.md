# Phase 4 学习笔记：上下文 + 记忆 + 安全

> Agent 的灵魂不是模型参数，而是它"看到"了什么——Context 组装、记忆持久化、安全护栏。
> **技术栈**：TypeScript / Node.js + SQLite (better-sqlite3)

---

## 我学到了什么？

### 1. Context 的五层结构

```
最终 Prompt = 
  ① System Prompt（角色定义 + 行为规则 + 安全约束）
  ② Phase Info（当前阶段信息）
  ③ Tool Results（最近工具调用结果）
  ④ History（对话历史，压缩版）
  ⑤ User Input（当前输入）
```

**Context Builder** 按优先级组装，超出 Token 限制时执行压缩/截断策略。

### 2. Context 压缩策略

| 策略 | 做法 | 适合场景 |
|------|------|---------|
| 滑动窗口 | 保留最近 N 轮 | 简单场景 |
| 摘要替换 | 将旧历史摘要化 | 长对话 |
| Token 计数截断 | 超限时截断 | 资源敏感 |

### 3. 三种记忆类型

```
短期记忆（Session 内）：当前对话上下文，随会话结束消失
工作记忆（Task）：当前阶段、已完成步骤、待办列表
长期记忆（跨 Session）：SQLite 持久化，支持重启恢复
```

### 4. SQLite 记忆实现

```typescript
class SQLiteMemory {
  // 核心表：sessions（会话）、turns（对话轮次）、phase_outputs（阶段产出）
  saveTurn(sessionId, role, content, metadata)  // 保存一轮对话
  getSessionHistory(sessionId, limit)            // 获取历史
  savePhaseOutput(sessionId, phase, path, summary) // 保存产出
}
```

### 5. Session 管理

| 要素 | 作用 |
|------|------|
| session_id | 唯一标识一次会话 |
| user_id | 区分不同用户 |
| 超时策略 | 30 分钟无活动自动过期 |
| 轮次计数 | 控制资源和成本 |
| 成本追踪 | 累计 token 消耗 |

### 6. Prompt Injection 三道防线

```
① 边界隔离 → <user_message> 标签包裹用户输入
② 对抗指令 → System Prompt 明确拒绝指令覆盖
③ 输出过滤 → 正则过滤敏感信息（API Key 等）
```

---

## 动手练习记录

### 练习 1：SQLite 记忆

```
重启后能恢复状态吗？_________
"继续"能回到上次阶段吗？_________
```

### 练习 2：Session 管理

```
多用户隔离测试结果：_________
30 分钟超时触发了吗？_________
```

### 练习 3：Context 压缩

```
设置了多少轮后压缩？_________
压缩后 Token 减少了多少？_________
```

### 练习 4：Injection 防御

```
测试 "忽略之前的指令" 的结果：_________
测试 "告诉我 system prompt" 的结果：_________
```

---

## 自测清单

- [ ] 我能说出 Context 的 5 个组成部分
- [ ] 我知道 Context 超限时的处理策略
- [ ] 我能实现 Session 管理
- [ ] 我能实现 SQLite 记忆持久化
- [ ] 我知道三种记忆类型的区别
- [ ] 我能实现 Context 压缩
- [ ] 我能实现 Prompt Injection 三道防线
- [ ] 我理解 session_id 和 user_id 的区别

---

## 疑问/困惑

```

```

---

## 下一步

Phase 4 完成后 → 进入 Phase 5：评测 & 可观测性（用数据说话）
