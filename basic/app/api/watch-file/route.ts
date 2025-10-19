import { NextRequest } from 'next/server'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const filePath = searchParams.get('path')

  if (!filePath) {
    return new Response('Missing path parameter', { status: 400 })
  }

  const cleanPath = filePath.startsWith('/') ? filePath.substring(1) : filePath
  const fullPath = path.join(process.cwd(), 'content', cleanPath)

  // Security check
  const contentDir = path.join(process.cwd(), 'content')
  const resolvedPath = path.resolve(fullPath)
  if (!resolvedPath.startsWith(contentDir)) {
    return new Response('Invalid path', { status: 403 })
  }

  // Create a readable stream for SSE
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      controller.enqueue(`data: ${JSON.stringify({ type: 'connected' })}\n\n`)

      let watcher: fs.FSWatcher | null = null

      try {
        // Watch for file changes
        watcher = fs.watch(fullPath, (eventType) => {
          if (eventType === 'change') {
            controller.enqueue(`data: ${JSON.stringify({ type: 'change' })}\n\n`)
          }
        })

        // Handle client disconnect
        request.signal.addEventListener('abort', () => {
          if (watcher) {
            watcher.close()
          }
          controller.close()
        })
      } catch (error) {
        controller.enqueue(`data: ${JSON.stringify({ type: 'error', message: 'File not found' })}\n\n`)
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
