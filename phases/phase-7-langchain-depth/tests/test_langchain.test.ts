/**
 * 测试 Phase 7 LangChain.js 深度实战
 */

import { describe, it, expect } from "vitest";
import { FakeListChatModel } from "@langchain/core/utils/testing";
import { InMemoryChatMessageHistory } from "@langchain/core/chat_history";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { DynamicTool } from "@langchain/core/tools";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { FakeEmbeddings } from "@langchain/core/utils/testing";
import { RunnableSequence, RunnablePassthrough, RunnableParallel } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ConsoleCallbackHandler } from "@langchain/core/tracers/console";
import { ConversationMemory, createMemoryChain } from "../src/memory.js";
import { RAGPipeline } from "../src/rag.js";

describe("Agent (createReactAgent)", () => {
  it("should create agent with tools", async () => {
    const model = new FakeListChatModel({
      responses: ["最终答案: 42"],
    });

    const tool = new DynamicTool({
      name: "test_tool",
      description: "a test tool",
      func: async (input: string) => `processed: ${input}`,
    });

    const agent = await createReactAgent({ llm: model, tools: [tool] });
    expect(agent).toBeDefined();
  });
});

describe("ConversationMemory (InMemoryChatMessageHistory)", () => {
  it("should store and retrieve messages", async () => {
    const history = new InMemoryChatMessageHistory();
    await history.addMessage(new HumanMessage("hello"));
    await history.addMessage(new AIMessage("world"));

    const messages = await history.getMessages();
    expect(messages).toHaveLength(2);
    expect(messages[0].content).toBe("hello");
    expect(messages[1].content).toBe("world");
  });

  it("should clear messages", async () => {
    const history = new InMemoryChatMessageHistory();
    await history.addMessage(new HumanMessage("test"));
    await history.clear();
    const messages = await history.getMessages();
    expect(messages).toHaveLength(0);
  });

  it("should format context", async () => {
    const memory = new ConversationMemory();
    await memory.addMessage(new HumanMessage("hi"));
    await memory.addMessage(new AIMessage("hello"));

    const context = await memory.formatContext();
    expect(context).toContain("human: hi");
    expect(context).toContain("ai: hello");
    expect(await memory.getMessageCount()).toBe(2);
  });
});

describe("FakeListChatModel", () => {
  it("should return configured responses", async () => {
    const model = new FakeListChatModel({ responses: ["response-1", "response-2"] });

    const r1 = await model.invoke([new HumanMessage("test")]);
    expect(r1.content).toBe("response-1");

    const r2 = await model.invoke([new HumanMessage("test")]);
    expect(r2.content).toBe("response-2");
  });
});

describe("LCEL (RunnableSequence)", () => {
  it("should chain prompt and model", async () => {
    const prompt = ChatPromptTemplate.fromMessages([
      ["human", "Say: {input}"],
    ]);
    const model = new FakeListChatModel({ responses: ["hello"] });
    const chain = prompt.pipe(model);

    const result = await chain.invoke({ input: "hi" });
    expect(result.content).toBe("hello");
  });

  it("should support RunnableParallel", async () => {
    const model = new FakeListChatModel({ responses: ["A", "B"] });
    const prompt = ChatPromptTemplate.fromMessages([["human", "{input}"]]);

    const parallel = RunnableParallel.from({
      a: prompt.pipe(model).pipe(new StringOutputParser()),
      b: prompt.pipe(model).pipe(new StringOutputParser()),
    });

    const result = await parallel.invoke({ input: "test" });
    expect(result.a).toBe("A");
    expect(result.b).toBe("B");
  });

  it("should support RunnablePassthrough", async () => {
    const passthrough = new RunnablePassthrough();
    const result = await passthrough.invoke({ key: "value" });
    expect(result).toEqual({ key: "value" });
  });
});

describe("RAG (Retrieval)", () => {
  it("should index and search documents", async () => {
    const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 50, chunkOverlap: 10 });
    const docs = await splitter.createDocuments(["Agent is an autonomous program"]);
    expect(docs.length).toBeGreaterThanOrEqual(1);
  });

  it("RAGPipeline should answer questions", async () => {
    const rag = new RAGPipeline();
    await rag.index(["Agent is an autonomous program"], "test.md");
    expect(rag.documentCount).toBeGreaterThanOrEqual(1);

    const result = await rag.query("agent");
    expect(result.answer).toBeTruthy();
    expect(result.sources).toContain("test.md");
  });
});

describe("FakeEmbeddings", () => {
  it("should return fixed-dimension vectors", async () => {
    const embeddings = new FakeEmbeddings();
    const vec = await embeddings.embedQuery("test text");
    expect(vec.length).toBe(4);
    expect(vec[0]).toBe(0.1);
  });
});

describe("ConsoleCallbackHandler", () => {
  it("should be constructable", () => {
    const handler = new ConsoleCallbackHandler();
    expect(handler).toBeDefined();
    expect(handler.name).toBeDefined();
  });
});
