/**
 * Search Service with Vector Embeddings
 * Provides semantic search using pre-computed embeddings
 */

// Lazy load transformers only when needed
let transformersModule: any = null

async function loadTransformers() {
  if (!transformersModule) {
    transformersModule = await import('@xenova/transformers')
    transformersModule.env.allowLocalModels = false
    transformersModule.env.allowRemoteModels = true
  }
  return transformersModule
}

interface PageChunk {
  id: string
  pageId: string
  pagePath: string
  pageTitle: string
  sectionTitle: string
  content: string
  headingId?: string
  position: number
  version: string
  tab: string
  embedding?: number[]
}

interface SearchIndex {
  chunks: PageChunk[]
  metadata: {
    generatedAt: string
    totalChunks: number
    totalPages: number
  }
}

interface SearchResult {
  chunk: PageChunk
  score: number
  matches: string[]
  preview: string
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vec1: number[], vec2: number[]): number {
  if (vec1.length !== vec2.length) {
    return 0
  }

  let dotProduct = 0
  let mag1 = 0
  let mag2 = 0

  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i]
    mag1 += vec1[i] * vec1[i]
    mag2 += vec2[i] * vec2[i]
  }

  const magnitude = Math.sqrt(mag1) * Math.sqrt(mag2)
  if (magnitude === 0) {
    return 0
  }

  return dotProduct / magnitude
}

/**
 * Simple tokenizer for text
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(token => token.length > 2)
}

/**
 * Extract preview snippet with highlighted matches
 */
function extractPreview(content: string, query: string, maxLength: number = 150): string {
  const queryTokens = tokenize(query)
  const contentLower = content.toLowerCase()

  // Find first match position
  let matchPos = -1
  for (const token of queryTokens) {
    const pos = contentLower.indexOf(token)
    if (pos !== -1 && (matchPos === -1 || pos < matchPos)) {
      matchPos = pos
    }
  }

  // If no match found, return start of content
  if (matchPos === -1) {
    return content.substring(0, maxLength) + (content.length > maxLength ? '...' : '')
  }

  // Extract context around match
  const start = Math.max(0, matchPos - 50)
  const end = Math.min(content.length, matchPos + maxLength)

  let preview = content.substring(start, end)

  if (start > 0) {
    preview = '...' + preview
  }
  if (end < content.length) {
    preview = preview + '...'
  }

  return preview
}

/**
 * Find matching terms in content
 */
function findMatches(content: string, sectionTitle: string, query: string): string[] {
  const queryTokens = tokenize(query)
  const contentTokens = new Set(tokenize(content + ' ' + sectionTitle))
  const matches: string[] = []

  for (const token of queryTokens) {
    if (contentTokens.has(token)) {
      matches.push(token)
    }
  }

  return matches
}

/**
 * Generate embedding for query text using a simple hashing approach
 * This is a fallback when we can't use the real model in the browser
 */
function generateSimpleEmbedding(text: string, dimensions: number = 384): number[] {
  const tokens = tokenize(text)
  const embedding = new Array(dimensions).fill(0)

  // Simple hash-based embedding
  for (const token of tokens) {
    let hash = 0
    for (let i = 0; i < token.length; i++) {
      hash = ((hash << 5) - hash) + token.charCodeAt(i)
      hash = hash & hash // Convert to 32bit integer
    }

    // Distribute across dimensions
    for (let i = 0; i < dimensions; i++) {
      const idx = (Math.abs(hash) + i * 31) % dimensions
      embedding[idx] += 1 / tokens.length
    }
  }

  // Normalize
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0))
  if (magnitude > 0) {
    for (let i = 0; i < embedding.length; i++) {
      embedding[i] /= magnitude
    }
  }

  return embedding
}

class SearchService {
  private index: SearchIndex | null = null
  private isLoading = false
  private embedder: any = null
  private isLoadingModel = false
  private isProductionMode: boolean

  constructor() {
    // Check if we're in production mode (VITE_MODE=production or VITE_MODE not set)
    const viteMode = import.meta.env.VITE_MODE
    this.isProductionMode = !viteMode || viteMode === 'production'
  }

  /**
   * Load embedding model for generating query embeddings
   */
  async loadEmbeddingModel(): Promise<void> {
    if (this.embedder) {
      return
    }

    if (this.isLoadingModel) {
      // Wait for current load to complete
      await new Promise(resolve => {
        const check = setInterval(() => {
          if (!this.isLoadingModel) {
            clearInterval(check)
            resolve(undefined)
          }
        }, 100)
      })
      return
    }

    this.isLoadingModel = true

    try {
      // Dynamically import transformers only when needed
      const { pipeline } = await loadTransformers()
      this.embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2')
    } catch (error) {
      console.error('Failed to load embedding model:', error)
      throw error
    } finally {
      this.isLoadingModel = false
    }
  }

