import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

export type PermissionLevel = "read" | "write" | "dangerous";

export interface PermissionCheckResult {
  approved: boolean;
  mode: "auto" | "dry_run" | "confirmed" | "rejected";
}

export type ConfirmFn = (prompt: string) => Promise<boolean>;

/**
 * Default interactive confirmation using readline.
 */
async function defaultConfirm(prompt: string): Promise<boolean> {
  const rl = createInterface({ input, output });
  try {
    const answer = await rl.question(`${prompt} (y/N) `);
    return answer.trim().toLowerCase() === "y";
  } finally {
    rl.close();
  }
}

function defaultConfirmSync(): boolean {
  return false;
}

export class PermissionManager {
  private permissions: Map<string, PermissionLevel>;
  private confirmFn: ConfirmFn;

  /**
   * @param confirmFn - Optional custom confirm function (for testing, pass () => Promise.resolve(true))
   */
  constructor(confirmFn?: ConfirmFn) {
    this.permissions = new Map();
    this.confirmFn = confirmFn ?? defaultConfirm;
  }

  /**
   * Register or update the permission level for a tool.
   */
  registerToolPermission(toolName: string, level: PermissionLevel): void {
    this.permissions.set(toolName, level);
  }

  /**
   * Remove a tool's permission registration.
   */
  unregisterToolPermission(toolName: string): void {
    this.permissions.delete(toolName);
  }

  /**
   * Get the permission level for a tool. Returns "read" if not explicitly registered.
   */
  getPermissionLevel(toolName: string): PermissionLevel {
    return this.permissions.get(toolName) ?? "read";
  }

  /**
   * Check whether a tool call is permitted.
   *
   * - read: auto approved
   * - write: dry-run preview + confirm prompt
   * - dangerous: strict confirm
   */
  async checkPermission(
    toolName: string,
    params: Record<string, unknown>,
  ): Promise<PermissionCheckResult> {
    const level = this.getPermissionLevel(toolName);

    if (level === "read") {
      return { approved: true, mode: "auto" };
    }

    if (level === "write") {
      const preview = JSON.stringify(params, null, 2);
      const ok = await this.confirmFn(
        `[Dry-Run] Tool: ${toolName}\nParams:\n${preview}\n\nProceed?`,
      );
      return { approved: ok, mode: ok ? "dry_run" : "rejected" };
    }

    // dangerous
    const preview = JSON.stringify(params, null, 2);
    const ok = await this.confirmFn(
      `[DANGEROUS] Tool: ${toolName}\nParams:\n${preview}\n\nType 'yes' to confirm:`,
    );
    return { approved: ok, mode: ok ? "confirmed" : "rejected" };
  }

  /**
   * Replace the confirm function (useful for tests).
   */
  setConfirmFn(fn: ConfirmFn): void {
    this.confirmFn = fn;
  }
}
