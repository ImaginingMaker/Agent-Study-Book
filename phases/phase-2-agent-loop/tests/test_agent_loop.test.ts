/**
 * 测试 Phase 2 Agent Loop 核心逻辑
 */

import { describe, it, expect } from "vitest";
import { mkdtempSync } from "node:fs";
import { mkdtemp, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { classifyIntent } from "../src/intent_classifier.js";
import { AgentState, StateStore } from "../src/state.js";

describe("classifyIntent", () => {
  it("should classify query_phase intent", () => {
    expect(classifyIntent("我在哪个阶段")).toBe("query_phase");
    expect(classifyIntent("当前进度")).toBe("query_phase");
    expect(classifyIntent("状态如何")).toBe("query_phase");
  });

  it("should classify next_step intent", () => {
    expect(classifyIntent("下一步做什么")).toBe("next_step");
    expect(classifyIntent("然后呢")).toBe("next_step");
    expect(classifyIntent("接下来怎么做")).toBe("next_step");
  });

  it("should classify execute_phase intent", () => {
    expect(classifyIntent("帮我做这件事")).toBe("execute_phase");
    expect(classifyIntent("开始生成 PRD")).toBe("execute_phase");
    expect(classifyIntent("写代码")).toBe("execute_phase");
  });

  it("should classify help intent", () => {
    expect(classifyIntent("帮助我")).toBe("help");
    expect(classifyIntent("help")).toBe("help");
    expect(classifyIntent("怎么用")).toBe("help");
  });

  it("should classify exit intent", () => {
    expect(classifyIntent("退出")).toBe("exit");
    expect(classifyIntent("exit")).toBe("exit");
    expect(classifyIntent("结束")).toBe("exit");
  });

  it("should classify unknown intent", () => {
    expect(classifyIntent("今天天气不错")).toBe("unknown");
    expect(classifyIntent("")).toBe("unknown");
  });
});

describe("AgentState", () => {
  it("should have default values", () => {
    const state = new AgentState();
    expect(state.phase).toBe("需求分析");
    expect(state.currentStep).toBe(0);
    expect(state.maxSteps).toBe(10);
    expect(state.userInput).toBe("");
    expect(state.history).toEqual([]);
    expect(state.toolResults).toEqual({});
  });

  it("should accept partial data", () => {
    const state = new AgentState({ phase: "技术规格", currentStep: 2 });
    expect(state.phase).toBe("技术规格");
    expect(state.currentStep).toBe(2);
    expect(state.maxSteps).toBe(10); // default
  });

  it("should serialize and deserialize correctly", () => {
    const state = new AgentState({ phase: "PRD 生成", currentStep: 3 });
    state.history.push(["user", "测试输入"]);
    state.history.push(["agent", "测试回复"]);

    const json = state.toJSON();
    expect(json.phase).toBe("PRD 生成");
    expect(json.currentStep).toBe(3);
    expect(json.history).toEqual([["user", "测试输入"], ["agent", "测试回复"]]);

    const restored = AgentState.fromJSON(json);
    expect(restored.phase).toBe("PRD 生成");
    expect(restored.currentStep).toBe(3);
    expect(restored.history).toEqual([["user", "测试输入"], ["agent", "测试回复"]]);
  });
});

describe("StateStore", () => {
  it("should save and load state", async () => {
    const tmpDir = mkdtempSync(join(tmpdir(), "agent-state-test-"));
    const path = join(tmpDir, "test_state.json");
    const store = new StateStore(path);

    const state = new AgentState({ phase: "技术规格", currentStep: 2 });
    await store.save(state);

    const loaded = await store.load();
    expect(loaded).not.toBeNull();
    expect(loaded!.phase).toBe("技术规格");
    expect(loaded!.currentStep).toBe(2);
  });

  it("should return null for non-existent file", async () => {
    const store = new StateStore("nonexistent_file.json");
    const result = await store.load();
    expect(result).toBeNull();
  });

  it("should clear state file", async () => {
    const tmpDir = mkdtempSync(join(tmpdir(), "agent-state-test-"));
    const path = join(tmpDir, "test_state.json");
    const store = new StateStore(path);

    await store.save(new AgentState());
    // Verify file exists after save
    const loaded = await store.load();
    expect(loaded).not.toBeNull();

    await store.clear();
    const afterClear = await store.load();
    expect(afterClear).toBeNull();
  });
});
