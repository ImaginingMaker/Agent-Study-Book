/**
 * Tool Registry 单元测试
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import {
  ToolRegistry,
  createToolSpec,
  type ToolSpec,
  type ToolCallRecord,
} from "../src/tool_registry.js";
import {
  ToolError,
  ToolNotFoundError,
  ToolParameterError,
  ToolPermissionError,
  ToolExecutionError,
  ToolTimeoutError,
  handleToolError,
} from "../src/tool_errors.js";

afterEach(() => {
  vi.restoreAllMocks();
});

function createMockTool(overrides?: Partial<ToolSpec>): ToolSpec {
  return createToolSpec({
    name: "test_tool",
    description: "用于测试的工具",
    parameters: [
      { name: "input", type: "string", description: "输入文本", required: true },
      { name: "count", type: "number", description: "数量", required: false },
    ],
    returns: "处理结果",
    fn: (params: Record<string, unknown>) => {
      return `处理完成：${String(params.input)}`;
    },
    ...overrides,
  });
}

describe("createToolSpec", () => {
  it("should create a valid tool spec", () => {
    const spec = createMockTool();
    expect(spec.name).toBe("test_tool");
    expect(spec.description).toBe("用于测试的工具");
    expect(spec.parameters).toHaveLength(2);
  });

  it("should throw for empty name", () => {
    expect(() =>
      createToolSpec({
        name: "",
        description: "test",
        parameters: [],
        returns: "void",
        fn: () => "ok",
      }),
    ).toThrow(ToolError);
  });

  it("should throw for empty description", () => {
    expect(() =>
      createToolSpec({
        name: "test",
        description: "",
        parameters: [],
        returns: "void",
        fn: () => "ok",
      }),
    ).toThrow(ToolError);
  });

  it("should throw if fn is not a function", () => {
    expect(() =>
      createToolSpec({
        name: "test",
        description: "desc",
        parameters: [],
        returns: "void",
        fn: "not_a_function" as unknown as () => unknown,
      }),
    ).toThrow(ToolError);
  });
});

describe("ToolRegistry", () => {
  it("should register and retrieve a tool", () => {
    const registry = new ToolRegistry();
    const spec = createMockTool();
    registry.register(spec);

    const retrieved = registry.get("test_tool");
    expect(retrieved).toBeDefined();
    expect(retrieved!.name).toBe("test_tool");
  });

  it("should return undefined for non-existent tool", () => {
    const registry = new ToolRegistry();
    expect(registry.get("nonexistent")).toBeUndefined();
  });

  it("should list all registered tools", () => {
    const registry = new ToolRegistry();

    registry.register(createMockTool({ name: "tool_a", description: "工具 A" }));
    registry.register(createMockTool({ name: "tool_b", description: "工具 B" }));

    const list = registry.listTools();
    expect(list).toHaveLength(2);
    expect(list.map((t) => t.name).sort()).toEqual(["tool_a", "tool_b"]);
  });

  it("should call a tool with valid params", async () => {
    const registry = new ToolRegistry();
    const fn = vi.fn().mockReturnValue("mocked result");
    registry.register(createMockTool({ fn }));

    const result = await registry.call("test_tool", { input: "hello" });
    expect(result).toBe("mocked result");
    expect(fn).toHaveBeenCalledWith({ input: "hello" });
  });

  it("should throw ToolNotFoundError for non-existent tool", async () => {
    const registry = new ToolRegistry();
    await expect(registry.call("ghost_tool", {})).rejects.toThrow(ToolNotFoundError);
  });

  it("should throw ToolParameterError for missing required param", async () => {
    const registry = new ToolRegistry();
    registry.register(createMockTool());

    await expect(registry.call("test_tool", {})).rejects.toThrow(ToolParameterError);
  });

  it("should throw ToolParameterError for wrong param type", async () => {
    const registry = new ToolRegistry();
    registry.register(createMockTool());

    await expect(
      registry.call("test_tool", { input: "ok", count: "not_a_number" }),
    ).rejects.toThrow(ToolParameterError);
  });

  it("should throw ToolPermissionError when permission mismatches", async () => {
    const registry = new ToolRegistry();
    registry.register(createMockTool({ permission: "admin" }));

    await expect(
      registry.call("test_tool", { input: "hello" }, { permission: "user" }),
    ).rejects.toThrow(ToolPermissionError);
  });

  it("should allow call when permission matches", async () => {
    const registry = new ToolRegistry();
    registry.register(createMockTool({ permission: "admin" }));

    const result = await registry.call("test_tool", { input: "hello" }, { permission: "admin" });
    expect(result).toBe("处理完成：hello");
  });

  it("should throw ToolTimeoutError when tool times out", async () => {
    vi.useFakeTimers();

    const registry = new ToolRegistry();
    registry.register(
      createMockTool({
        timeout: 100,
        fn: () => {
          return new Promise((resolve) => {
            setTimeout(() => resolve("too late"), 200);
          });
        },
      }),
    );

    const callPromise = registry.call("test_tool", { input: "hello" });

    await vi.advanceTimersByTimeAsync(150);

    await expect(callPromise).rejects.toThrow(ToolTimeoutError);

    vi.useRealTimers();
  });

  it("should handle async tools that return a promise", async () => {
    const registry = new ToolRegistry();
    registry.register(
      createMockTool({
        fn: async (params: Record<string, unknown>) => {
          return `async result: ${String(params.input)}`;
        },
      }),
    );

    const result = await registry.call("test_tool", { input: "world" });
    expect(result).toBe("async result: world");
  });

  it("should record call history", async () => {
    const registry = new ToolRegistry();
    registry.register(createMockTool());
    registry.register(
      createMockTool({
        name: "failing_tool",
        fn: () => {
          throw new Error("oops");
        },
      }),
    );

    await registry.call("test_tool", { input: "ok" });
    await expect(registry.call("failing_tool", { input: "bad" })).rejects.toThrow();

    const records = registry.getRecords();
    expect(records).toHaveLength(2);
    expect(records[0].toolName).toBe("test_tool");
    expect(records[0].success).toBe(true);
    expect(records[1].toolName).toBe("failing_tool");
    expect(records[1].success).toBe(false);
    expect(records[1].error).toBe("oops");
  });

  it("should clear records", () => {
    const registry = new ToolRegistry();
    registry.register(createMockTool());

    // Manually add a record (private, but we can call a tool then check)
    expect(registry.getRecords()).toHaveLength(0);
    registry.clearRecords();
    expect(registry.getRecords()).toHaveLength(0);
  });

  it("should warn on duplicate registration", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const registry = new ToolRegistry();

    registry.register(createMockTool());
    registry.register(createMockTool({ fn: () => "overwritten" }));

    expect(warnSpy).toHaveBeenCalledOnce();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("重复注册"),
    );
  });

  it("should limit the number of records", async () => {
    const registry = new ToolRegistry(3);

    for (const name of ["a", "b", "c", "d"]) {
      registry.register(
        createMockTool({
          name,
          fn: () => name,
        }),
      );
    }

    for (const name of ["a", "b", "c", "d"]) {
      await registry.call(name, { input: "x" });
    }

    expect(registry.getRecords()).toHaveLength(3);
    expect(registry.getRecords()[0].toolName).toBe("b"); // "a" was shifted out
  });
});

describe("handleToolError", () => {
  it("should format ToolNotFoundError", () => {
    const msg = handleToolError(new ToolNotFoundError("search"));
    expect(msg).toContain("未注册");
  });

  it("should format ToolTimeoutError", () => {
    const msg = handleToolError(new ToolTimeoutError("search", 5000));
    expect(msg).toContain("超时");
  });

  it("should format ToolParameterError", () => {
    const msg = handleToolError(new ToolParameterError("greet", "缺少必填参数"));
    expect(msg).toContain("参数错误");
  });

  it("should format ToolPermissionError", () => {
    const msg = handleToolError(new ToolPermissionError("admin_tool", "需要 admin 权限"));
    expect(msg).toContain("权限不足");
  });

  it("should format ToolExecutionError", () => {
    const msg = handleToolError(new ToolExecutionError("api", "网络错误"));
    expect(msg).toContain("执行失败");
  });
});
