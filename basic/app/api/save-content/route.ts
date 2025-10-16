import { NextRequest, NextResponse } from 'next/server'
import { writeFile, readFile } from 'fs/promises'
import { join } from 'path'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { file_path, old_segment, new_text } = body

    if (!file_path || !old_segment || !new_text) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Construir la ruta completa al archivo
    const contentDir = join(process.cwd(), 'content')
    const fullPath = join(contentDir, file_path)

    // Leer el archivo actual
    const currentContent = await readFile(fullPath, 'utf-8')

    // Reemplazar el segmento viejo con el nuevo
    const updatedContent = currentContent.replace(old_segment, new_text)

    // Guardar el archivo actualizado
    await writeFile(fullPath, updatedContent, 'utf-8')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving content:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
