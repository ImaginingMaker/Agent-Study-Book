/**
 * Callbacks — LangChain.js 回调系统
 *
 * 使用 ConsoleCallbackHandler 和自定义回调监控 LLM 调用、链执行和工具调用。
 */

import { ConsoleCallbackHandler } from "@langchain/core/tracers/console";
import { FakeListChatModel } from "@langchain/core/utils/testing";
import { HumanMessage } from "@langchain/core/messages";

export async function runWithCallbacks(): Promise<void> {
  const model = new FakeListChatModel({ responses: ["这是带回调的响应。"] });
  const consoleHandler = new ConsoleCallbackHandler();

  const result = await model.invoke(
    [new HumanMessage("测试回调")],
    { callbacks: [consoleHandler] },
  );

  const text = typeof result.content === "string"
    ? result.content
    : JSON.stringify(result.content);
  console.log(`  LLM 输出: ${text}`);
}
