/**
 * Tool 选择策略
 *
 * 提供多种策略从 ToolRegistry 中选择合适的工具：关键词匹配、LLM 智能选择、规则映射。
 */

import { ToolSpec } from "./tool_registry.js";

/**
 * 工具选择器的抽象基类
 */
export abstract class ToolSelector {
  /**
   * 从给定工具列表中选择匹配的工具
   */
  abstract select(input: string, tools: ToolSpec[]): Promise<ToolSpec[]>;
}

/**
 * 关键词选择器 — 通过关键词匹配工具描述和名称
 */
export class KeywordSelector extends ToolSelector {
  private readonly maxResults: number;

  constructor(maxResults = 5) {
    super();
    this.maxResults = maxResults;
  }

  /**
   * 将输入拆分为关键词，匹配工具的名称和描述
   */
  async select(input: string, tools: ToolSpec[]): Promise<ToolSpec[]> {
    const keywords = this.extractKeywords(input);
    if (keywords.length === 0) {
      return [];
    }

    const scored = tools
      .map((tool) => ({
        tool,
        score: this.calculateScore(tool, keywords),
      }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score);

    return scored.slice(0, this.maxResults).map((entry) => entry.tool);
  }

  /**
   * 将输入文本拆分为关键词（中文和英文）
   */
  private extractKeywords(input: string): string[] {
    const cleaned = input.toLowerCase().replace(/[^\w\u4e00-\u9fff]+/g, " ");
    return cleaned.split(/\s+/).filter((kw) => kw.length > 0);
  }

  /**
   * 计算工具与关键词的匹配分数
   */
  private calculateScore(tool: ToolSpec, keywords: string[]): number {
    let score = 0;
    const searchTarget = `${tool.name} ${tool.description} ${tool.parameters.map((p) => p.name).join(" ")}`.toLowerCase();

    for (const kw of keywords) {
      if (tool.name.toLowerCase().includes(kw)) {
        score += 10;
      }
      if (tool.description.toLowerCase().includes(kw)) {
        score += 5;
      }
      for (const param of tool.parameters) {
        if (param.name.toLowerCase().includes(kw) || param.description.toLowerCase().includes(kw)) {
          score += 2;
        }
      }
      // 模糊匹配：词出现在搜索目标中
      if (searchTarget.includes(kw)) {
        score += 1;
      }
    }

    return score;
  }
}

/**
 * LLM 选择器 — 通过模拟 LLM 调用选择工具（模拟实现）
 *
 * 生产环境可替换为真实的 LLM API 调用。
 */
export class LLMSelector extends ToolSelector {
  /**
   * 模拟 LLM 选择：将工具列表格式化为文本，模拟 LLM 返回匹配结果
   */
  async select(input: string, tools: ToolSpec[]): Promise<ToolSpec[]> {
    const toolListText = tools
      .map(
        (t, i) =>
          `${i + 1}. "${t.name}": ${t.description}` +
          `（参数：${t.parameters.map((p) => `${p.name}: ${p.type}${p.required ? "（必填）" : ""}`).join("，")}）`,
      )
      .join("\n");

    const prompt = `用户输入：${input}\n\n可用工具：\n${toolListText}\n\n请选择最匹配的工具名称，返回格式：["tool_name"]`;

    // 模拟 LLM 响应：关键词匹配后取最高分
    const selector = new KeywordSelector(1);
    const result = await selector.select(input, tools);

    console.log(`[LLMSelector] 模拟 LLM 调用`);
    console.log(`  Prompt: ${prompt.slice(0, 80)}...`);
    console.log(
      `  选择结果: ${result.length > 0 ? result.map((t) => t.name).join(", ") : "无"}`,
    );

    return result;
  }
}

/**
 * 规则选择器 — 根据阶段名称映射到固定工具集
 */
export class RuleSelector extends ToolSelector {
  private readonly phaseToolMap: Record<string, string[]>;

  /**
   * @param phaseToolMap 阶段到工具名称列表的映射
   */
  constructor(phaseToolMap?: Record<string, string[]>) {
    super();
    this.phaseToolMap = phaseToolMap ?? {
      "需求分析": ["search", "list_skills"],
      "PRD 生成": ["search", "calculator"],
      "技术规格": ["search", "calculator"],
      "架构设计": ["list_skills", "search"],
      "组件设计": ["search"],
      "代码实现": ["calculator", "search"],
      "代码审查": ["search", "list_skills"],
      "评测": ["calculator"],
    };
  }

  /**
   * 根据阶段名称选择绑定的工具
   */
  async select(input: string, tools: ToolSpec[]): Promise<ToolSpec[]> {
    const toolNames = this.phaseToolMap[input];
    if (!toolNames || toolNames.length === 0) {
      return [];
    }

    const toolMap = new Map(tools.map((t) => [t.name, t]));
    return toolNames
      .map((name) => toolMap.get(name))
      .filter((t): t is ToolSpec => t !== undefined);
  }
}
