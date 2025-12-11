import type { ChatContext } from '../components/ChatSidebar';
import {buildAxiosConfig} from './searchService'



export interface AIStreamResponse {
  chunk_index:number;
  answer_chunk:string;
  is_final: boolean;
}

class AIStreamService {
  private controller: AbortController | null = null;

  constructor() {}

  async askToAI(
    question:string,
    context:ChatContext[],
    onData: (msg: AIStreamResponse) => void,
    onFinished: () => void
  ){
    await this.stream('/ai/answer',{question,context},onData,onFinished)
  }


  async editWithAI(
    question:string,
    context:ChatContext[],
    onData: (msg: AIStreamResponse) => void,
    onFinished: () => void
  ){
    await this.stream('/ai/edit',{question,context},onData,onFinished)
  }

  async stream(
    url: string,
    body: any,
    onData: (msg: AIStreamResponse) => void,
    onFinished: () => void
  ) {
    // Cancel previous session
    if (this.controller) this.controller.abort();
    this.controller = new AbortController();

    const cfg = await buildAxiosConfig(url, body);

    const response = await fetch(cfg.baseURL + cfg.url, {
      method: cfg.method,
      headers: cfg.headers,
      body: JSON.stringify(body),
      signal: this.controller.signal
    });

    if (!response.ok) {
      onData({
        chunk_index:-1,
        answer_chunk:"there was an error responding your request",
        is_final:true
      });
      onFinished();
      return;
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const parts = buffer.split("\n");
        buffer = parts.pop() || "";

        for (const line of parts) {
          if (!line.trim()) continue;

          if (line.startsWith("event:")) continue;

          if (line.startsWith("data:")) {
            const payload = line.replace("data:", "").trim();

            try{
            const realMessage:AIStreamResponse = JSON.parse(payload)
            onData(realMessage);
            if (realMessage.is_final){
              onFinished();
            }
            }catch(err){
              console.log("[Chat Error]: ",err)
            }

          }
        }
      }
    } catch (err: any) {
      onData({
        chunk_index:-1,
        answer_chunk:"there was an error responding your request",
        is_final:true
      });
    }

    onFinished();
  }

  cancel() {
    if (this.controller) {
      this.controller.abort();
      this.controller = null;
    }
  }
}


export const aiStreamService = new AIStreamService();

