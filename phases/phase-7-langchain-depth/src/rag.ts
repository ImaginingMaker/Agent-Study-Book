/**
 * RAG — LangChain.js 检索增强生成
 *
 * 使用 RecursiveCharacterTextSplitter 分块、FakeEmbeddings 向量化、
 * 自定义向量搜索实现 RAG 流程。
 */

import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { FakeEmbeddings } from "@langchain/core/utils/testing";
import { Document } from "@langchain/core/documents";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { FakeListChatModel } from "@langchain/core/utils/testing";

export interface RAGResult {
  answer: string;
  sources: string[];
}

export class RAGPipeline {
  private splitter: RecursiveCharacterTextSplitter;
  private embeddings: FakeEmbeddings;
  private docs: Document[] = [];
  private vectors: number[][] = [];

  constructor() {
    this.splitter = new RecursiveCharacterTextSplitter({ chunkSize: 60, chunkOverlap: 10 });
    this.embeddings = new FakeEmbeddings();
  }

  async index(texts: string[], source?: string): Promise<void> {
    const documents = await this.splitter.createDocuments(
      texts.map((t) => t),
      undefined,
      { chunkHeader: "" },
    );

    for (const doc of documents) {
      doc.metadata = { source: source ?? "unknown" };
      this.docs.push(doc);
      const vec = await this.embeddings.embedQuery(doc.pageContent);
      this.vectors.push(vec);
    }
  }

  async search(query: string, k = 2): Promise<Document[]> {
    const queryVec = await this.embeddings.embedQuery(query);

    const scored = this.docs
      .map((doc, i) => ({
        doc,
        score: this.cosineSimilarity(queryVec, this.vectors[i]),
      }))
      .sort((a, b) => b.score - a.score);

    return scored.slice(0, k).map((e) => e.doc);
  }

  async query(question: string): Promise<RAGResult> {
    const relevantDocs = await this.search(question, 2);
    const context = relevantDocs.map((d) => d.pageContent).join("\n\n");

    const model = new FakeListChatModel({
      responses: [`基于检索结果：${context.slice(0, 50)}...`],
    });

    const prompt = ChatPromptTemplate.fromMessages([
      ["system", "基于以下上下文回答问题：\n{context}"],
      ["human", "{question}"],
    ]);

    const chain = prompt.pipe(model);
    const result = await chain.invoke({ context, question });

    const answer = typeof result.content === "string"
      ? result.content
      : JSON.stringify(result.content);

    return {
      answer,
      sources: relevantDocs.map((d) => String(d.metadata.source ?? "unknown")),
    };
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0, na = 0, nb = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      na += a[i] * a[i];
      nb += b[i] * b[i];
    }
    const mag = Math.sqrt(na) * Math.sqrt(nb);
    return mag === 0 ? 0 : dot / mag;
  }

  get documentCount(): number {
    return this.docs.length;
  }
}
