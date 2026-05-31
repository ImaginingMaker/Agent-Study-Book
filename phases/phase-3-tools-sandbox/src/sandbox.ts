/**
 * Tool 沙箱执行环境
 *
 * 提供安全的脚本执行、文件读写能力，带有路径白名单、超时和输出大小限制。
 */

import { spawn } from "node:child_process";
import { readFile, writeFile, access } from "node:fs/promises";
import { constants } from "node:fs";
import { resolve, normalize } from "node:path";

/**
 * 沙箱配置选项
 */
export interface SandboxOptions {
  allowedPaths: string[];
  allowedCommands?: string[];
  maxOutputSize: number;
  timeout: number;
}

/**
 * 沙箱执行结果
 */
export interface SandboxResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  durationMs: number;
}

/**
 * Tool 沙箱 — 安全的命令执行和文件操作环境
 */
export class ToolSandbox {
  readonly allowedPaths: string[];
  readonly allowedCommands: string[];
  readonly maxOutputSize: number;
  readonly timeout: number;

  constructor(options?: Partial<SandboxOptions>) {
    this.allowedPaths = options?.allowedPaths ?? [];
    this.allowedCommands = options?.allowedCommands ?? ["node", "python3", "tsx"];
    this.maxOutputSize = options?.maxOutputSize ?? 1024 * 100; // 100KB
    this.timeout = options?.timeout ?? 30_000; // 30s
  }

  /**
   * 在沙箱中执行脚本
   *
   * 通过 child_process.spawn 隔离执行，带有超时和输出大小控制。
   */
  async runScript(
    script: string,
    options?: {
      command?: string;
      args?: string[];
    },
  ): Promise<SandboxResult> {
    const command = options?.command ?? "node";
    const args = options?.args ?? ["-e", script];

    if (!this.allowedCommands.includes(command)) {
      return {
        stdout: "",
        stderr: `命令 "${command}" 不在允许列表中（允许：${this.allowedCommands.join(", ")}）`,
        exitCode: 1,
        durationMs: 0,
      };
    }

    const startMs = Date.now();

    return new Promise<SandboxResult>((resolvePromise) => {
      const child = spawn(command, args, {
        stdio: ["pipe", "pipe", "pipe"],
        timeout: this.timeout,
      });

      let stdout = "";
      let stderr = "";
      let stdoutTruncated = false;
      let stderrTruncated = false;

      const timer = setTimeout(() => {
        child.kill("SIGTERM");
      }, this.timeout);

      child.stdout?.on("data", (chunk: Buffer) => {
        if (stdout.length < this.maxOutputSize) {
          stdout += chunk.toString("utf-8");
          if (stdout.length > this.maxOutputSize) {
            stdout = stdout.slice(0, this.maxOutputSize);
            stdoutTruncated = true;
          }
        }
      });

      child.stderr?.on("data", (chunk: Buffer) => {
        if (stderr.length < this.maxOutputSize) {
          stderr += chunk.toString("utf-8");
          if (stderr.length > this.maxOutputSize) {
            stderr = stderr.slice(0, this.maxOutputSize);
            stderrTruncated = true;
          }
        }
      });

      child.on("close", (exitCode) => {
        clearTimeout(timer);
        const durationMs = Date.now() - startMs;
        let finalStdout = stdout;
        let finalStderr = stderr;
        if (stdoutTruncated) {
          finalStdout += "\n...（输出超过大小限制，已截断）";
        }
        if (stderrTruncated) {
          finalStderr += "\n...（输出超过大小限制，已截断）";
        }
        resolvePromise({
          stdout: finalStdout,
          stderr: finalStderr,
          exitCode,
          durationMs,
        });
      });

      child.on("error", (err) => {
        clearTimeout(timer);
        const durationMs = Date.now() - startMs;
        resolvePromise({
          stdout,
          stderr: `进程错误：${err.message}`,
          exitCode: 1,
          durationMs,
        });
      });
    });
  }

  /**
   * 安全的文件读取 — 检查文件路径是否在白名单内
   */
  async readFile(filePath: string): Promise<string> {
    const resolvedPath = this.resolvePath(filePath);
    this.assertPathAllowed(resolvedPath);

    try {
      await access(resolvedPath, constants.R_OK);
    } catch {
      throw new Error(`文件 "${resolvedPath}" 不存在或不可读`);
    }

    return await readFile(resolvedPath, "utf-8");
  }

  /**
   * 安全的文件写入 — 检查文件路径是否在白名单内
   */
  async writeFile(filePath: string, content: string): Promise<void> {
    const resolvedPath = this.resolvePath(filePath);
    this.assertPathAllowed(resolvedPath);
    await writeFile(resolvedPath, content, "utf-8");
  }

  /**
   * 规范化并解析文件路径
   */
  private resolvePath(filePath: string): string {
    return normalize(resolve(filePath));
  }

  /**
   * 断言路径在允许路径白名单内
   */
  private assertPathAllowed(resolvedPath: string): void {
    if (this.allowedPaths.length === 0) {
      return; // 空白名单 = 不限制
    }

    const allowed = this.allowedPaths.some((allowedPath) => {
      const resolvedAllowed = normalize(resolve(allowedPath));
      return resolvedPath.startsWith(resolvedAllowed);
    });

    if (!allowed) {
      throw new Error(
        `路径 "${resolvedPath}" 不在允许的白名单中（允许路径：${this.allowedPaths.join(", ")}）`,
      );
    }
  }
}
