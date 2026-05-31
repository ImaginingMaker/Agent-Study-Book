/**
 * Trajectory 日志 — Agent 执行轨迹记录
 *
 * 记录 Agent 的每一步操作，用于分析、调试和回放。
 */

import { writeFile, readFile, access } from "node:fs/promises";
import { constants } from "node:fs";

export interface TrajectoryStep {
  step: number;
  type: "thought" | "action" | "observation" | "result";
  content: string;
  timestamp: Date;
  durationMs: number;
  metadata?: Record<string, unknown>;
}

export interface Trajectory {
  id: string;
  sessionId: string;
  startedAt: Date;
  completedAt?: Date;
  steps: TrajectoryStep[];
  totalDurationMs?: number;
  success: boolean;
  tags: string[];
}

export class TrajectoryLogger {
  private trajectories: Trajectory[] = [];
  private currentTrajectory: Trajectory | null = null;
  private currentStep = 0;
  private readonly persistPath: string;

  constructor(persistPath = "trajectories.json") {
    this.persistPath = persistPath;
  }

  start(id: string, sessionId: string, tags: string[] = []): void {
    this.currentTrajectory = {
      id,
      sessionId,
      startedAt: new Date(),
      steps: [],
      success: false,
      tags,
    };
    this.currentStep = 0;
  }

  addStep(type: TrajectoryStep["type"], content: string, metadata?: Record<string, unknown>): void {
    if (!this.currentTrajectory) {
      throw new Error("没有活跃的 trajectory，请先调用 start()");
    }

    this.currentStep++;
    this.currentTrajectory.steps.push({
      step: this.currentStep,
      type,
      content,
      timestamp: new Date(),
      durationMs: 0,
      metadata,
    });
  }

  end(success: boolean): Trajectory {
    if (!this.currentTrajectory) {
      throw new Error("没有活跃的 trajectory");
    }

    const now = new Date();
    this.currentTrajectory.completedAt = now;
    this.currentTrajectory.success = success;
    this.currentTrajectory.totalDurationMs =
      now.getTime() - this.currentTrajectory.startedAt.getTime();

    // 计算每一步的耗时
    for (let i = 1; i < this.currentTrajectory.steps.length; i++) {
      const prev = this.currentTrajectory.steps[i - 1];
      const curr = this.currentTrajectory.steps[i];
      curr.durationMs = curr.timestamp.getTime() - prev.timestamp.getTime();
    }

    const completed = this.currentTrajectory;
    this.trajectories.push(completed);
    this.currentTrajectory = null;
    this.currentStep = 0;

    this.persist().catch(() => {});
    return completed;
  }

  async persist(): Promise<void> {
    await writeFile(this.persistPath, JSON.stringify(this.trajectories, null, 2), "utf-8");
  }

  async load(): Promise<void> {
    try {
      await access(this.persistPath, constants.F_OK);
    } catch {
      return;
    }

    const raw = await readFile(this.persistPath, "utf-8");
    const data = JSON.parse(raw) as Trajectory[];
    this.trajectories.push(
      ...data.map((t) => ({
        ...t,
        startedAt: new Date(t.startedAt),
        completedAt: t.completedAt ? new Date(t.completedAt) : undefined,
        steps: t.steps.map((s) => ({ ...s, timestamp: new Date(s.timestamp) })),
      })),
    );
  }

  getRecent(count = 5): Trajectory[] {
    return this.trajectories.slice(-count);
  }

  getAll(): Trajectory[] {
    return [...this.trajectories];
  }

  formatTrajectory(trajectory: Trajectory): string {
    const lines: string[] = [
      `📋 Trajectory: ${trajectory.id}`,
      `   会话: ${trajectory.sessionId}`,
      `   状态: ${trajectory.success ? "✅ 成功" : "❌ 失败"}`,
      `   步骤数: ${trajectory.steps.length}`,
      `   总耗时: ${trajectory.totalDurationMs}ms`,
      "",
    ];

    for (const step of trajectory.steps) {
      const icon =
        step.type === "thought" ? "💭" :
        step.type === "action" ? "🔧" :
        step.type === "observation" ? "👁" :
        "📌";

      lines.push(`  ${icon} [${step.type}] ${step.content.slice(0, 100)}`);
      if (step.durationMs > 0) {
        lines.push(`     └─ ${step.durationMs}ms`);
      }
    }

    return lines.join("\n");
  }
}
