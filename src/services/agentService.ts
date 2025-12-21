import { fetchWithAuth } from '../utils/fetchWithAuth'
import {buildAxiosConfig} from './searchService'

export interface ChatContext {
  id: string
  type: 'text' | 'file' | 'intention' | 'tool_result'
  content?: string
  fileName?: string
  headingId?:string
}



export interface ToolCall {
  tool_call: {
    name: string;
    arguments: Record<string, any>;
  };
}

export interface AIStreamResponse {
  chunk_index:number;
  answer_chunk:string | ToolCall;
  message_type:"chat_resume"|"text"|"tool_call";
  is_final: boolean;
}

class AIStreamService {
  private controller: AbortController | null = null;

  constructor() {}


  async askToAI(
    question:string,
    context:ChatContext[],
    chat_resume:string,
    onData: (msg: AIStreamResponse) => void,
    onFinished: () => void
  ){
    await this.stream('/ai/answer',{question,context,chat_resume},onData,onFinished)
  }


  async editWithAI(
    question:string,
    context:ChatContext[],
    chat_resume:string,
    todo_list:string,
    results:Map<string,any>,
    onData: (msg: AIStreamResponse) => void,
    onFinished: () => void
  ){
    await this.stream('/ai/edit',{edit_prompt:question,content:"",context,chat_resume,todo_list,results:Object.fromEntries(results)},onData,onFinished)
  }

  async stream(
    url: string,
    body: any,
    onData: (msg: AIStreamResponse) => void,
    onFinished: () => void
  ) {
    // Cancel previous session
    this.controller = new AbortController();

    const cfg = await buildAxiosConfig(url, body);

    const response = await fetchWithAuth(cfg.baseURL + cfg.url,{
      method: 'POST',
      headers: {
          ...(cfg.headers || {}),
          "Content-Type": "application/json",
        },
      body: JSON.stringify(body),
      signal: this.controller.signal
    })

    if (!response.ok) {
      onData({
        chunk_index:-1,
        answer_chunk:"there was an error responding your request",
        is_final:true,
        message_type:"text"
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
        is_final:true,
        message_type:"text"
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

