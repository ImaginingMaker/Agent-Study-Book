/**
 * Phase 3 — LLM 调用 + Tool Calling + 沙箱
 *
 * 演示 ToolRegistry 的注册、调用、错误处理，以及选择器和沙箱的基本用法。
 */

import chalk from "chalk";
import { ToolRegistry, createToolSpec } from "./tool_registry.js";
import { handleToolError, ToolError, ToolNotFoundError, ToolParameterError } from "./tool_errors.js";
import { KeywordSelector, RuleSelector } from "./tool_selector.js";
import { ToolSandbox } from "./sandbox.js";

/**
 * 演示：注册工具并调用
 */
async function demoRegistry(): Promise<void> {
  console.log(chalk.bold("\n📦 Tool Registry 演示\n"));

  const registry = new ToolRegistry();

  registry.register(
    createToolSpec({
      name: "search",
      description: "搜索信息，用于查找文档、代码示例等",
      parameters: [
        { name: "query", type: "string", description: "搜索关键词", required: true },
        { name: "limit", type: "number", description: "结果数量上限", required: false },
      ],
      returns: "搜索结果列表",
      fn: async (params: Record<string, unknown>) => {
        const query = params.query as string;
        const limit = (params.limit as number) ?? 5;
        return `搜索 "${query}" 的结果（最多 ${limit} 条）：示例结果 1、示例结果 2`;
      },
    }),
  );

  registry.register(
    createToolSpec({
      name: "calculator",
      description: "执行数学计算",
      parameters: [
        { name: "expression", type: "string", description: "数学表达式", required: true },
      ],
      returns: "计算结果",
      fn: (params: Record<string, unknown>) => {
        const expression = params.expression as string;
        // 安全：只允许数字和运算符
        const sanitized = expression.replace(/[^0-9+\-*/().%\s]/g, "");
        // eslint-disable-next-line no-eval
        const result = eval(sanitized);
        return `${expression} = ${result}`;
      },
    }),
  );

  registry.register(
    createToolSpec({
      name: "list_skills",
      description: "列出当前可用的开发技能列表",
      parameters: [],
      returns: "技能名称列表",
      fn: async () => {
        return [
          "adfp-requirement-analyzer",
          "adfp-prd-generator",
          "adfp-spec-generator",
          "adfp-architecture-designer",
          "adfp-component-designer",
          "adfp-code-implementer",
          "adfp-code-reviewer",
        ];
      },
    }),
  );

  console.log(chalk.cyan("已注册工具："));
  for (const tool of registry.listTools()) {
    console.log(`  • ${chalk.yellow(tool.name)} — ${tool.description}`);
  }

  // 演示调用
  console.log(chalk.cyan("\n调用 search 工具："));
  const searchResult = await registry.call("search", { query: "TypeScript", limit: 3 });
  console.log(`  ${chalk.green("✓")} 结果：${JSON.stringify(searchResult)}`);

  console.log(chalk.cyan("\n调用 calculator 工具："));
  const calcResult = await registry.call("calculator", { expression: "2 + 3 * 4" });
  console.log(`  ${chalk.green("✓")} 结果：${calcResult}`);

  console.log(chalk.cyan("\n调用 list_skills 工具："));
  const skillsResult = await registry.call("list_skills", {});
  console.log(`  ${chalk.green("✓")} 结果：${JSON.stringify(skillsResult)}`);
}

/**
 * 演示：错误处理
 */
async function demoErrors(): Promise<void> {
  console.log(chalk.bold("\n⚠️ 错误处理演示\n"));

  const registry = new ToolRegistry();

  registry.register(
    createToolSpec({
      name: "greet",
      description: "向用户打招呼",
      parameters: [
        { name: "name", type: "string", description: "用户名", required: true },
      ],
      returns: "问候语",
      fn: (params: Record<string, unknown>) => {
        return `你好，${params.name}！`;
      },
    }),
  );

  // 演示 ToolNotFoundError
  try {
    await registry.call("nonexistent_tool", {});
  } catch (error) {
    if (error instanceof ToolError) {
      console.log(handleToolError(error));
    }
  }

  // 演示 ToolParameterError
  try {
    await registry.call("greet", {});
  } catch (error) {
    if (error instanceof ToolError) {
      console.log(handleToolError(error));
    }
  }

  console.log(chalk.gray("\n调用记录："));
  for (const record of registry.getRecords()) {
    const icon = record.success ? chalk.green("✓") : chalk.red("✗");
    console.log(`  ${icon} ${record.toolName} (${record.durationMs}ms)`);
  }
}

/**
 * 演示：工具选择器
 */
async function demoSelector(): Promise<void> {
  console.log(chalk.bold("\n🎯 Tool 选择器演示\n"));

  const registry = new ToolRegistry();

  for (const tool of [
    createToolSpec({
      name: "search",
      description: "搜索信息和文档",
      parameters: [{ name: "query", type: "string", description: "关键词", required: true }],
      returns: "搜索结果",
      fn: async () => "搜索结果",
    }),
    createToolSpec({
      name: "calculator",
      description: "数学计算",
      parameters: [{ name: "expression", type: "string", description: "表达式", required: true }],
      returns: "计算结果",
      fn: () => "42",
    }),
    createToolSpec({
      name: "list_skills",
      description: "列出可用技能",
      parameters: [],
      returns: "技能列表",
      fn: async () => ["skill-a", "skill-b"],
    }),
  ]) {
    registry.register(tool);
  }

  const tools = registry.listTools();

  // KeywordSelector
  const keywordSelector = new KeywordSelector(2);
  const keywordResult = await keywordSelector.select("帮我搜索一下 TypeScript 的相关资料", tools);
  console.log(chalk.cyan("KeywordSelector 匹配："));
  for (const t of keywordResult) {
    console.log(`  • ${chalk.yellow(t.name)}`);
  }

  // RuleSelector
  const ruleSelector = new RuleSelector();
  const ruleResult = await ruleSelector.select("需求分析", tools);
  console.log(chalk.cyan("\nRuleSelector（需求分析阶段）匹配："));
  for (const t of ruleResult) {
    console.log(`  • ${chalk.yellow(t.name)}`);
  }
}

/**
 * 演示：沙箱执行
 */
async function demoSandbox(): Promise<void> {
  console.log(chalk.bold("\n🔒 沙箱演示\n"));

  const sandbox = new ToolSandbox({
    allowedPaths: ["/tmp"],
    allowedCommands: ["node"],
    maxOutputSize: 1024,
    timeout: 5000,
  });

  // 执行简单脚本
  const result = await sandbox.runScript("console.log('Hello from sandbox!'); console.log('计算:', 1 + 1);");
  console.log(chalk.cyan("脚本执行结果："));
  console.log(`  退出码: ${result.exitCode}`);
  console.log(`  标准输出: ${result.stdout.trim()}`);
  console.log(`  耗时: ${result.durationMs}ms`);

  // 演示路径安全检查
  try {
    await sandbox.readFile("/etc/passwd");
  } catch (error) {
    if (error instanceof Error) {
      console.log(chalk.red(`  路径安全检查生效：${error.message}`));
    }
  }
}

/**
 * 主入口
 */
async function main(): Promise<void> {
  console.log(chalk.bold("🧰 Phase 3：LLM 调用 + Tool Calling + 沙箱"));

  await demoRegistry();
  await demoErrors();
  await demoSelector();
  await demoSandbox();

  console.log(chalk.green("\n✅ 所有演示完成！\n"));
}

main().catch(console.error);
