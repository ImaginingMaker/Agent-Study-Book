# Phase 6 学习笔记：生产级可靠性

> 从"能跑"到"能上线"——可靠性六件套。
> **技术栈**：TypeScript / Node.js

---

## 我学到了什么？

### 1. 可靠性六件套架构

```
Agent 入口 ─→ Cost Guard → Permission Check → Idempotency
                ↓                                        ↓
            Agent Loop ─→ LLM 调用 → 工具选择 → Circuit Breaker → Rate Limit Retry → Provider Fallback
                ↓
            Structured Logging → 输出 / 优雅降级
```

**编排顺序的原则**：成本是最高优先级的约束——如果已经没钱了，后续所有工作都没有意义。

### 2. 六个组件的职责

| # | 组件 | 检查时机 | 失败行为 |
|---|------|---------|---------|
| 1 | **Cost Guard** | 每轮入口 | 超限 → 终止会话 |
| 2 | **Permission** | 工具调用前 | 拒绝或请求确认 |
| 3 | **Idempotency** | 工具调用前 | 返回缓存结果 |
| 4 | **Circuit Breaker** | 工具调用前 | 跳过调用，抛熔断错误 |
| 5 | **Rate Limit Retry** | 工具调用后 | 指数退避 + jitter + fallback |
| 6 | **Structured Logger** | 所有关键节点 | 只记录，不阻断 |

### 3. 幂等性（Idempotency）

```
同个请求执行多次 = 执行一次的效果
核心：request_id → sha256 → 缓存结果
适用：发邮件、扣款、写文件（不可逆操作）
```

### 4. Circuit Breaker 状态机

```
CLOSED → 连续失败 N 次 → OPEN → 等待恢复时间 → HALF_OPEN → 尝试成功 → CLOSED
                                                              → 尝试失败 → OPEN
```

**推荐参数**：failureThreshold=5, recoveryTimeout=60s, halfOpenMaxRequests=3

### 5. 指数退避 + Jitter

```
第 1 次重试：等待 1-2s  (baseDelay × jitter × 2⁰)
第 2 次重试：等待 2-4s  (baseDelay × jitter × 2¹)
第 3 次重试：等待 4-8s  (baseDelay × jitter × 2²)

jitter ±50% → 防止"惊群效应"
```

### 6. 三级权限

| 等级 | 行为 | 适用工具 |
|------|------|---------|
| Read | 自动执行 | search, read_file |
| Write | Dry-run + 确认 | send_email, write_file |
| Dangerous | 警告 + 二次确认 | delete_file, execute_command |

### 7. 结构化日志

```typescript
// JSON Lines 格式——每行一个 JSON 对象，便于程序分析
// grep "tool_call" events.jsonl | jq '.'
// grep "error" events.jsonl | wc -l
```

---

## 动手练习记录

### 练习 1：Cost Guard

```
设置了多少成本上限？_________
超限后 Agent 表现？_________
```

### 练习 2：Circuit Breaker

```
熔断阈值设了多少？_________
恢复时间设了多少？_________
熔断后 Agent 怎么降级的？_________
```

### 练习 3：权限分级

```
我分配了哪些权限？
- read: _________
- write: _________
- dangerous: _________
```

### 练习 4：Idempotency

```
重复调用幂等工具，结果是否相同？_________
```

### 练习 5：Observability

```
结构化日志记录了哪些事件？_________
日志文件有多大？_________
```

---

## 代码快照

```
phases/phase-6-security-reliability/
├── src/
│   ├── index.ts
│   └── reliability/
│       ├── idempotency.ts
│       ├── circuit_breaker.ts
│       ├── rate_limiter.ts
│       ├── cost_guard.ts
│       ├── permission.ts
│       └── logger.ts
```

---

## 自测清单

- [ ] 我能解释幂等性对工具调用的重要性
- [ ] 我能手写 Circuit Breaker 状态机
- [ ] 我能实现指数退避 + jitter，并说出 jitter 的作用
- [ ] 我知道 Cost Guard 应该在 Loop 的什么位置检查
- [ ] 我能设计三级权限体系
- [ ] 我知道结构化日志应该记录哪些事件
- [ ] 我能用 JSONL 日志做回放分析
- [ ] 我能说出六件套的编排顺序和理由

---

## 疑问/困惑

```

```

---

## 下一步

Phase 6 完成后 → 进入 Phase 7：LangChain.js 深度实战（🎯 毕业篇）
