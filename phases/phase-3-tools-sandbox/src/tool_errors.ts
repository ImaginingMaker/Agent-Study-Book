/**
 * Tool 错误层次结构
 *
 * 定义了工具调用过程中可能出现的各类错误，以及统一的错误处理函数。
 */

/**
 * Tool 错误基类
 */
export class ToolError extends Error {
  override name = "ToolError";

  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, ToolError.prototype);
  }
}

/**
 * 工具未找到错误
 */
export class ToolNotFoundError extends ToolError {
  override name = "ToolNotFoundError";

  constructor(toolName: string) {
    super(`工具 "${toolName}" 未注册`);
    Object.setPrototypeOf(this, ToolNotFoundError.prototype);
  }
}

/**
 * 工具超时错误
 */
export class ToolTimeoutError extends ToolError {
  override name = "ToolTimeoutError";

  constructor(toolName: string, timeoutMs: number) {
    super(`工具 "${toolName}" 执行超时（${timeoutMs}ms）`);
    Object.setPrototypeOf(this, ToolTimeoutError.prototype);
  }
}

/**
 * 工具参数校验错误
 */
export class ToolParameterError extends ToolError {
  override name = "ToolParameterError";

  constructor(toolName: string, reason: string) {
    super(`工具 "${toolName}" 参数错误：${reason}`);
    Object.setPrototypeOf(this, ToolParameterError.prototype);
  }
}

/**
 * 工具权限错误
 */
export class ToolPermissionError extends ToolError {
  override name = "ToolPermissionError";

  constructor(toolName: string, reason: string) {
    super(`工具 "${toolName}" 权限不足：${reason}`);
    Object.setPrototypeOf(this, ToolPermissionError.prototype);
  }
}

/**
 * 工具执行错误
 */
export class ToolExecutionError extends ToolError {
  override name = "ToolExecutionError";

  constructor(toolName: string, cause: string) {
    super(`工具 "${toolName}" 执行失败：${cause}`);
    Object.setPrototypeOf(this, ToolExecutionError.prototype);
  }
}

/**
 * 统一处理 Tool 错误，返回用户可读的错误信息
 */
export function handleToolError(error: ToolError): string {
  if (error instanceof ToolNotFoundError) {
    return `🔍 ${error.message}。请检查工具名称是否正确。`;
  }
  if (error instanceof ToolTimeoutError) {
    return `⏱️ ${error.message}。请检查工具是否有死循环或等待时间过长。`;
  }
  if (error instanceof ToolParameterError) {
    return `⚙️ ${error.message}。请检查传入的参数格式和类型。`;
  }
  if (error instanceof ToolPermissionError) {
    return `🔒 ${error.message}。请联系管理员获取相应权限。`;
  }
  if (error instanceof ToolExecutionError) {
    return `💥 ${error.message}。请检查依赖服务是否正常运行。`;
  }
  return `❌ 未知工具错误：${error.message}`;
}
