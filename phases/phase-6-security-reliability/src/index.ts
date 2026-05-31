import { IdempotencyGuard } from "./reliability/idempotency.js";
import { CircuitBreaker, CircuitBreakerOpenError } from "./reliability/circuit_breaker.js";
import { retryWithBackoff, RateLimitError, ProviderRouter } from "./reliability/rate_limiter.js";
import { CostGuard, CostConfig } from "./reliability/cost_guard.js";
import { PermissionManager, PermissionLevel } from "./reliability/permission.js";
import { StructuredLogger } from "./reliability/logger.js";
import { tmpdir } from "node:os";
import { join } from "node:path";

async function main() {
  console.log("=".repeat(60));
  console.log("Phase 6 — 生产级可靠性 组件演示");
  console.log("=".repeat(60));

  const logger = new StructuredLogger(join(tmpdir(), "phase6-demo.jsonl"));

  // ── 1. IdempotencyGuard ──────────────────────────────────────────
  console.log("\n" + "-".repeat(40));
  console.log("1. IdempotencyGuard — 幂等性保护");
  console.log("-".repeat(40));

  const idempotency = new IdempotencyGuard(60_000);
  let callCount = 0;
  const computeFn = async () => {
    callCount++;
    return `result-${callCount}`;
  };

  const r1 = await idempotency.tryExecute("compute", { x: 1 }, "req-1", computeFn);
  console.log(`Call #1: cached=${r1.cached}, result=${r1.result}`);
  const r2 = await idempotency.tryExecute("compute", { x: 1 }, "req-1", computeFn);
  console.log(`Call #2 (same key): cached=${r2.cached}, result=${r2.result}`);
  console.log(`Total executions: ${callCount} (expected 1)`);
  console.log(`Dangerous tool 'delete_file': ${idempotency.requireConfirmation("delete_file")}`);

  // ── 2. CircuitBreaker ────────────────────────────────────────────
  console.log("\n" + "-".repeat(40));
  console.log("2. CircuitBreaker — 断路器");
  console.log("-".repeat(40));

  const breaker = new CircuitBreaker(3, 2000);
  let attempts = 0;

  for (let i = 0; i < 5; i++) {
    attempts++;
    try {
      await breaker.call(async () => {
        throw new Error("Simulated failure");
      });
    } catch (err: unknown) {
      if (err instanceof CircuitBreakerOpenError) {
        console.log(`Attempt ${attempts}: Circuit OPEN — request rejected`);
        break;
      }
      console.log(`Attempt ${attempts}: Failed (state=${breaker.state}, failures=${breaker.failureCount})`);
    }
  }

  console.log(`State after failures: ${breaker.state}, totalTrips: ${breaker.totalTrips}`);

  // Wait for recovery timeout then test half-open
  console.log("Waiting for recovery timeout...");
  await new Promise((r) => setTimeout(r, 2100));
  console.log(`State after timeout: ${breaker.state}`);

  // ── 3. retryWithBackoff ──────────────────────────────────────────
  console.log("\n" + "-".repeat(40));
  console.log("3. retryWithBackoff — 指数退避重试");
  console.log("-".repeat(40));

  let retryAttempts = 0;
  const flakyFn = async () => {
    retryAttempts++;
    if (retryAttempts < 3) {
      throw new RateLimitError("Rate limited");
    }
    return "success-after-retry";
  };

  const retryResult = await retryWithBackoff(flakyFn, 3, 100);
  console.log(`Retry result: ${retryResult} (attempts: ${retryAttempts})`);

  // ── 4. ProviderRouter ────────────────────────────────────────────
  console.log("\n" + "-".repeat(40));
  console.log("4. ProviderRouter — 多 Provider 回退");
  console.log("-".repeat(40));

  const router = new ProviderRouter([
    {
      name: "provider-a",
      model: "gpt-4",
      async call(p: string) { throw new RateLimitError("Provider A rate limited"); },
    },
    {
      name: "provider-b",
      model: "claude-3",
      async call(p: string) { return `provider-b processed: ${p}`; },
    },
  ]);

  const routerResult = await router.callWithFallback("hello");
  console.log(`Fallback result: provider=${routerResult.provider}, result=${routerResult.result}`);

  // ── 5. CostGuard ─────────────────────────────────────────────────
  console.log("\n" + "-".repeat(40));
  console.log("5. CostGuard — 成本管控");
  console.log("-".repeat(40));

  const costConfig: CostConfig = {
    maxCostPerSession: 0.05,
    maxCostPerTurn: 0.02,
    maxTokensPerSession: 10000,
    alertThreshold: 0.8,
  };
  const costGuard = new CostGuard(costConfig);

  costGuard.checkBeforeTurn();
  costGuard.recordUsage(500, 0.01);
  console.log(`Session cost: $${costGuard.getSessionCost().toFixed(4)}`);
  console.log(`Session tokens: ${costGuard.getSessionTokens()}`);

  costGuard.checkBeforeTurn();
  costGuard.recordUsage(1000, 0.02);
  console.log(`Session cost: $${costGuard.getSessionCost().toFixed(4)}`);

  try {
    costGuard.checkBeforeTurn();
    costGuard.recordUsage(3000, 0.03);
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.log(`Cost limit triggered: ${err.message}`);
    }
  }

  // ── 6. PermissionManager ─────────────────────────────────────────
  console.log("\n" + "-".repeat(40));
  console.log("6. PermissionManager — 权限检查");
  console.log("-".repeat(40));

  const permission = new PermissionManager(async () => true); // auto-confirm for demo
  permission.registerToolPermission("read_file", "read");
  permission.registerToolPermission("write_file", "write");
  permission.registerToolPermission("delete_file", "dangerous");

  const readCheck = await permission.checkPermission("read_file", { path: "/tmp/test.txt" });
  console.log(`Read check: approved=${readCheck.approved}, mode=${readCheck.mode}`);

  const writeCheck = await permission.checkPermission("write_file", { path: "/tmp/test.txt", content: "hello" });
  console.log(`Write check: approved=${writeCheck.approved}, mode=${writeCheck.mode}`);

  const dangerCheck = await permission.checkPermission("delete_file", { path: "/tmp/test.txt" });
  console.log(`Dangerous check: approved=${dangerCheck.approved}, mode=${dangerCheck.mode}`);

  // ── 7. StructuredLogger ──────────────────────────────────────────
  console.log("\n" + "-".repeat(40));
  console.log("7. StructuredLogger — 结构化日志");
  console.log("-".repeat(40));

  await logger.log("llm_call", { model: "gpt-4", prompt: "Hello", tokens: 50 });
  await logger.log("tool_call", { tool: "read_file", params: { path: "/tmp/test.txt" }, duration: 120 });
  await logger.log("cost_check", { sessionCost: 0.03, sessionTokens: 1500 });
  await logger.log("permission_check", { tool: "delete_file", approved: true });
  await logger.log("error", { code: "TIMEOUT", message: "Request timed out", tool: "search" });

  console.log(`\nLog file: ${logger.getLogPath()}`);
  await logger.flush();

  console.log("\n" + "=".repeat(60));
  console.log("演示完成！所有可靠性组件正常工作。");
  console.log("=".repeat(60));
}

main().catch(console.error);
