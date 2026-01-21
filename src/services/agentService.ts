import { fetchWithAuth, getDashboardUrl } from '../utils/fetchWithAuth'
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
    results:any,
    currentLocation: { version: string; tab: string; group: string },
    onData: (msg: AIStreamResponse) => void,
    onFinished: () => void
  ){
    await this.stream('/ai/edit',{
      edit_prompt: question,
      content: "",
      context,
      chat_resume,
      todo_list,
      results,
      current_version: currentLocation.version,
      current_tab: currentLocation.tab,
      current_group: currentLocation.group
    },onData,onFinished)
  }

  async stream(
    url: string,
    body: any,
    onData: (msg: AIStreamResponse) => void,
    onFinished: () => void
  ) {
    // Cancel previous session
    if (this.controller) {
      this.controller.abort();
    }
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

            try {
              const realMessage:AIStreamResponse = JSON.parse(payload)
              onData(realMessage);
              if (realMessage.is_final){
                onFinished();
              }
            } catch(err) {
              // Server sent a non-JSON error message, display it to the user
              console.log("[Chat Error]: ", err)

              let errorMessage = payload || "An error occurred while processing your request";

              // Check for AI generation limit error
              if (payload && payload.includes("AI generation limit reached")) {
                const upgradeUrl = getDashboardUrl('/organization/billing')
                errorMessage = `⚠️ **AI generation limit reached**\n\nYou've reached your plan's AI usage limit. [Upgrade your plan](${upgradeUrl}) to continue using AI features.`;
              }

              onData({
                chunk_index: -1,
                answer_chunk: errorMessage,
                is_final: true,
                message_type: "text"
              });
              onFinished();
              return;
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

