/**
 * LCEL — LangChain Expression Language
 *
 * 使用 RunnableSequence、ChatPromptTemplate 等真实 LangChain API
 * 演示声明式链式组合。
 */

import {
  RunnableSequence,
  RunnablePassthrough,
  RunnableParallel,
} from "@langchain/core/runnables";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { FakeListChatModel } from "@langchain/core/utils/testing";

export class LCELDemo {
  static createBasicChain() {
    const prompt = ChatPromptTemplate.fromMessages([
      ["system", "你是一个翻译助手。将以下文本翻译成中文。"],
      ["human", "{input}"],
    ]);

    const model = new FakeListChatModel({
      responses: ["翻译结果：你好，世界！"],
    });

    const parser = new StringOutputParser();

    return {
      chain: prompt.pipe(model).pipe(parser),
      async run(input: string): Promise<string> {
        return this.chain.invoke({ input });
      },
    };
  }

  static createParallelChain() {
    const model = new FakeListChatModel({
      responses: ["摘要: Agent 是自主程序", "关键词: Agent, LLM, 工具"],
    });

    const summaryPrompt = ChatPromptTemplate.fromMessages([
      ["human", "总结: {text}"],
    ]);
    const keywordPrompt = ChatPromptTemplate.fromMessages([
      ["human", "提取关键词: {text}"],
    ]);

    const parallel = RunnableParallel.from({
      summary: summaryPrompt.pipe(model).pipe(new StringOutputParser()),
      keywords: keywordPrompt.pipe(model).pipe(new StringOutputParser()),
    });

    return {
      chain: parallel,
      async run(text: string): Promise<Record<string, unknown>> {
        const result = await this.chain.invoke({ text });
        return result as Record<string, unknown>;
      },
    };
  }

  static createPassthroughChain() {
    const model = new FakeListChatModel({
      responses: ["处理完成！"],
    });

    const prompt = ChatPromptTemplate.fromMessages([["human", "{input}"]]);

    // RunnablePassthrough 透传原始输入，另一个分支预处理
    // 最后合并为 prompt 所需的 {input} 结构
    const chain = RunnableSequence.from([
      {
        original: new RunnablePassthrough<string>(),
        processed: (input: string) => `预处理: ${input}`,
      },
      // 合并为 prompt 期望的格式
      (obj: { original: string; processed: string }) => ({
        input: `原始: ${obj.original} | ${obj.processed}`,
      }),
      prompt,
      model,
      new StringOutputParser(),
    ]);

    return {
      chain,
      async run(input: string): Promise<string> {
        return chain.invoke(input);
      },
    };
  }
}
