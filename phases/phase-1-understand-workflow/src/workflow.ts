/**
 * Workflow 生命周期引擎
 *
 * 演示 Agent 工作流的生命周期管理：阶段定义、状态转换、生命周期钩子。
 */

export type StageStatus = "pending" | "running" | "completed" | "failed" | "skipped";

export interface Stage {
  name: string;
  description: string;
  status: StageStatus;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

export type WorkflowEvent =
  | { type: "stage:before"; stageName: string }
  | { type: "stage:after"; stageName: string; status: StageStatus }
  | { type: "stage:error"; stageName: string; error: string }
  | { type: "workflow:start" }
  | { type: "workflow:complete"; status: "success" | "failure" };

export type LifecycleHook = (event: WorkflowEvent, workflow: WorkflowEngine) => void | Promise<void>;

export interface WorkflowDefinition {
  name: string;
  description: string;
  stages: Stage[];
}

export interface IODefinition {
  input: Record<string, string>;
  output: Record<string, string>;
}

export class WorkflowEngine {
  readonly definition: WorkflowDefinition;
  private hooks: LifecycleHook[] = [];
  private currentIndex = 0;

  constructor(definition: WorkflowDefinition) {
    this.definition = definition;
  }

  on(hook: LifecycleHook): void {
    this.hooks.push(hook);
  }

  get currentStage(): Stage | undefined {
    return this.definition.stages[this.currentIndex];
  }

  get progress(): string {
    const total = this.definition.stages.length;
    const done = this.definition.stages.filter((s) => s.status === "completed" || s.status === "skipped").length;
    return `${done}/${total}`;
  }

  private async emit(event: WorkflowEvent): Promise<void> {
    for (const hook of this.hooks) {
      await hook(event, this);
    }
  }

  async start(): Promise<void> {
    await this.emit({ type: "workflow:start" });

    for (let i = 0; i < this.definition.stages.length; i++) {
      this.currentIndex = i;
      const stage = this.definition.stages[i];

      if (stage.status === "skipped") {
        continue;
      }

      stage.status = "running";
      stage.startedAt = new Date();
      await this.emit({ type: "stage:before", stageName: stage.name });

      try {
        await this.executeStage(stage);
        stage.status = "completed";
        stage.completedAt = new Date();
        await this.emit({ type: "stage:after", stageName: stage.name, status: "completed" });
      } catch (error) {
        stage.status = "failed";
        stage.error = error instanceof Error ? error.message : String(error);
        await this.emit({ type: "stage:error", stageName: stage.name, error: stage.error });
        await this.emit({ type: "workflow:complete", status: "failure" });
        return;
      }
    }

    await this.emit({ type: "workflow:complete", status: "success" });
  }

  private async executeStage(stage: Stage): Promise<void> {
    // 模拟阶段执行：实际 Agent 中这里会调用 LLM 或工具
    const delay = Math.random() * 100 + 50;
    await new Promise((resolve) => setTimeout(resolve, delay));

    if (stage.name === "评测" && Math.random() < 0.3) {
      throw new Error("评测未通过：准确率低于阈值");
    }
  }

  get ioContract(): IODefinition {
    return {
      input: {
        userRequest: "用户的原始需求描述",
        context: "当前会话上下文",
        history: "历史消息记录",
      },
      output: {
        response: "Agent 回复内容",
        stageResult: "当前阶段产出物",
        nextAction: "下一步建议操作",
      },
    };
  }
}

export function createDefaultWorkflow(): WorkflowDefinition {
  return {
    name: "Agent 开发工作流",
    description: "从需求到交付的完整 Agent 开发流程",
    stages: [
      { name: "需求分析", description: "澄清用户需求，定义问题边界", status: "pending" },
      { name: "PRD 生成", description: "编写产品需求文档", status: "pending" },
      { name: "技术规格", description: "定义 API 和数据模型", status: "pending" },
      { name: "架构设计", description: "划分模块边界", status: "pending" },
      { name: "组件设计", description: "设计组件树和状态方案", status: "pending" },
      { name: "代码实现", description: "编写实际代码", status: "pending" },
      { name: "代码审查", description: "审查代码质量", status: "pending" },
      { name: "评测", description: "验证产出质量", status: "pending" },
    ],
  };
}
