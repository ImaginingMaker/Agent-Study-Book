/**
 * Tool Registry — 工具注册与调用中心
 *
 * 管理所有可用工具的注册、查询和调用，包含参数校验、超时控制、调用记录。
 */

import {
  ToolError,
  ToolNotFoundError,
  ToolTimeoutError,
  ToolParameterError,
  ToolPermissionError,
  ToolExecutionError,
} from "./tool_errors.js";

/**
 * 工具参数定义
 */
export interface ToolParameter {
  name: string;
  type: "string" | "number" | "boolean" | "object" | "array";
  description: string;
  required: boolean;
}

/**
 * 工具规格 — 定义工具的完整元信息
 */
export interface ToolSpec {
  name: string;
  description: string;
  parameters: ToolParameter[];
  returns: string;
  fn: (params: Record<string, unknown>) => Promise<unknown> | unknown;
  timeout?: number;
  permission?: string;
}

/**
 * 工具调用记录
 */
export interface ToolCallRecord {
  toolName: string;
  params: Record<string, unknown>;
  result: unknown;
  startedAt: Date;
  durationMs: number;
  success: boolean;
  error?: string;
}

/**
 * 创建 ToolSpec 的工厂函数
 */
export function createToolSpec(spec: ToolSpec): ToolSpec {
  if (!spec.name || spec.name.trim().length === 0) {
    throw new ToolError("工具名称不能为空");
  }
  if (!spec.description || spec.description.trim().length === 0) {
    throw new ToolError(`工具 "${spec.name}" 的描述不能为空`);
  }
  if (typeof spec.fn !== "function") {
    throw new ToolError(`工具 "${spec.name}" 必须提供 fn 实现`);
  }
  return { ...spec };
}

/**
 * Tool Registry — 注册、查询和调用工具
 */
export class ToolRegistry {
  private tools: Map<string, ToolSpec> = new Map();
  private records: ToolCallRecord[] = [];
  private readonly maxRecords: number;

  constructor(maxRecords = 100) {
    this.maxRecords = maxRecords;
  }

  /**
   * 注册一个工具
   */
  register(spec: ToolSpec): void {
    const tool = createToolSpec(spec);
    if (this.tools.has(tool.name)) {
      console.warn(`⚠️ 工具 "${tool.name}" 被重复注册，将覆盖原有定义`);
    }
    this.tools.set(tool.name, tool);
  }

  /**
   * 根据名称获取工具
   */
  get(name: string): ToolSpec | undefined {
    return this.tools.get(name);
  }

  /**
   * 列出所有已注册的工具
   */
  listTools(): ToolSpec[] {
    return Array.from(this.tools.values());
  }

  /**
   * 调用工具
   *
   * 执行参数校验、权限检查、超时控制，并记录调用日志。
   */
  async call(
    name: string,
    params: Record<string, unknown>,
    context?: { permission?: string },
  ): Promise<unknown> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new ToolNotFoundError(name);
    }

    this.validateParams(tool, params);

    if (tool.permission && context?.permission !== tool.permission) {
      throw new ToolPermissionError(
        name,
        `需要权限 "${tool.permission}"，但当前上下文未提供`,
      );
    }

    const startedAt = new Date();
    const startMs = Date.now();

    try {
      const result = await this.executeWithTimeout(tool, params, startMs);
      const durationMs = Date.now() - startMs;
      this.addRecord({
        toolName: name,
        params,
        result,
        startedAt,
        durationMs,
        success: true,
      });
      return result;
    } catch (error) {
      const durationMs = Date.now() - startMs;
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.addRecord({
        toolName: name,
        params,
        result: null,
        startedAt,
        durationMs,
        success: false,
        error: errorMessage,
      });
      throw error;
    }
  }

  /**
   * 获取调用历史记录
   */
  getRecords(): ToolCallRecord[] {
    return [...this.records];
  }

  /**
   * 清空调用历史记录
   */
  clearRecords(): void {
    this.records = [];
  }

  /**
   * 校验参数是否符合工具规格
   */
  private validateParams(
    tool: ToolSpec,
    params: Record<string, unknown>,
  ): void {
    for (const param of tool.parameters) {
      if (param.required && !(param.name in params)) {
        throw new ToolParameterError(tool.name, `缺少必填参数 "${param.name}"`);
      }
      if (param.name in params) {
        const value = params[param.name];
        if (!this.isTypeMatch(value, param.type)) {
          throw new ToolParameterError(
            tool.name,
            `参数 "${param.name}" 期望类型 ${param.type}，收到 ${typeof value}`,
          );
        }
      }
    }
  }

  /**
   * 检查值是否匹配期望的类型
   */
  private isTypeMatch(value: unknown, expectedType: string): boolean {
    switch (expectedType) {
      case "string":
        return typeof value === "string";
      case "number":
        return typeof value === "number";
      case "boolean":
        return typeof value === "boolean";
      case "object":
        return (
          typeof value === "object" && value !== null && !Array.isArray(value)
        );
      case "array":
        return Array.isArray(value);
      default:
        return true;
    }
  }

  /**
   * 带超时控制的工具执行
   */
  private executeWithTimeout(
    tool: ToolSpec,
    params: Record<string, unknown>,
    startMs: number,
  ): Promise<unknown> {
    const timeoutMs = tool.timeout ?? 30_000;

    if (timeoutMs <= 0) {
      return Promise.resolve(tool.fn(params));
    }

    const remaining = timeoutMs - (Date.now() - startMs);
    if (remaining <= 0) {
      return Promise.reject(new ToolTimeoutError(tool.name, timeoutMs));
    }

    // Single Promise pattern: setTimeout directly rejects the returned promise.
    // Avoids Promise.race which can cause unhandled rejection warnings in some environments.
    return new Promise<unknown>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new ToolTimeoutError(tool.name, timeoutMs));
      }, remaining);

      Promise.resolve(tool.fn(params)).then(
        (result) => {
          clearTimeout(timeoutId);
          resolve(result);
        },
        (error) => {
          clearTimeout(timeoutId);
          reject(error);
        },
      );
    });
  }

  /**
   * 添加调用记录，自动裁剪超出上限的记录
   */
  private addRecord(record: ToolCallRecord): void {
    this.records.push(record);
    if (this.records.length > this.maxRecords) {
      this.records.shift();
    }
  }
}
