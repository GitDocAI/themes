/**
 * AI Search Service
 * Handles streaming AI responses and chat history storage
 */

import { getAccessToken, getRefreshToken, setTokens, clearTokens } from '../utils/axiosInstance'

const viteDevDomain = import.meta.env.VITE_DEV_DOMAIN
const viteMode = import.meta.env.VITE_MODE || 'production'

export interface ChatAiContext {
  question: string
  answer: string
}

export interface AIAnswerRequest {
  question: string
  context?: ChatAiContext[]
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const STORAGE_KEY = 'ai_search_chat_history'
const baseUrl = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080/api').replace('/docs', '')

class AISearchService {
  private isRefreshing = false
  private refreshPromise: Promise<string | null> | null = null

  /**
   * Refresh the access token
   */
  private async refreshAccessToken(): Promise<string | null> {
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise
    }

    this.isRefreshing = true
    this.refreshPromise = (async () => {
      try {
        const refreshToken = getRefreshToken()
        if (!refreshToken) {
          throw new Error('No refresh token available')
        }

        const response = await fetch(`${baseUrl}/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refresh_token: refreshToken }),
        })

        if (!response.ok) {
          throw new Error('Refresh token failed')
        }

        const data = await response.json()
        const { access_token, refresh_token: newRefreshToken } = data
        setTokens(access_token, newRefreshToken)
        return access_token
      } catch (error) {
        clearTokens()
        if (viteMode === 'production') {
          window.location.href = '/auth/login'
        } else {
          window.location.href = '/403'
        }
        return null
      } finally {
        this.isRefreshing = false
        this.refreshPromise = null
      }
    })()

    return this.refreshPromise
  }

  /**
   * Build headers for the request
   */
  private buildHeaders(accessToken: string | null): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
    }

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`
    }

    if (viteDevDomain) {
      headers['X-Dev-Domain'] = viteDevDomain
    }

    return headers
  }

  /**
   * Stream AI answer using Server-Sent Events
   * @param question - User's question
   * @param context - Previous chat context
   * @param onChunk - Callback for each streamed chunk
   * @param onComplete - Callback when streaming is complete
   * @param onError - Callback for errors
   */
  async streamAnswer(
    question: string,
    context: ChatAiContext[],
    onChunk: (chunk: string) => void,
    onComplete: (fullResponse: string) => void,
    onError: (error: string) => void
  ): Promise<() => void> {
    const url = `${baseUrl}/docs/ai/answer`

    const body: AIAnswerRequest = {
      question,
      context: context.length > 0 ? context : undefined
    }

    let abortController: AbortController | null = new AbortController()
    let fullResponse = ''

    const executeRequest = async (token: string | null): Promise<Response> => {
      const headers = this.buildHeaders(token)
      return fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: abortController!.signal,
      })
    }

    try {
      let accessToken = getAccessToken()
      let response = await executeRequest(accessToken)

      // Handle 401 - try to refresh token and retry
      if (response.status === 401 && viteMode === 'production') {
        const newToken = await this.refreshAccessToken()
        if (newToken) {
          response = await executeRequest(newToken)
        } else {
          return () => {}
        }
      }

      if (!response.ok) {
        const errorText = await response.text()
        onError(`Error: ${response.status} - ${errorText}`)
        return () => {}
      }

      const reader = response.body?.getReader()
      if (!reader) {
        onError('Failed to get response reader')
        return () => {}
      }

      const decoder = new TextDecoder()

      const readStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read()

            if (done) {
              onComplete(fullResponse)
              break
            }

            const chunk = decoder.decode(value, { stream: true })

            // Parse SSE format: "event: message\ndata: {...}\n\n"
            const lines = chunk.split('\n')
            for (const line of lines) {
              if (line.startsWith('data:')) {
                const data = line.slice(5).trim()
                if (data) {
                  try {
                    const parsed = JSON.parse(data)
                    // Handle format: {"chunk_index": N, "message_type": "text", "answer_chunk": "...", "is_final": false}
                    if (parsed.answer_chunk) {
                      fullResponse += parsed.answer_chunk
                      onChunk(parsed.answer_chunk)
                    } else if (parsed.message || parsed.content || parsed.text) {
                      const text = parsed.message || parsed.content || parsed.text
                      fullResponse += text
                      onChunk(text)
                    } else if (typeof parsed === 'string') {
                      fullResponse += parsed
                      onChunk(parsed)
                    }
                  } catch {
                    // If not JSON, treat as plain text
                    fullResponse += data
                    onChunk(data)
                  }
                }
              }
            }
          }
        } catch (error: any) {
          if (error.name !== 'AbortError') {
            onError(error.message || 'Stream reading error')
          }
        }
      }

      readStream()

    } catch (error: any) {
      if (error.name !== 'AbortError') {
        onError(error.message || 'Failed to connect to AI service')
      }
    }

    // Return abort function
    return () => {
      if (abortController) {
        abortController.abort()
        abortController = null
      }
    }
  }

  /**
   * Save chat history to localStorage
   */
  saveChatHistory(messages: ChatMessage[]): void {
    try {
      const data = messages.map(msg => ({
        ...msg,
        timestamp: msg.timestamp.toISOString()
      }))
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save chat history:', error)
    }
  }

  /**
   * Load chat history from localStorage
   */
  loadChatHistory(): ChatMessage[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY)
      if (!data) return []

      const parsed = JSON.parse(data)
      return parsed.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }))
    } catch (error) {
      console.error('Failed to load chat history:', error)
      return []
    }
  }

  /**
   * Clear chat history from localStorage
   */
  clearChatHistory(): void {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.error('Failed to clear chat history:', error)
    }
  }

  /**
   * Convert messages to context format for API
   */
  messagesToContext(messages: ChatMessage[]): ChatAiContext[] {
    const context: ChatAiContext[] = []

    for (let i = 0; i < messages.length - 1; i += 2) {
      const userMsg = messages[i]
      const assistantMsg = messages[i + 1]

      if (userMsg?.role === 'user' && assistantMsg?.role === 'assistant') {
        context.push({
          question: userMsg.content,
          answer: assistantMsg.content
        })
      }
    }

    return context
  }
}

const aiSearchService = new AISearchService()
export default aiSearchService
