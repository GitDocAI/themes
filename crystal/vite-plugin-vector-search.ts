import type { Plugin } from 'vite'
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join, relative } from 'path'
import { pipeline } from '@xenova/transformers'
import { MDXParserService } from './src/services/mdxParser'

interface TiptapNode {
  type: string
  attrs?: Record<string, any>
  content?: TiptapNode[]
  text?: string
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

/**
 * Extract text content from Tiptap nodes recursively
 */
function extractTextFromNode(node: TiptapNode): string {
  let text = ''

  if (node.text) {
    text += node.text
  }

  if (node.content && Array.isArray(node.content)) {
    for (const child of node.content) {
      text += extractTextFromNode(child)
    }
  }

  return text
}

/**
 * Generate ID for heading based on content (like GitHub)
 */
function generateHeadingId(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
}

/**
 * Chunk a page into searchable sections based on headings
 */
function chunkPage(
  pageContent: any,
  pagePath: string,
  version: string,
  tab: string
): PageChunk[] {
  const chunks: PageChunk[] = []

  if (!pageContent) {
    return chunks
  }

  // Handle both direct Tiptap doc structure and wrapped structure
  const doc = pageContent.type === 'doc' ? pageContent : pageContent.content
  if (!doc || !doc.content || !Array.isArray(doc.content)) {
    return chunks
  }

  let pageTitle = 'Untitled'
  let currentSection = {
    title: '',
    content: '',
    headingId: undefined as string | undefined,
    level: 0
  }
  let chunkPosition = 0

  for (const node of doc.content) {
    // Handle headings
    if (node.type === 'heading') {
      const headingText = extractTextFromNode(node).trim()
      const headingLevel = node.attrs?.level || 1

      // First h1 becomes page title
      if (headingLevel === 1 && !pageTitle) {
        pageTitle = headingText
      }

      // Save previous section if it has content
      if (currentSection.content.trim()) {
        chunks.push({
          id: `${pagePath}#chunk-${chunkPosition}`,
          pageId: pagePath,
          pagePath,
          pageTitle,
          sectionTitle: currentSection.title || pageTitle,
          content: currentSection.content.trim(),
          headingId: currentSection.headingId,
          position: chunkPosition++,
          version,
          tab
        })
      }

      // Start new section
      currentSection = {
        title: headingText,
        content: '',
        headingId: generateHeadingId(headingText),
        level: headingLevel
      }
    }
    // Accumulate content in current section
    else {
      const text = extractTextFromNode(node)

      // Add spacing between blocks
      if (text.trim()) {
        currentSection.content += text + ' '
      }

      // For very long sections, split into smaller chunks (max ~500 words)
      if (currentSection.content.split(/\s+/).length > 500) {
        chunks.push({
          id: `${pagePath}#chunk-${chunkPosition}`,
          pageId: pagePath,
          pagePath,
          pageTitle,
          sectionTitle: currentSection.title || pageTitle,
          content: currentSection.content.trim(),
          headingId: currentSection.headingId,
          position: chunkPosition++,
          version,
          tab
        })

        // Continue section but reset content
        currentSection.content = ''
      }
    }
  }

  // Save last section
  if (currentSection.content.trim()) {
    chunks.push({
      id: `${pagePath}#chunk-${chunkPosition}`,
      pageId: pagePath,
      pagePath,
      pageTitle,
      sectionTitle: currentSection.title || pageTitle,
      content: currentSection.content.trim(),
      headingId: currentSection.headingId,
      position: chunkPosition++,
      version,
      tab
    })
  }

  return chunks
}

/**
 * Recursively find all MDX files in a directory
 */
function findMdxFiles(dir: string, baseDir: string = dir): string[] {
  const files: string[] = []

  try {
    const entries = readdirSync(dir)

    for (const entry of entries) {
      const fullPath = join(dir, entry)
      const stat = statSync(fullPath)

      if (stat.isDirectory()) {
        files.push(...findMdxFiles(fullPath, baseDir))
      } else if (entry.endsWith('.mdx')) {
        files.push(relative(baseDir, fullPath))
      }
    }
  } catch (error) {
    console.warn(`Warning: Could not read directory ${dir}:`, error)
  }

  return files
}

/**
 * Parse version and tab from file path
 */
function parsePathMetadata(filePath: string): { version: string; tab: string } {
  const parts = filePath.split('/')

  // Extract version (e.g., v1.0.0)
  const version = parts.find(p => p.startsWith('v')) || 'unknown'

  // Extract tab (documentation, api_reference, etc.)
  const tabIndex = parts.findIndex(p => p.startsWith('v')) + 1
  const tab = tabIndex > 0 && tabIndex < parts.length
    ? parts[tabIndex].replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    : 'Unknown'

  return { version, tab }
}

/**
 * Vite plugin to generate search index at build time
 */
export default function vectorSearchPlugin(viteMode?: string): Plugin {
  return {
    name: 'vite-plugin-vector-search',

    async buildStart() {
      // Only run in production mode (when VITE_MODE is production or not set)
      const isProduction = !viteMode || viteMode === 'production'

      if (!isProduction) {
        console.log(`\n⏭️  Skipping search index generation (VITE_MODE=${viteMode})\n`)
        return
      }

      console.log('\n🔍 Generating search index with embeddings...\n')

      // Initialize embedding model
      console.log('⚡ Loading embedding model (Xenova/all-MiniLM-L6-v2)...')
      const embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2')
      console.log('✅ Model loaded!\n')

      const publicDir = join(process.cwd(), 'public')
      const allChunks: PageChunk[] = []

      // Initialize MDX parser
      const mdxParser = new MDXParserService()

      // Find all MDX files
      const mdxFiles = findMdxFiles(publicDir)
      console.log(`📄 Found ${mdxFiles.length} MDX files`)

      let processedPages = 0

      for (const filePath of mdxFiles) {
        const fullPath = join(publicDir, filePath)

        try {
          const mdxContent = readFileSync(fullPath, 'utf-8')

          // Parse MDX to TipTap JSON
          const pageData = await mdxParser.parse(mdxContent)

          // Parse metadata from path
          const { version, tab } = parsePathMetadata(filePath)

          // Convert path to match app's routing
          const pagePath = '/' + filePath

          // Chunk the page
          const chunks = chunkPage(pageData, pagePath, version, tab)

          if (chunks.length > 0) {
            allChunks.push(...chunks)
            processedPages++
          }
        } catch (error) {
          console.warn(`  ⚠️  Failed to process ${filePath}:`, error)
        }
      }

      // Generate embeddings for all chunks
      console.log(`\n🧠 Generating embeddings for ${allChunks.length} chunks...`)
      for (let i = 0; i < allChunks.length; i++) {
        const chunk = allChunks[i]

        // Combine title and content for better semantic understanding
        const textToEmbed = `${chunk.sectionTitle}. ${chunk.content}`.substring(0, 512) // Limit to 512 chars

        try {
          const output = await embedder(textToEmbed, { pooling: 'mean', normalize: true })
          chunk.embedding = Array.from(output.data)

          // Progress indicator
          if ((i + 1) % 5 === 0 || i === allChunks.length - 1) {
            console.log(`  Progress: ${i + 1}/${allChunks.length} chunks embedded`)
          }
        } catch (error) {
          console.warn(`  ⚠️  Failed to generate embedding for chunk ${chunk.id}:`, error)
        }
      }

      // Create search index
      const searchIndex: SearchIndex = {
        chunks: allChunks,
        metadata: {
          generatedAt: new Date().toISOString(),
          totalChunks: allChunks.length,
          totalPages: processedPages
        }
      }

      // Write index to public directory
      const indexPath = join(publicDir, 'search-index.json')
      writeFileSync(indexPath, JSON.stringify(searchIndex, null, 2))

      console.log(`\n✅ Search index generated successfully!`)
      console.log(`   Pages processed: ${processedPages}`)
      console.log(`   Total chunks: ${allChunks.length}`)
      console.log(`   Index size: ${(Buffer.byteLength(JSON.stringify(searchIndex)) / 1024).toFixed(2)} KB`)
      console.log(`   Output: ${indexPath}\n`)
    }
  }
}
