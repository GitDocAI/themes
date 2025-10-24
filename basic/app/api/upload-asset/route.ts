import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function POST(request: NextRequest) {
  try {
    // Only allow in development mode for security
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { error: 'File upload only available in development mode' },
        { status: 403 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type (images only)
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Only image files are allowed' },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      )
    }

    // Generate unique filename 
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const extension = originalName.split('.').pop()
    const filename = `${originalName.split('.')[0]}.${extension}` 

    // Get webhook configuration 
    const webhookUrl = process.env.WEBHOOK_URL
    const authentication = process.env.AUTHENTICATION

    // Try webhook first 
    if (webhookUrl) {
      try {
        console.log('Attempting to upload asset via webhook:', webhookUrl)
        
        const webhookFormData = new FormData()
        const assetPath = `./assets/${filename}` 
        
        console.log('Asset path:', assetPath)
        console.log('Filename:', filename)
        console.log('File size:', file.size)
        console.log('File type:', file.type)
        console.log('File name:', file.name)
        
        webhookFormData.append('binary_content', file, filename) 
        webhookFormData.append('file_path', assetPath)
        
        // Debug FormData contents
        console.log('FormData entries:')
        for (const [key, value] of webhookFormData.entries()) {
          console.log(`- ${key}:`, typeof value === 'object' ? `File(${value.name}, ${value.size} bytes)` : value)
        }

        const webhookResponse = await fetch(webhookUrl, {
          method: 'POST',
          body: webhookFormData,
          // Let browser handle Content-Type for FormData like CustomToolbarButtons
          ...(authentication && {
            headers: {
              'Authorization': authentication
            }
          })
        })

        if (webhookResponse.ok) {
          console.log('Asset uploaded via webhook successfully')
          return NextResponse.json({
            success: true,
            url: `/assets/${filename}`,
            filename: filename,
            method: 'webhook'
          })
        } else {
          const errorText = await webhookResponse.text()
          console.warn('Webhook upload failed:', webhookResponse.status, errorText)
          console.log('Falling back to local file system')
        }
      } catch (webhookError) {
        console.warn('Webhook upload error:', webhookError)
        console.log('Falling back to local file system')
      }
    } else {
      console.log('No webhook configured for assets, using local file system')
    }

    // Fallback: save locally (existing code)
    const assetsDir = join(process.cwd(), 'public', 'assets')
    if (!existsSync(assetsDir)) {
      await mkdir(assetsDir, { recursive: true })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const filePath = join(assetsDir, filename)

    await writeFile(filePath, buffer)

    console.log('Asset saved locally to:', filePath)

    return NextResponse.json({
      success: true,
      url: `/assets/${filename}`,
      filename: filename,
      method: 'local_file'
    })

  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}