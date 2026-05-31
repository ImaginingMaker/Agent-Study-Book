import { appendFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";

export type LogEventType = "llm_call" | "tool_call" | "error" | "cost_check" | "permission_check";

export interface LogEntry {
  timestamp: string;
  eventType: LogEventType;
  data: Record<string, unknown>;
}

const EVENT_ICONS: Record<LogEventType, string> = {
  llm_call: "🧠",
  tool_call: "✅",
  error: "❌",
  cost_check: "💰",
  permission_check: "🔒",
};

export class StructuredLogger {
  private logPath: string;
  private buffer: LogEntry[] = [];
  private autoFlushThreshold: number;

  /**
   * @param logPath - Path to the JSONL log file
   * @param autoFlushThreshold - Number of entries to buffer before auto-flushing (default 1)
   */
  constructor(logPath: string, autoFlushThreshold: number = 1) {
    this.logPath = logPath;
    this.autoFlushThreshold = autoFlushThreshold;
  }

  /**
   * Ensure the log directory exists.
   */
  private async ensureDir(): Promise<void> {
    const dir = dirname(this.logPath);
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }
  }

  /**
   * Write a log entry. Outputs human-readable format to console and JSONL to file.
   */
  async log(eventType: LogEventType, data: Record<string, unknown>): Promise<void> {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      eventType,
      data,
    };

    const icon = EVENT_ICONS[eventType] ?? "📝";
    console.log(`${icon} [${entry.timestamp}] ${eventType}: ${JSON.stringify(data)}`);

    this.buffer.push(entry);

    if (this.buffer.length >= this.autoFlushThreshold) {
      await this.flush();
    }
  }

  /**
   * Flush buffered entries to the log file in JSONL format.
   */
  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    await this.ensureDir();

    const lines = this.buffer.map((entry) => JSON.stringify(entry)).join("\n") + "\n";
    await appendFile(this.logPath, lines, "utf-8");
    this.buffer = [];
  }

  /**
   * Get the current log file path.
   */
  getLogPath(): string {
    return this.logPath;
  }

  /**
   * Get the number of unsaved entries in the buffer.
   */
  get bufferSize(): number {
    return this.buffer.length;
  }
}
