/**
 * Search Service with Vector Embeddings
 * Provides semantic search using pre-computed embeddings
 */

import axiosInstance from '../utils/axiosInstance'
import { fetchWithAuth } from '../utils/fetchWithAuth';


export interface SearchHit {
  document_id: string;
  title: string;
  content_snippet: string;
  score: number;
  version?: string;
  tab?: string;
  group?: string;
  page_name?: string;
  metadata?: Record<string, any>;
}

export interface SearchResponse {
  success: boolean;
  hits: SearchHit[];
  total_results: number;
  error_message?: string | null;
}


class SearchService {
  private controller:AbortController|null=null
  constructor() {
  }

  async search(query: string, maxResults: number = 10,onData:(result:SearchResponse)=>void,onFinished:()=>void): Promise<any> {
    if (!!this.controller) this.controller!.abort();
      this.controller = new AbortController();
    if (!query.trim()) {
      return []
    }

   const body:any = {query,limit:maxResults}
   const cfg = await buildAxiosConfig("/search",body);

   console.log('[Search] Making request to:', cfg.baseURL + cfg.url)
   console.log('[Search] Body:', body)

    const response = await fetchWithAuth(cfg.baseURL + cfg.url,{
      method: cfg.method,
      headers: cfg.headers,
      body: JSON.stringify(body),
      signal: this.controller.signal
    });
    console.log('[Search] Response status:', response.status)
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer:string|undefined = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done){
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const parts:any = buffer!.split("\n");
      buffer = parts.pop();

      for (const line of parts) {
          try{

          if(line.startsWith('event:')){
            continue
          }

          console.log('[Search] Line:', line)
          const parsed = JSON.parse(line.startsWith('data:')?line.replace('data:',''):line)
          console.log('[Search] Parsed:', parsed)
          if ( Object.keys(parsed).includes("score")){
              onData({
                  success: true,
                  hits: [parsed],
                  total_results: 1,
               })
            }else{
              onData({
                  success: false,
                  hits: [],
                  error_message: "Failed to load data",
                  total_results: 0,
              });
          }
          }catch(err:any){
            console.log('[Search] Error parsing:', err)
            onData({
                success: false,
                hits: [],
                error_message: err.message || "Failed to load data",
                total_results: 0,
            });
          }
      }
    }
    onFinished()
  }

}



export async function buildAxiosConfig(url:string, body:any) {
  const fakeAdapter = async (config:any) => {
    return Promise.reject({ config });
  };
  const tmpConfig = await axiosInstance.post(url, body, {
    adapter:fakeAdapter,
    transformRequest: v => v
  }).catch(err => err.config);

  return tmpConfig;
}


export const searchService = new SearchService()
export type { SearchResponse as SearchResult }
