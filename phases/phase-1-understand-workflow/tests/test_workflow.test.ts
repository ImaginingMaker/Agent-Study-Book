/**
 * 测试 Phase 1 Workflow 生命周期引擎
 */

import { describe, it, expect } from "vitest";
import { WorkflowEngine, createDefaultWorkflow } from "../src/workflow.js";

describe("WorkflowEngine", () => {
  it("should create workflow with default stages", () => {
    const wf = createDefaultWorkflow();
    expect(wf.stages).toHaveLength(8);
    expect(wf.stages[0].name).toBe("需求分析");
    expect(wf.stages[7].name).toBe("评测");
  });

  it("should initialize all stages as pending", () => {
    const wf = createDefaultWorkflow();
    for (const stage of wf.stages) {
      expect(stage.status).toBe("pending");
    }
  });

  it("should report correct progress", async () => {
    const engine = new WorkflowEngine(createDefaultWorkflow());
    expect(engine.progress).toBe("0/8");

    engine.definition.stages[0].status = "completed";
    expect(engine.progress).toBe("1/8");
  });

  it("should return current stage", () => {
    const engine = new WorkflowEngine(createDefaultWorkflow());
    expect(engine.currentStage?.name).toBe("需求分析");
  });

  it("should run through workflow stages", async () => {
    const engine = new WorkflowEngine(createDefaultWorkflow());
    const completedStages: string[] = [];

    engine.on((event) => {
      if (event.type === "stage:after" && event.status === "completed") {
        completedStages.push(event.stageName);
      }
    });

    await engine.start();

    expect(completedStages.length).toBeGreaterThanOrEqual(1);
    expect(completedStages[0]).toBe("需求分析");
  });

  it("should call lifecycle hooks in order", async () => {
    const engine = new WorkflowEngine(createDefaultWorkflow());
    const events: string[] = [];

    engine.on((event) => {
      events.push(event.type);
    });

    await engine.start();

    expect(events[0]).toBe("workflow:start");
    expect(events[1]).toBe("stage:before");
    expect(events[events.length - 1]).toBe("workflow:complete");
  });

  it("should provide I/O contract definition", () => {
    const engine = new WorkflowEngine(createDefaultWorkflow());
    const io = engine.ioContract;

    expect(io.input).toHaveProperty("userRequest");
    expect(io.input).toHaveProperty("context");
    expect(io.input).toHaveProperty("history");
    expect(io.output).toHaveProperty("response");
    expect(io.output).toHaveProperty("stageResult");
    expect(io.output).toHaveProperty("nextAction");
  });
});
