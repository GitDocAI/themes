import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const filePath = searchParams.get('path')

    if (!filePath) {
      return NextResponse.json(
        { error: 'Missing path parameter' },
        { status: 400 }
      )
    }

    // Remove leading slash if present
    const cleanPath = filePath.startsWith('/') ? filePath.substring(1) : filePath

    // Construct the full file path
    // Assuming MDX files are in the content directory
    const fullPath = path.join(process.cwd(), 'content', cleanPath)

    // Security check: ensure the path is within the content directory
    const contentDir = path.join(process.cwd(), 'content')
    const resolvedPath = path.resolve(fullPath)

    if (!resolvedPath.startsWith(contentDir)) {
      return NextResponse.json(
        { error: 'Invalid path' },
        { status: 403 }
      )
    }

    // Read the file
    const content = await fs.readFile(resolvedPath, 'utf-8')

    return NextResponse.json({ content })
  } catch (error) {
    console.error('Error reading markdown file:', error)

    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
