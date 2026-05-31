# Phase 5 学习笔记：评测 & 可观测性

> 没有评测的 Agent 改进就是"感觉变好了"——用数据说话。
> **技术栈**：TypeScript / Node.js

---

## 我学到了什么？

### 1. Agent 评测 vs 传统测试

| 维度 | 传统测试 | Agent 评测 |
|------|---------|-----------|
| 判定方式 | 断言对/错 | 是否满足需求（统计性） |
| 输出确定性 | 确定 | 非确定（措辞不同但语义等价） |
| 关注点 | 最终结果 | 最终结果 + **调用轨迹** |
| 测试方法 | 单元测试 | Eval Case + 消融实验 |

### 2. Eval Framework 核心类型

```typescript
interface EvalCase {
  id: string;
  category: string;     // normal / edge / tool_failure / context / injection / ...
  input: string;
  expectedOutput?: string;
  expectedToolCalls?: string[];
  scorer?: (actual, expected) => { pass, score, reason };
}

interface EvalResult {
  caseId, pass, score, failureType, failureReason,
  actualOutput, durationMs, tokensUsed, costUsd, trajectoryIndex
}

interface EvalReport {
  totalCases, passedCases, passRate, averageScore,
  totalTokens, totalCostUsd, failureDistribution, categoryStats
}
```

### 3. 八类 Eval Case

| # 分类 | 目的 | 示例 |
|-------|------|------|
| 1 Normal | 核心功能正常 | "北京的天气" → 调用天气工具 |
| 2 Edge | 边界输入 | 空输入、超长文本、特殊字符 |
| 3 Tool Failure | 工具故障处理 | API 超时 → Agent 重试 |
| 4 Context | 长上下文 | 10 轮对话后提问 |
| 5 Injection | 安全注入攻击 | "忽略之前的指令" |
| 6 Permission | 权限拦截 | "删除 /etc/passwd" |
| 7 Recovery | 错误恢复 | 工具报错后恢复正常 |
| 8 Stress | 高负载并发 | 同时 20 个请求 |

### 4. 消融实验

**核心思想**：关掉某个功能，观察性能变化，量化每个模块的贡献。

```typescript
// 对比示例
full          : passRate 80.0% | cost $0.023
no_compress   : passRate 70.0% | cost $0.031 (质量下降 + 成本上升)
no_memory     : passRate 65.0% | cost $0.035 (多轮恢复失败)
small_model   : passRate 55.0% | cost $0.012 (省钱但质量大幅下降)
```

### 5. Trajectory 记录

Trajectory = Agent 执行过程的**完整录像回放**，而不是单张截图。

每一步记录：类型（LLM 调用 / Tool 调用 / 错误）、内容、耗时、Token 数、成本。

---

## 动手练习记录

### 练习 1：写 Eval Case

```
我写了多少条 Eval Case？_________
normal 几条？_________
edge 几条？_________
tool_failure 几条？_________
通过率多少？_________
```

### 练习 2：Trajectory Logger

```
是否能记录每一步？_________
保存的路径是？_________
```

### 练习 3：运行评测

```
总用例数：_________
通过率：_________
主要失败类型：_________
```

### 练习 4：消融实验

```
哪个模块影响最大？_________
Context 压缩提升了多少？_________
关掉记忆后通过率变化？_________
```

---

## 自测清单

- [ ] 我能说出 Agent 评测的三大挑战
- [ ] 我能定义 EvalCase / EvalResult / EvalReport 类型
- [ ] 我能用 EvalRunner 批量跑评测
- [ ] 我能设计覆盖 8 个维度的 Eval Case
- [ ] 我知道消融实验的目的
- [ ] 我能做消融实验并解读结果
- [ ] 我能用 TrajectoryLogger 记录轨迹
- [ ] 我能从评测报告中定位问题
- [ ] 我知道如何根据评测结果优化 Agent

---

## 疑问/困惑

```

```

---

## 下一步

Phase 5 完成后 → 进入 Phase 6：生产级可靠性（把 Agent 从玩具变成产品）
