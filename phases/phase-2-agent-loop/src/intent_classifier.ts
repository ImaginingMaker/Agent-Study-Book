/**
 * 意图分类器 — 关键词匹配
 */

const INTENTS: Map<string, string> = new Map([
  ["query_phase", "查询当前阶段"],
  ["next_step", "询问下一步做什么"],
  ["execute_phase", "执行当前阶段的操作"],
  ["help", "显示帮助信息"],
  ["exit", "退出程序"],
  ["unknown", "无法理解的输入"],
]);

export function classifyIntent(userInput: string): string {
  const text = userInput.trim().toLowerCase();

  if (["退出", "结束", "exit", "quit", "bye"].some((kw) => text.includes(kw))) {
    return "exit";
  }
  if (["帮助", "help", "怎么用", "命令", "支持"].some((kw) => text.includes(kw))) {
    return "help";
  }
  if (["在哪", "阶段", "到哪里", "进度", "状态"].some((kw) => text.includes(kw))) {
    return "query_phase";
  }
  if (["下一步", "然后", "接下来", "后面", "继续"].some((kw) => text.includes(kw))) {
    return "next_step";
  }
  if (["开始", "帮我", "执行", "做", "生成", "写"].some((kw) => text.includes(kw))) {
    return "execute_phase";
  }

  return "unknown";
}

export function getIntentDescription(): string {
  const lines: string[] = ["📋 可用命令："];
  for (const [intent, desc] of INTENTS) {
    lines.push(`  · 说 '${desc}' → 触发 ${intent}`);
  }
  return lines.join("\n");
}