  /**
   * Generate embedding for query using the same model as chunks
   */
  async generateQueryEmbedding(text: string): Promise<number[]> {
    await this.loadEmbeddingModel()

    try {
      const output = await this.embedder(text, { pooling: 'mean', normalize: true })
      return Array.from(output.data)
    } catch (error) {
      console.error('Failed to generate query embedding:', error)
      // Fallback to simple embedding
      return generateSimpleEmbedding(text)
    }
  }

  /**
   * Load search index
   */
  async loadIndex(): Promise<void> {
    if (this.index) {
      return
    }

    if (this.isLoading) {
      // Wait for current load to complete
      await new Promise(resolve => {
        const check = setInterval(() => {
          if (!this.isLoading) {
            clearInterval(check)
            resolve(undefined)
          }
        }, 100)
      })
      return
    }

    this.isLoading = true

    try {
      // Import fetchWithAuth utilities
      const { getBackendUrl, fetchWithAuth, isMultiTenantMode } = await import('../utils/fetchWithAuth')

      // Determine the correct path based on mode
      let indexUrl: string
      if (isMultiTenantMode()) {
        // Multi-tenant mode: load from backend with auth
        indexUrl = `${getBackendUrl()}/search-index`
      } else if (this.isProductionMode) {
        // Production: load from public folder
        indexUrl = '/search-index.json'
      } else {
        // Dev/Preview: load from backend API
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080/api'
        indexUrl = `${backendUrl}/search-index`
      }

      const response = await fetchWithAuth(indexUrl)

      if (!response.ok) {
        throw new Error('Failed to load search index')
      }

      this.index = await response.json()

    } catch (error) {
      console.error('Error loading search index:', error)
      throw error
    } finally {
      this.isLoading = false
    }
  }

  /**
   * Search using vector similarity if embeddings available, otherwise fallback to keyword search
   */
  async search(query: string, maxResults: number = 10): Promise<SearchResult[]> {
    if (!query.trim()) {
      return []
    }

    // Ensure index is loaded
    await this.loadIndex()

    if (!this.index) {
      return []
    }

    const results: SearchResult[] = []

    // Check if we have embeddings
    const hasEmbeddings = this.index.chunks.some(chunk => chunk.embedding && chunk.embedding.length > 0)

    if (hasEmbeddings) {
      // Vector search with real embeddings
      const queryEmbedding = await this.generateQueryEmbedding(query)

      for (const chunk of this.index.chunks) {
        if (!chunk.embedding || chunk.embedding.length === 0) {
          continue
        }

        // Calculate cosine similarity
        let score = cosineSimilarity(queryEmbedding, chunk.embedding)

        // Boost score if query appears in title or content (hybrid search)
        const queryLower = query.toLowerCase()
        if (chunk.sectionTitle.toLowerCase().includes(queryLower)) {
          score *= 1.5
        }
        if (chunk.pageTitle.toLowerCase().includes(queryLower)) {
          score *= 1.2
        }

        // Only include results with meaningful scores (cosine similarity ranges from -1 to 1)
        // We use a lower threshold since we're using real embeddings now
        if (score > 0.15) {
          const matches = findMatches(chunk.content, chunk.sectionTitle, query)
          const preview = extractPreview(chunk.content, query)

          results.push({
            chunk,
            score,
            matches,
            preview
          })
        }
      }
    } else {
      // Fallback keyword search
      const queryTokens = tokenize(query)

      for (const chunk of this.index.chunks) {
        const contentTokens = tokenize(chunk.content + ' ' + chunk.sectionTitle + ' ' + chunk.pageTitle)

        // Simple matching score
        let matchCount = 0
        for (const queryToken of queryTokens) {
          if (contentTokens.some(t => t.includes(queryToken) || queryToken.includes(t))) {
            matchCount++
          }
        }

        if (matchCount > 0) {
          let score = matchCount / queryTokens.length

          // Boost for title matches
          if (chunk.sectionTitle.toLowerCase().includes(query.toLowerCase())) {
            score *= 2
          }

          const matches = findMatches(chunk.content, chunk.sectionTitle, query)
          const preview = extractPreview(chunk.content, query)

          results.push({
            chunk,
            score,
            matches,
            preview
          })
        }
      }
    }

    // Sort by score descending
    results.sort((a, b) => b.score - a.score)

    // Return top results
    return results.slice(0, maxResults)
  }

  /**
   * Get index metadata
   */
  getMetadata() {
    return this.index?.metadata || null
  }

  /**
   * Check if index is loaded
   */
  isIndexLoaded(): boolean {
    return this.index !== null
  }
}

export const searchService = new SearchService()
export type { SearchResult, PageChunk }
