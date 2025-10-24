import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import { join } from 'path'

export async function POST(request: NextRequest) {
  try {
    const configData = await request.json()

    // Validar que es desarrollo
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { success: false, error: 'Configuration editing is only available in development mode' },
        { status: 403 }
      )
    }

    // Get webhook configuration (same as MDXEditor)
    const webhookUrl = process.env.WEBHOOK_URL
    const authentication = process.env.AUTHENTICATION

    // Primero intentar guardar via webhook (si está configurado)
    if (webhookUrl) {
      try {
        console.log('Attempting to save config via webhook:', webhookUrl)
        
        const webhookResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(authentication && { Authorization: authentication }),
          },
          body: JSON.stringify({
            file_path: 'gitdocai.config.json',
            new_text: JSON.stringify(configData, null, 2),
          }),
        })

        if (webhookResponse.ok) {
          console.log('Configuration saved via webhook successfully')
          return NextResponse.json({ 
            success: true, 
            method: 'webhook',
            webhookUrl: webhookUrl 
          })
        } else {
          const errorText = await webhookResponse.text()
          console.warn('Webhook failed:', webhookResponse.status, errorText)
          console.log('Falling back to local file system')
        }
      } catch (webhookError) {
        console.warn('Webhook error:', webhookError)
        console.log('Falling back to local file system')
      }
    } else {
      console.log('No webhook configured, using local file system')
    }

    // Fallback: guardar localmente
    const configPath = join(process.cwd(), 'gitdocai.config.json')
    const formattedConfig = JSON.stringify(configData, null, 2)

    await new Promise(resolve => setTimeout(resolve, 100))
    await writeFile(configPath, formattedConfig, 'utf-8')

    console.log('Configuration saved locally to:', configPath)
    
    return NextResponse.json({ 
      success: true, 
      method: 'local_file',
      path: configPath 
    })
    
  } catch (error) {
    console.error('Error saving configuration:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}