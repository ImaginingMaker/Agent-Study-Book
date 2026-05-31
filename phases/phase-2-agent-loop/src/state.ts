/**
 * Agent 状态管理
 */

import { readFile, writeFile, unlink, access } from "node:fs/promises";
import { constants } from "node:fs";

export interface AgentStateData {
  phase: string;
  userInput: string;
  history: Array<[string, string]>;
  toolResults: Record<string, unknown>;
  maxSteps: number;
  currentStep: number;
}

export class AgentState implements AgentStateData {
  phase: string;
  userInput: string;
  history: Array<[string, string]>;
  toolResults: Record<string, unknown>;
  maxSteps: number;
  currentStep: number;

  constructor(data?: Partial<AgentStateData>) {
    this.phase = data?.phase ?? "需求分析";
    this.userInput = data?.userInput ?? "";
    this.history = data?.history ?? [];
    this.toolResults = data?.toolResults ?? {};
    this.maxSteps = data?.maxSteps ?? 10;
    this.currentStep = data?.currentStep ?? 0;
  }

  toJSON(): Record<string, unknown> {
    return {
      phase: this.phase,
      history: this.history.slice(-20),
      maxSteps: this.maxSteps,
      currentStep: this.currentStep,
    };
  }

  static fromJSON(data: Record<string, unknown>): AgentState {
    return new AgentState({
      phase: (data.phase as string) ?? "需求分析",
      history: (data.history as Array<[string, string]>) ?? [],
      maxSteps: (data.maxSteps as number) ?? 10,
      currentStep: (data.currentStep as number) ?? 0,
    });
  }
}

export class StateStore {
  path: string;

  constructor(path = "agent_state.json") {
    this.path = path;
  }

  async save(state: AgentState): Promise<void> {
    const json = JSON.stringify(state.toJSON(), null, 2);
    await writeFile(this.path, json, "utf-8");
  }

  async load(): Promise<AgentState | null> {
    try {
      await access(this.path, constants.F_OK);
    } catch {
      return null;
    }
    const raw = await readFile(this.path, "utf-8");
    const data = JSON.parse(raw) as Record<string, unknown>;
    return AgentState.fromJSON(data);
  }

  async clear(): Promise<void> {
    try {
      await unlink(this.path);
    } catch {
      // File doesn't exist; nothing to clear
    }
  }
}
